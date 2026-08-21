const express = require("express");
const router = express.Router();

const {
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const s3 = require("../../utils/s3");

const S3_REPORT_KEY = "reports/unmapped-report.csv";

router.get("/", async (req, res) => {
  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: S3_REPORT_KEY,
      })
    );

    // Tell browser that this is a CSV file
    res.setHeader("Content-Type", "text/csv");

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="unmapped-report.csv"'
    );

    // Stream S3 file directly to the client
    result.Body.pipe(res);

    result.Body.on("error", (error) => {
      console.error(
        "Error streaming report from S3:",
        error
      );

      if (!res.headersSent) {
        res.status(500).json({
          error: "Failed to send the report",
        });
      } else {
        res.end();
      }
    });
  } catch (error) {
    console.error(
      "Error downloading report from S3:",
      error
    );

    // S3 object doesn't exist
    if (
      error.name === "NoSuchKey" ||
      error.$metadata?.httpStatusCode === 404
    ) {
      return res.status(404).json({
        error:
          "Report not found. Please generate it first.",
      });
    }

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Failed to send the report",
      });
    }
  }
});

module.exports = router;