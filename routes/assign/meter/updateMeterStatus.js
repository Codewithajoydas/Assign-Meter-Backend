const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const UserDB = require("../../../models/user");
const MeterDB = require("../../../models/meter");
const XLSX = require("xlsx");
const multer = require("multer");
const { sendEmail } = require("../../../utils/send-mail");
const { Resend } = require("resend");
const AuthMiddleware = require("../../../middleware/authentication");
const { allowRoles } = require("../../../middleware/rbac");
const resend = new Resend(process.env.RESEND_API_KEY || "");

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

const REQUIRED_HEADERS = {
  "equipment number": "Equipment Number",
  "field engineer": "Field Engineer",
  status: "Status",
  remarks: "Remarks",
};

const ALLOWED_STATUSES = ["active", "pending", "installed", "rejected"];
const STATUS_ALIASES = {
  success: "active",
  successful: "active",
  installed: "installed",
  approved: "active",

  failed: "rejected",
  failure: "rejected",
  rejected: "rejected",
  reject: "rejected",

  pending: "pending",
  active: "active",
};

function normalizeStatus(raw) {
  const key = String(raw ?? "")
    .trim()
    .toLowerCase();
  const mapped = STATUS_ALIASES[key];
  return ALLOWED_STATUSES.includes(mapped) ? mapped : null;
}

