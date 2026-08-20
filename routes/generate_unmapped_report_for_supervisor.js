const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const userDB = require("../models/user");
const path = require("node:path");
const meter = require("../models/meter");
const dbConnector = require("../utils/duckdbConnector");

router.get("/", async (req, res) => {
  try {
    // Get token
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await userDB.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // Find meters assigned to this supervisor
    const meters = await meter.find({
      supervisor: user._id,
    });

    const meterNumbers = meters.map((item) => String(item.meterNumber));

    // If supervisor has no meters
    if (meterNumbers.length === 0) {
      return res.status(200).json({
        status: "success",
        count: 0,
        data: [],
      });
    }

    // CSV file path
    const reportPath = path.resolve("./reports", "unmapped-report.csv");

    const connector = await dbConnector();

    // Create SQL IN list
    const meterNumberList = meterNumbers
      .map((number) => `'${number.replace(/'/g, "''")}'`)
      .join(", ");

    const safeReportPath = reportPath.replace(/'/g, "''");

    const query = `
      SELECT *
      FROM read_csv_auto('${safeReportPath}')
      WHERE CAST("MSN" AS VARCHAR) IN (${meterNumberList})
    `;

    // Run query and read results
    const reader = await connector.runAndReadAll(query);

    // Column names, in order — needed because getRowsJson() returns
    // arrays of values, not keyed objects
    const columnNames = reader.columnNames();

    // JSON-safe rows (handles BigInt, DECIMAL, DATE, etc. correctly)
    const rowsJson = reader.getRowsJson();

    // Map each row array -> object keyed by column name
    const data = rowsJson.map((row) =>
      Object.fromEntries(columnNames.map((col, i) => [col, row[i]]))
    );

    return res.status(200).json({
      status: "success",
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error generating the report:", error);

    return res.status(500).json({
      status: "error",
      message: "Failed to generate the report",
    });
  }
});

module.exports = router;