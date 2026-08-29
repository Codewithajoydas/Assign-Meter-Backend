const express = require("express");
const router = express.Router();
const fs = require("node:fs");
const fsp = require("node:fs").promises;
const path = require("node:path");
const { pipeline } = require("node:stream/promises");
const jwt = require("jsonwebtoken");
const userDB = require("../../models/user");
const meter = require("../../models/meter");
const dbConnector = require("../../utils/duckdbConnector.js");
const {
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const s3 = require("../../utils/s3");
const AuthMiddleware = require("../../middleware/authentication.js");
const { allowRoles } = require("../../middleware/rbac.js");
const S3_REPORT_KEY = "reports/unmapped-report.csv";

router.use(AuthMiddleware);
router.use(allowRoles("admin", "superadmin", "supervisor"));
router.get("/", async (req, res) => {
  let connector;
  let tempReportPath = "";

  try {
    const user = req.user;
    const pkg = user.pkg;

    // Find meters assigned to supervisor
    const meters = await meter.find({
      supervisor: user._id,
      pkg
    });

    const meterNumbers = meters.map((item) =>
      String(item.meterNumber)
    );

    // No meters
    if (meterNumbers.length === 0) {
      return res.status(200).json({
        status: "success",
        count: 0,
        data: [],
      });
    }

    /*
     * Download latest report from S3
     * into a temporary Render file.
     */

    tempReportPath = path.resolve(
      "./temp/uploads",
      `unmapped-report-${Date.now()}.csv`
    );

    await fsp.mkdir(
      path.dirname(tempReportPath),
      {
        recursive: true,
      }
    );

    let s3Response;

    try {
      s3Response = await s3.send(
        new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: `${pkg}/${S3_REPORT_KEY}`,
        })
      );
    } catch (error) {
      if (
        error.name === "NoSuchKey" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return res.status(404).json({
          status: "error",
          message:
            "Report not found. Please ask the admin to generate the report.",
        });
      }

      throw error;
    }

    // Save S3 stream to temporary local file
    await pipeline(
      s3Response.Body,
      fs.createWriteStream(tempReportPath)
    );

    // Create DuckDB connection
    connector = await dbConnector();

    // Create SQL IN list
    const meterNumberList = meterNumbers
      .map(
        (number) =>
          `'${number.replace(/'/g, "''")}'`
      )
      .join(", ");

    const safeReportPath =
      tempReportPath.replace(/'/g, "''");

    const query = `
      SELECT *
      FROM read_csv_auto('${safeReportPath}')
      WHERE CAST("MSN" AS VARCHAR)
      IN (${meterNumberList})
    `;

    // Run query
    const reader =
      await connector.runAndReadAll(query);

    const columnNames =
      reader.columnNames();

    const rowsJson =
      reader.getRowsJson();

    const data = rowsJson.map((row) =>
      Object.fromEntries(
        columnNames.map((col, i) => [
          col,
          row[i],
        ])
      )
    );

    return res.status(200).json({
      status: "success",
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(
      "Error generating the report:",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Failed to generate the report",
    });
  } finally {
    // Close DuckDB
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

    // Delete temporary S3-downloaded report
    if (tempReportPath) {
      try {
        await fsp.unlink(tempReportPath);
      } catch {}
    }
  }
});

module.exports = router;