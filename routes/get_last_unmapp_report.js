const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const reportPath = path.resolve("./reports", "unmapped-report.csv");

    // Check the file actually exists before attempting to send it,
    // so we can return a clean 404 instead of a raw download error
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({
        error: "Report not found. Please generate it first.",
      });
    }

    res.download(reportPath, "unmapped-report.csv", (err) => {
      if (err) {
        console.error("Error sending the report:", err);

        // Only respond if headers haven't already gone out —
        // res.download can partially stream before failing
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to send the report" });
        }
      }
    });
  } catch (error) {
    console.error("Unexpected error in report download route:", error);

    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send the report" });
    }
  }
});

module.exports = router;