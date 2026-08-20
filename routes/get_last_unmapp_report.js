const express = require("express");
const path = require("node:path");
const router = express.Router();

router.get("/", async (req, res) => {
  const reportPath = path.resolve("./reports", "unmapped-report.csv");
  res.download(reportPath, "unmapped-report.csv", (err) => {
    if (err) {
      console.error("Error sending the report:", err);
      res.status(500).json({ error: "Failed to send the report" });
    }
  });
});

module.exports = router;
