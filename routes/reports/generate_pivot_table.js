const express = require("express");
const router = express.Router();
const s3 = require("../../utils/s3");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const S3_REPORT_KEY = "reports/unmapped-report.csv";

router.get("/", async (req, res) => {
  // s3 last generated unmapped report
  const result = await s3.send(
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: S3_REPORT_KEY,
    }),
  );
  res.json(result);
});

module.exports = router;