const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const dbConnector = require("../../utils/duckdbConnector.js");

const {
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

const s3 = require("../../utils/s3");
const AuthMiddleware = require("../../middleware/authentication.js");
const { allowRoles } = require("../../middleware/rbac.js");

const router = express.Router();

const upload = multer({
  dest: "./temp/uploads",
});

const S3_REPORT_KEY = "reports/unmapped-report.csv";


router.use(AuthMiddleware);
router.use(allowRoles("admin", "superadmin"));
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
    let connector;

    try {
      const pkg = req?.user?.pkg;
      const files = req.files;
      const commFile = files.comm?.[0];
      const issueFile = files.issue?.[0];
      const miFile = files.mi?.[0];

      if (!commFile || !issueFile || !miFile) {
        uploadedFiles = [commFile, issueFile, miFile].filter(Boolean);

        await Promise.all(
          uploadedFiles.map((file) =>
            fs.unlink(file.path).catch(() => {})
          )
        );

        return res.status(400).json({
          error: "comm, issue and mi files are required",
        });
      }

      uploadedFiles = [commFile, issueFile, miFile];

      connector = await dbConnector();

      outputFile = path.resolve(
        "./temp/uploads",
        `unmapped-result-${Date.now()}.csv`
      );

      const escapePath = (p) => p.replace(/'/g, "''");

      await connector.run(`
        COPY (
          SELECT
            issue."MSN",
            issue."Date of Issue",
            issue."Name of Sub-contractor",
            issue."Type of Meter",
            issue."Store",
            issue."Name of Employee",
            issue."Installer Name",
            issue."Subdivision Name",
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
            END AS "Mapping Status",

            CASE
  WHEN COALESCE(
    TRY_STRPTIME(issue."Date of Issue", '%m/%d/%Y'),
    TRY_STRPTIME(issue."Date of Issue", '%d/%m/%Y'),
    TRY_STRPTIME(issue."Date of Issue", '%d-%m-%Y')
  ) IS NULL
    THEN 'Unknown'

  WHEN (
    CURRENT_DATE -
    CAST(
      COALESCE(
        TRY_STRPTIME(issue."Date of Issue", '%m/%d/%Y'),
        TRY_STRPTIME(issue."Date of Issue", '%d/%m/%Y'),
        TRY_STRPTIME(issue."Date of Issue", '%d-%m-%Y')
      ) AS DATE
    )
  ) > 180
    THEN '180 Days Above'

  WHEN (
    CURRENT_DATE -
    CAST(
      COALESCE(
        TRY_STRPTIME(issue."Date of Issue", '%m/%d/%Y'),
        TRY_STRPTIME(issue."Date of Issue", '%d/%m/%Y'),
        TRY_STRPTIME(issue."Date of Issue", '%d-%m-%Y')
      ) AS DATE
    )
  ) > 90
    THEN '90-180 Days'

  WHEN (
    CURRENT_DATE -
    CAST(
      COALESCE(
        TRY_STRPTIME(issue."Date of Issue", '%m/%d/%Y'),
        TRY_STRPTIME(issue."Date of Issue", '%d/%m/%Y'),
        TRY_STRPTIME(issue."Date of Issue", '%d-%m-%Y')
      ) AS DATE
    )
  ) > 60
    THEN '60-90 Days'

  WHEN (
    CURRENT_DATE -
    CAST(
      COALESCE(
        TRY_STRPTIME(issue."Date of Issue", '%m/%d/%Y'),
        TRY_STRPTIME(issue."Date of Issue", '%d/%m/%Y'),
        TRY_STRPTIME(issue."Date of Issue", '%d-%m-%Y')
      ) AS DATE
    )
  ) > 30
    THEN '30-60 Days'

  ELSE 'Below 30 Days'
END AS "Issue Age"

          FROM read_csv_auto(
            '${escapePath(issueFile.path)}',
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
            '${escapePath(miFile.path)}',
            types={
              "New Meter Serial No": "VARCHAR"
            }
          ) mi
            ON issue."MSN" = mi."New Meter Serial No"

          LEFT JOIN read_csv_auto(
            '${escapePath(commFile.path)}',
            types={
              "Meter Number": "VARCHAR",
              "Last Communication Date": "VARCHAR"
            }
          ) comm
            ON issue."MSN" = comm."Meter Number"

        ) TO '${escapePath(outputFile)}'
        WITH (
          HEADER,
          DELIMITER ',',
          QUOTE '"'
        )
      `);

      // Verify generated file
      const stat = await fs.stat(outputFile).catch(() => null);

      if (!stat || stat.size === 0) {
        throw new Error(
          "Report generation produced an empty or missing file"
        );
      }

      // Upload generated report to S3
      //
      // IMPORTANT:
      // Using the same Key automatically replaces the previous object.
      const reportBuffer = await fs.readFile(outputFile);

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: `${pkg}/${S3_REPORT_KEY}`,
          Body: reportBuffer,
          ContentType: "text/csv",
        })
      );

      console.log(
        `Report uploaded to S3: ${pkg}/${S3_REPORT_KEY}`
      );

      // Delete original uploaded input files
      await Promise.all(
        uploadedFiles.map((file) =>
          fs.unlink(file.path).catch(() => {})
        )
      );

      // Send generated CSV to admin
      res.download(
        outputFile,
        "unmapped-report.csv",
        async (error) => {
          try {
            await fs.unlink(outputFile);
          } catch {}

          if (error) {
            console.error(
              "CSV download failed:",
              error
            );
          }
        }
      );
    } catch (error) {
      console.error(
        "Report generation failed:",
        error
      );

      // Cleanup input files
      await Promise.all(
        uploadedFiles.map(async (file) => {
          try {
            await fs.unlink(file.path);
          } catch {}
        })
      );

      // Cleanup generated file
      if (outputFile) {
        try {
          await fs.unlink(outputFile);
        } catch {}
      }

      if (!res.headersSent) {
        res.status(500).json({
          error: "Failed to process CSV files",
        });
      }
    } finally {
      if (
        connector &&
        typeof connector.close === "function"
      ) {
        try {
          await connector.close();
        } catch (closeErr) {
          console.error(
            "Error closing DuckDB connector:",
            closeErr
          );
        }
      }
    }
  }
);

module.exports = router;