const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const dbConnector = require("../utils/duckdbConnector");
const router = express.Router();

const upload = multer({
  dest: "./temp/uploads",
});

// Folder where the latest generated report is saved permanently
const REPORTS_DIR = "./reports";
const SAVED_REPORT_PATH = path.resolve(REPORTS_DIR, "unmapped-report.csv");


router.post(
  "/",
  upload.fields([
    { name: "comm", maxCount: 1 },
    { name: "issue", maxCount: 1 },
    { name: "mi", maxCount: 1 },
  ]),
  async (req, res) => {
    let uploadedFiles = [];
    let outputFile = "";

    try {
      const files = req.files;

      const commFile = files.comm?.[0];
      const issueFile = files.issue?.[0];
      const miFile = files.mi?.[0];

      if (!commFile || !issueFile || !miFile) {
        return res.status(400).json({
          error: "comm, issue and mi files are required",
        });
      }

      uploadedFiles = [commFile, issueFile, miFile];

      const connector = await dbConnector();

      outputFile = path.resolve(
        "./temp/uploads",
        `unmapped-result-${Date.now()}.csv`
      );

      await connector.run(`
        COPY (
          SELECT
            issue."MSN",
            issue."Date of Issue",
            issue."Name of Sub-contractor",
            issue."Type of Meter",
            issue."Store",
            issue."Name of Employee",
            comm."Last Communication Date",

            CASE
              WHEN mi."New Meter Serial No" IS NOT NULL
                AND comm."Meter Number" IS NOT NULL
                THEN 'Mapped'

              WHEN mi."New Meter Serial No" IS NOT NULL
                AND comm."Meter Number" IS NULL
                THEN 'Never Comm.'

              WHEN mi."New Meter Serial No" IS NULL
                AND comm."Meter Number" IS NULL
                THEN 'Pending'

              ELSE 'Unmapped'
            END AS "Mapping Status"

          FROM read_csv_auto(
            '${issueFile.path}',
            types={
              "MSN": "VARCHAR",
              "Date of Issue": "VARCHAR",
              "Name of Sub-contractor": "VARCHAR",
              "Type of Meter": "VARCHAR",
              "Store": "VARCHAR",
              "Name of Employee": "VARCHAR"
            }
          ) issue

          LEFT JOIN read_csv_auto(
            '${miFile.path}',
            types={
              "New Meter Serial No": "VARCHAR"
            }
          ) mi
            ON issue."MSN" = mi."New Meter Serial No"

          LEFT JOIN read_csv_auto(
            '${commFile.path}',
            types={
              "Meter Number": "VARCHAR",
              "Last Communication Date": "VARCHAR"
            }
          ) comm
            ON issue."MSN" = comm."Meter Number"

        ) TO '${outputFile}'
        WITH (
          HEADER,
          DELIMITER ',',
          QUOTE '"'
        )
      `);

      // Delete uploaded input files
      await Promise.all(
        uploadedFiles.map((file) => fs.unlink(file.path))
      );

      // Make sure the reports folder exists (won't error if it already does)
      await fs.mkdir(REPORTS_DIR, { recursive: true });

      // Save a permanent copy of the latest report.
      // copyFile overwrites SAVED_REPORT_PATH automatically if it already exists,
      // so the old report simply gets replaced by the new one.
      await fs.copyFile(outputFile, SAVED_REPORT_PATH);

      // Send CSV
      res.download(
        outputFile,
        "unmapped-report.csv",
        async (error) => {
          // Delete generated CSV after response
          try {
            await fs.unlink(outputFile);
          } catch {}

          if (error) {
            console.error("CSV download failed:", error);
          }
        }
      );

    } catch (error) {
      console.error("DuckDB query failed:", error);

      // Cleanup uploaded files
      await Promise.all(
        uploadedFiles.map(async (file) => {
          try {
            await fs.unlink(file.path);
          } catch {}
        })
      );

      // Cleanup output file
      if (outputFile) {
        try {
          await fs.unlink(outputFile);
        } catch {}
      }

      res.status(500).json({
        error: "Failed to process CSV files",
      });
    }
  }
);

module.exports = router;