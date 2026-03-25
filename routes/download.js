const express = require("express");
const router = express.Router();
const meterDB = require("../models/meter");
const jwt = require("jsonwebtoken");

const ExcelJS = require("exceljs");

function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

router.get("/", async (req, res) => {
  try {
    // ===== AUTH =====
    const token = req?.headers?.authorization?.split(" ")[1];
    jwt.verify(token, process.env.JWT_SECRET);

    // ===== FILTERS =====
    const { startDate, endDate, agency, store, meterType, installationType } =
      req.query;

    let filter = [];

    if (startDate) filter.push({ createdAt: { $gte: new Date(startDate) } });

    if (endDate) filter.push({ createdAt: { $lte: new Date(endDate) } });

    if (agency) filter.push({ agency: { $regex: new RegExp(agency, "i") } });

    if (store)
      filter.push({ storeLocation: { $regex: new RegExp(store, "i") } });

    if (meterType)
      filter.push({ meterType: { $regex: new RegExp(meterType, "i") } });

    if (installationType)
      filter.push({
        installationType: { $regex: new RegExp(installationType, "i") },
      });

    const queries = filter.length ? { $and: filter } : {};

    const meters = await meterDB.find({ ...queries, status: "pending" }).lean();
    const workbook = new ExcelJS.Workbook();
    const sheet1 = workbook.addWorksheet("Store Data");
    sheet1.columns = [
      { header: "Equip Category", key: "meterType", width: 20 },
      { header: "Equip Number", key: "meterNumber", width: 20 },
      { header: "Material Type", key: "materialType", width: 20 },
      { header: "Store Name", key: "storeLocation", width: 25 },
      { header: "Asset Received Date", key: "createdAt", width: 25 },
    ];
    meters.forEach((m) => {
      sheet1.addRow({
        meterType: m.equipCategory,
        meterNumber: m.meterNumber,
        materialType: m.meterType,
        storeLocation: m.storeLocation,
        createdAt: formatDate(m.createdAt - 24 * 60 * 60 * 1000 * 10),
      });
    });

    const sheet2 = workbook.addWorksheet("Agency Data");

    sheet2.columns = [
      { header: "Equipment Category", key: "meterType", width: 20 },
      { header: "Equipment Number", key: "meterNumber", width: 20 },
      { header: "Agency Name", key: "agency", width: 25 },
      { header: "Agency Issue Date", key: "agencyDate", width: 25 },
    ];

    meters.forEach((m) => {
      sheet2.addRow({
        meterType: m.equipCategory,
        meterNumber: m.meterNumber,
        agency: m.agency,
        agencyDate: formatDate(m.createdAt - 24 * 60 * 60 * 1000 * 10),
      });
    });

    const sheet3 = workbook.addWorksheet("Dispatch Data");

    sheet3.columns = [
      { header: "Equipment Category", key: "meterType", width: 20 },
      { header: "Equipment Number", key: "meterNumber", width: 20 },
      { header: "Field Engineer", key: "fieldEngineer", width: 25 },
      { header: "Installation Type", key: "installationType", width: 25 },
      { header: "Dispatch Date", key: "dispatchDate", width: 25 },
    ];

    meters.forEach((m) => {
      sheet3.addRow({
        meterType: m.equipCategory,
        meterNumber: m.meterNumber,
        fieldEngineer: m.installerId,
        installationType: m.installationType,
        dispatchDate: formatDate(m.createdAt - 24 * 60 * 60 * 1000 * 2),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=meters-assignment-report.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating Excel" });
  }
});

module.exports = router;
