"use strict";

const fs = require("fs");
const csv = require("csv-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const meterDB = require("./models/meter");

// ================= DB CONNECT =================
mongoose.connect(process.env.MONGOOSE_URL);

mongoose.connection.on("connected", () => {
  console.log("MongoDB Connected ✅");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB Error ❌", err);
});

// ================= CONFIG =================
const BATCH_SIZE = 1000;
let batch = [];

let totalInserted = 0;
let totalSkipped = 0;
let totalFailed = 0;

const failedRows = [];

// ================= HELPERS =================
const normalize = (val) =>
  String(val || "")
    .replace(/[\r\n\t]/g, "")
    .trim();

const normalizeHeader = (header) =>
  header
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");

const normalizeEquip = (val) => {
  const v = normalize(val).toUpperCase();
  const allowed = ["CT", "METER", "NIC", "PT", "SEAL", "SIM"];
  return allowed.includes(v) ? v : null;
};

const normalizeMeterType = (val) => {
  const v = normalize(val).replace(/\s+/g, "");
  const allowed = [
    "1P,2W,5-30A",
    "3P,4W,-/1A",
    "3P,4W,-/5A",
    "3P,4W,10-60A",
    "3P,4W,100/5A",
    "3P,4W,200/5A",
    "3P,4W,400/5A",
    "3P,4W,50/5A",
  ];
  return allowed.includes(v) ? v : null;
};

const normalizePkg = (val) => {
  const v = normalize(val).toUpperCase();
  if (!v) return undefined;

  const match = v.match(/ASS\s*-?\s*(\d+)/);
  if (match) return `ASS${match[1]}`;

  if (v === "ASS") return "ASS1";

  return v;
};

const normalizeStatus = (val) => {
  const v = normalize(val).toLowerCase();
  const allowed = ["active", "inactive", "faulty"];
  return allowed.includes(v) ? v : null;
};

// ================= BATCH INSERT =================
const processBatch = async () => {
  if (batch.length === 0) return;

  const currentBatch = batch;
  batch = [];

  try {
    const result = await meterDB.insertMany(currentBatch, {
      ordered: false,
    });

    totalInserted += result.length;
    console.log(`Inserted: ${totalInserted}`);
  } catch (err) {
    // partial success handling
    if (err.insertedDocs) {
      totalInserted += err.insertedDocs.length;
    }

    if (err.writeErrors) {
      totalFailed += err.writeErrors.length;
    } else {
      totalFailed++;
    }

    console.error("Batch error:", err.message);
  }
};

// ================= STREAM =================
const stream = fs.createReadStream("./meters.csv").pipe(
  csv({
    mapHeaders: ({ header }) => normalizeHeader(header),
  }),
);

stream.on("data", async (row) => {
  try {
    const data = {
      meterNumber: normalize(row.meterno || row.meternumber),
      equipCategory: normalizeEquip(row.equipcategory),
      meterType: normalizeMeterType(row.metertype || row.type),
      installationType: normalize(row.installation || row.installationtype),
      storeLocation: normalize(row.store || row.storelocation),
      agency: normalize(row.agency),
      installerId: normalize(row.installerid),
      pkg: normalizePkg(row.pkg) || "ASS3",
      status: normalizeStatus(row.status),
    };

    // ================= VALIDATION =================
    if (
      !data.meterNumber ||
      !data.equipCategory ||
      !data.meterType ||
      !data.storeLocation ||
      !data.agency ||
      !data.installerId ||
      !data.status
    ) {
      totalSkipped++;
      failedRows.push({ reason: "Validation failed", row, parsed: data });
      return;
    }

    batch.push(data);

    if (batch.length >= BATCH_SIZE) {
      stream.pause(); // pause only when needed
      await processBatch();
      stream.resume();
    }
  } catch (err) {
    totalFailed++;
    failedRows.push({ reason: err.message, row });
  }
});

// ================= END =================
stream.on("end", async () => {
  console.log("\nProcessing final batch...");

  await processBatch();

  if (failedRows.length > 0) {
    fs.writeFileSync("failed_rows.json", JSON.stringify(failedRows, null, 2));
  }

  console.log("\n===== RESULT =====");
  console.log("Inserted:", totalInserted);
  console.log("Skipped:", totalSkipped);
  console.log("Failed:", totalFailed);
  console.log("Failed rows saved → failed_rows.json");
  console.log("✅ Migration completed");

  await mongoose.connection.close();
});