router.post(
  "/",
  AuthMiddleware,
  allowRoles("admin", "superadmin"),
  (req, res) => {
    upload.single("file")(req, res, async (multerErr) => {
      if (multerErr) {
        console.error("[meter-status] Multer upload error:", multerErr.message);
        const msg =
          multerErr.code === "LIMIT_FILE_SIZE"
            ? "File too large (max 5MB)"
            : "File upload failed";
        return res.status(400).json({ error: msg });
      }
      const user = req?.user;
      const pkg = user.pkg;
      try {
        // ---------- File presence ----------
        const file = req.file;
        if (!file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        // ---------- Parse workbook ----------
        let workbook;
        try {
          workbook = XLSX.read(file.buffer, { type: "buffer" });
        } catch (parseErr) {
          console.error("[meter-status] XLSX parse failed:", parseErr.message);
          return res
            .status(400)
            .json({ error: "Could not read file. Is it a valid .xlsx/.csv?" });
        }

        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          return res.status(400).json({ error: "Workbook has no sheets" });
        }
        const sheet = workbook.Sheets[sheetName];

        const headerRow = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];
        if (!headerRow || headerRow.length === 0) {
          return res
            .status(400)
            .json({ error: "No header row found in sheet" });
        }

        const actualToCanonical = {};
        headerRow.forEach((h) => {
          const norm = String(h ?? "")
            .trim()
            .toLowerCase();
          if (REQUIRED_HEADERS[norm]) {
            actualToCanonical[String(h).trim()] = REQUIRED_HEADERS[norm];
          }
        });

        const foundCanonical = new Set(Object.values(actualToCanonical));
        const missingHeaders = Object.values(REQUIRED_HEADERS).filter(
          (canonical) => !foundCanonical.has(canonical),
        );

        if (missingHeaders.length > 0) {
          return res
            .status(400)
            .json({ error: `Missing headers: ${missingHeaders.join(", ")}` });
        }

        // Re-key every row from whatever casing was in the file to canonical names.
        const rawRows = XLSX.utils.sheet_to_json(sheet);
        const data = rawRows.map((row) => {
          const canonicalRow = {};
          for (const [actualKey, value] of Object.entries(row)) {
            const canonicalKey = actualToCanonical[actualKey.trim()];
            if (canonicalKey) canonicalRow[canonicalKey] = value;
          }
          return canonicalRow;
        });

        // ---------- Dedup + status normalization ----------
        const getUniqueEntries = (rows) => {
          const uniqueEntries = [];
          const invalidStatusRows = [];
          const seen = new Set();
          let skippedIncomplete = 0;

          rows.forEach((entry) => {
            const meterNumber = String(entry["Equipment Number"] ?? "").trim();
            const engineer = String(entry["Field Engineer"] ?? "").trim();
            const rawStatus = String(entry["Status"] ?? "").trim();

            if (!meterNumber || !engineer || !rawStatus) {
              skippedIncomplete++;
              return;
            }

            const normalizedStatus = normalizeStatus(rawStatus);
            if (!normalizedStatus) {
              invalidStatusRows.push({
                "Equipment Number": meterNumber,
                "Field Engineer": engineer,
                Status: rawStatus,
                reason: `"${rawStatus}" is not a recognized status. Allowed: ${ALLOWED_STATUSES.join(", ")} (or their aliases: ${Object.keys(STATUS_ALIASES).join(", ")})`,
              });
              return;
            }

            const key = `${meterNumber}-${engineer}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueEntries.push({
                ...entry,
                "Equipment Number": meterNumber,
                "Field Engineer": engineer,
                Status: normalizedStatus, // now guaranteed to be a valid enum value
              });
            }
          });

          if (skippedIncomplete > 0) {
            console.warn(
              `[meter-status] Skipped ${skippedIncomplete} incomplete row(s) (missing meter/engineer/status)`,
            );
          }
          if (invalidStatusRows.length > 0) {
            console.warn(
              `[meter-status] Skipped ${invalidStatusRows.length} row(s) with unrecognized status value(s)`,
            );
          }
          return { uniqueEntries, invalidStatusRows };
        };

        const { uniqueEntries: uniqueData, invalidStatusRows } =
          getUniqueEntries(data);

        if (uniqueData.length === 0) {
          return res.status(400).json({
            error:
              "No valid rows found after parsing. Check that Equipment Number, Field Engineer, and Status are filled in for at least one row, and that Status values are recognized.",
            invalidStatusRows,
          });
        }

        // ---------- Lookup existing meters ----------
        const checkMeterExistenceInDB = await MeterDB.find({
          meterNumber: { $in: uniqueData.map((e) => e["Equipment Number"]) },
          pkg: user?.pkg,
        })
          .sort({ updatedAt: -1 })
          .populate("supervisor");

        const existingMeterNumbers = new Set(
          checkMeterExistenceInDB.map((m) => m.meterNumber),
        );
        const nonExistingMeters = uniqueData.filter(
          (entry) => !existingMeterNumbers.has(entry["Equipment Number"]),
        );

        // ---------- Bulk update ----------
        // NOTE: if the same meter number appears with two different engineers
        // in this file, bulkWrite runs ordered by default, so the LAST matching
        // row in the array wins and earlier rows for that meter get flipped to
        // "Rejected" by the later row's updateMany. That's an actual behavioral
        // choice, not a bug fix — call it out to your team if unintended.
        const operations = uniqueData.flatMap((entry) => [
          {
            updateOne: {
              filter: {
                meterNumber: entry["Equipment Number"],
                installerId: entry["Field Engineer"],
              },
              update: {
                $set: {
                  status: entry["Status"],
                  remarks: entry["Remarks"] || "",
                },
              },
            },
          },
          {
            updateMany: {
              filter: {
                meterNumber: entry["Equipment Number"],
                installerId: { $ne: entry["Field Engineer"] },
              },
              update: {
                $set: {
                  status: "rejected", // lowercase — must match schema enum exactly
                  remarks: `Meter has been assigned to ${entry["Field Engineer"]}.`,
                },
              },
            },
          },
        ]);

        let result;
        try {
          // runValidators: true makes Mongoose enforce the schema enum (and any
          // other validators) on update operations too — by default Mongoose
          // skips validation on updateOne/updateMany, so without this a status
          // value that somehow slipped past normalizeStatus() would still get
          // written straight into the DB instead of failing loudly.
          result = await MeterDB.bulkWrite(operations, { runValidators: true });
        } catch (dbErr) {
          console.error("[meter-status] bulkWrite failed:", dbErr.message);
          return res
            .status(500)
            .json({ error: "Failed to update meter records" });
        }

        // ---------- Respond FIRST, then do best-effort notification work ----------
        // Nothing after this point may throw into the outer try/catch, since
        // headers are already sent. Each block below is individually guarded.
        res.json({
          message: "File processed successfully",
          data: uniqueData,
          result,
          nonExistingMeters,
          invalidStatusRows,
        });

        // ---------- Supervisor emails (fire-and-forget, fully isolated) ----------
        setImmediate(async () => {
          try {
            const statusByMeterNumber = new Map(
              uniqueData.map((entry) => [
                entry["Equipment Number"],
                entry["Status"],
              ]),
            );

            const emailsBySupervisor = new Map();
            const seenEntries = new Set();

            for (const meter of checkMeterExistenceInDB) {
              const email = meter.supervisor?.email;
              if (!email) continue;

              const newStatus = statusByMeterNumber.get(meter.meterNumber);
              if (!newStatus) continue;

              const dedupeKey = `${email}::${meter.meterNumber}`;
              if (seenEntries.has(dedupeKey)) continue;
              seenEntries.add(dedupeKey);

              if (!emailsBySupervisor.has(email)) {
                emailsBySupervisor.set(email, {
                  name: meter.supervisor.name || "Supervisor",
                  meters: [],
                });
              }
              emailsBySupervisor.get(email).meters.push({
                meterNumber: meter.meterNumber,
                status: newStatus,
              });
            }

            if (emailsBySupervisor.size === 0) {
              console.log(
                "[meter-status] No supervisor emails to send for this batch",
              );
              return;
            }

            const results = await Promise.allSettled(
              Array.from(emailsBySupervisor.entries()).map(([email, info]) => {
                const rows = info.meters
                  .map(
                    (m) =>
                      `<li><strong>${escapeHtml(m.meterNumber)}</strong> — ${escapeHtml(m.status)}</li>`,
                  )
                  .join("");

                const textLines = info.meters
                  .map((m) => `- ${m.meterNumber}: ${m.status}`)
                  .join("\n");

                const plural = info.meters.length > 1 ? "s" : "";

                return resend.emails
                  .send({
                    from: "Assign Meter <onboarding@resend.dev>",
                    to: email,
                    subject: "Meter Status Update — Assign Meter",
                    html: `
    <p>Hi ${escapeHtml(info.name)},</p>
    <p>This is an automated notification from <strong>Assign Meter</strong>.</p>
    <p>
      You are receiving this email because you assigned the meter${plural} listed below to a field installer
      through the Assign Meter app. The installer has since submitted an update, and the status of your
      meter${plural} has changed as follows:
    </p>
    <ul>${rows}</ul>
    <p>Please log in to Assign Meter to review the full details.</p>
    <p style="color:#888;font-size:12px;margin-top:24px;">— Assign Meter (automated notification)</p>
  `,
                  })
                  .then(
                    (r) => ({ email, ok: true, result: r }),
                    (err) => ({ email, ok: false, error: err }),
                  );
              }),
            );

            const failed = results
              .map((r) => r.value ?? r.reason)
              .filter((r) => !r?.ok);

            if (failed.length) {
              console.error(
                `[meter-status] ${failed.length}/${results.length} supervisor email(s) failed to send:`,
                failed.map((f) => ({
                  email: f.email,
                  error: f.error?.message || f.error,
                })),
              );
            } else {
              console.log(
                `[meter-status] Sent ${results.length} supervisor notification email(s) successfully`,
              );
            }
          } catch (notifyErr) {
            // Belt-and-braces: even if something above throws unexpectedly,
            // it can never affect the already-sent HTTP response.
            console.error(
              "[meter-status] Unexpected error while sending supervisor notifications:",
              notifyErr,
            );
          }
        });
      } catch (error) {
        console.error("[meter-status] Error processing file:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Internal server error" });
        }
      }
    });
  },
);

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = router;
