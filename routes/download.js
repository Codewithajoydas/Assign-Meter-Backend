// const express = require("express");
// const router = express.Router();
// const meterDB = require("../models/meter");
// const jwt = require("jsonwebtoken");
// const ExcelJS = require("exceljs");
// const userDB = require("../models/user");
// // ---------------- UTIL ----------------
// function formatDate(date) {
//   if (!date) return "";
//   const d = new Date(date);

//   const day = String(d.getDate()).padStart(2, "0");
//   const month = String(d.getMonth() + 1).padStart(2, "0");
//   const year = d.getFullYear();

//   return `${day}/${month}/${year}`;
// }

// // Escape regex (IMPORTANT)
// function escapeRegex(text) {
//   return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// }

// // ---------------- ROUTE ----------------
// router.get("/", async (req, res) => {
//   try {
//     // ---------- TOKEN VALIDATION ----------
//     const token = req?.headers?.authorization?.split(" ")[1];

//     if (!token) {
//       return res.status(401).json({ message: "Token missing" });
//     }

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch {
//       return res.status(401).json({ message: "Invalid token" });
//     }

//     // ---------- QUERY PARAMS ----------
//     const {
//       startDate,
//       endDate,
//       agency,
//       store,
//       meterType,
//       installationType,
//       status,
//     } = req.query;
//     console.log(status);
//     let filter = [];

//     // ---------- DATE FILTER ----------
//     if (startDate || endDate) {
//       const dateFilter = {};

//       if (startDate) {
//         dateFilter.$gte = new Date(startDate);
//       }

//       if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         dateFilter.$lte = end;
//       }

//       filter.push({ createdAt: dateFilter });
//     }

//     // ---------- SAFE REGEX FILTER ----------
//     if (agency) {
//       filter.push({
//         agency: { $regex: escapeRegex(agency), $options: "i" },
//       });
//     }

//     if (store) {
//       filter.push({
//         storeLocation: { $regex: escapeRegex(store), $options: "i" },
//       });
//     }

//     if (meterType) {
//       filter.push({
//         meterType: { $regex: escapeRegex(meterType), $options: "i" },
//       });
//     }

//     if (installationType) {
//       filter.push({
//         installationType: {
//           $regex: escapeRegex(installationType),
//           $options: "i",
//         },
//       });
//     }

//     if (status) {
//       filter.push({
//         status: { $regex: escapeRegex(status), $options: "i" },
//       });
//     }

//     const queries = filter.length ? { $and: filter } : {};

//     // ---------- FETCH DATA ----------
//     const meters = await meterDB.find(queries).limit(10000).lean();

//     // ---------- EXCEL ----------
//     const workbook = new ExcelJS.Workbook();

//     const sheet1 = workbook.addWorksheet("Store Data");
//     const sheet2 = workbook.addWorksheet("Agency Data");
//     const sheet3 = workbook.addWorksheet("Dispatch Data");

//     // ---------- COLUMNS ----------
//     sheet1.columns = [
//       { header: "Equip Category", key: "equipCategory", width: 20 },
//       { header: "Equip Number", key: "meterNumber", width: 20 },
//       { header: "Material Type", key: "meterType", width: 20 },
//       { header: "Store Name", key: "storeLocation", width: 25 },
//       { header: "Asset Received Date", key: "createdAt", width: 25 },
//     ];

//     sheet2.columns = [
//       { header: "Equipment Category", key: "equipCategory", width: 20 },
//       { header: "Equipment Number", key: "meterNumber", width: 20 },
//       { header: "Agency Name", key: "agency", width: 25 },
//       { header: "Agency Issue Date", key: "agencyDate", width: 25 },
//     ];

//     sheet3.columns = [
//       { header: "Equipment Category", key: "equipCategory", width: 20 },
//       { header: "Equipment Number", key: "meterNumber", width: 20 },
//       { header: "Field Engineer", key: "installerId", width: 25 },
//       { header: "Installation Type", key: "installationType", width: 25 },
//       { header: "Dispatch Date", key: "dispatchDate", width: 25 },
//     ];

//     // ---------- SINGLE LOOP (OPTIMIZED) ----------
//     meters.forEach((m) => {
//       // Correct date handling
//       const created = new Date(m.createdAt);

//       const storeDate = new Date(created);
//       storeDate.setDate(storeDate.getDate() - 10);

//       const agencyDate = new Date(created);
//       agencyDate.setDate(agencyDate.getDate() - 10);

//       const dispatchDate = new Date(created);
//       dispatchDate.setDate(dispatchDate.getDate() - 2);

//       // Sheet 1
//       sheet1.addRow({
//         equipCategory: m.equipCategory,
//         meterNumber: m.meterNumber,
//         meterType: m.meterType,
//         storeLocation: m.storeLocation,
//         createdAt: formatDate(storeDate),
//       });

//       // Sheet 2
//       sheet2.addRow({
//         equipCategory: m.equipCategory,
//         meterNumber: m.meterNumber,
//         agency: m.agency,
//         agencyDate: formatDate(agencyDate),
//       });

//       // Sheet 3
//       sheet3.addRow({
//         equipCategory: m.equipCategory,
//         meterNumber: m.meterNumber,
//         installerId: m.installerId,
//         installationType: m.installationType,
//         dispatchDate: formatDate(dispatchDate),
//       });
//     });

//     // ---------- RESPONSE ----------
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     );

//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=meters-assignment-report.xlsx",
//     );

//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (err) {
//     console.error("EXCEL ERROR:", err);
//     res.status(500).json({ message: "Error generating Excel" });
//   }
// });


// router.get("/whole", async (req, res) => {
//   const token = req?.headers?.authorization?.split(" ")[1];
//   if(!token) return res.status(401).json({
//     status: "error",
//     message: "Unauthorized",
//   })
//   const decoded = jwt.verify(token, process.env.JWT_SECRET);
//   const user = await userDB.findById(decoded.id);
//   if(!user) return res.status(401).json({
//     status: "error",
//     message: "Unauthorized",
//   })
  
//   try {
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     );
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=meters-assignment-report.xlsx",
//     );

//     const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
//       stream: res,
//     });

//     const sheet = workbook.addWorksheet("Meters");

//     sheet.columns = [
//       { header: "Equip Category", key: "equipCategory", width: 20 },
//       { header: "Equip Number", key: "meterNumber", width: 20 },
//       { header: "Material Type", key: "meterType", width: 20 },
//       { header: "Store Name", key: "storeLocation", width: 25 },
//       { header: "Asset Received Date", key: "createdAt", width: 25 },
//       { header: "Agency Name", key: "agency", width: 25 },
//       { header: "Field Engineer", key: "installerId", width: 25 },
//       { header: "Installation Type", key: "installationType", width: 25 },
//       { header: "Supervisor Name", key: "supervisor", width: 25 },
//       { header: "Dispatch Date", key: "dispatchDate", width: 25 },
//       { header: "Status", key: "status", width: 25 },
//     ];

//     const cursor = meterDB.find().populate("supervisor").lean().cursor();

//     for await (const meter of cursor) {
//       sheet
//         .addRow({
//           equipCategory: meter.equipCategory,
//           meterNumber: meter.meterNumber,
//           meterType: meter.meterType,
//           storeLocation: meter.storeLocation,
//           createdAt: meter.createdAt,
//           agency: meter.agency,
//           installerId: meter.installerId,
//           installationType: meter.installationType,
//           supervisor: meter.supervisor?.name || "No Data",
//           dispatchDate: meter.dispatchDate,
//           status: meter.status,
//         })
//         .commit();
//     }

//     await sheet.commit();
//     await workbook.commit();
//   } catch (err) {
//     console.error("EXCEL ERROR:", err);
//     res.status(500).json({ message: "Error generating Excel" });
//   }
// });

// module.exports = router;



const express = require("express");
const router = express.Router();
const meterDB = require("../models/meter");
const jwt = require("jsonwebtoken");
const ExcelJS = require("exceljs");
const archiver = require("archiver");

// ---------------- UTIL ----------------
function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------- ROUTE ----------------
router.get("/", async (req, res) => {
  try {
    // ---------- TOKEN ----------
    const token = req?.headers?.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token missing" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }

    // ---------- FILTER ----------
    const {
      startDate,
      endDate,
      agency,
      store,
      meterType,
      installationType,
      status,
    } = req.query;

    let filter = [];

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }

      filter.push({ createdAt: dateFilter });
    }

    if (agency) {
      filter.push({
        agency: { $regex: escapeRegex(agency), $options: "i" },
      });
    }

    if (store) {
      filter.push({
        storeLocation: { $regex: escapeRegex(store), $options: "i" },
      });
    }

    if (meterType) {
      filter.push({
        meterType: { $regex: escapeRegex(meterType), $options: "i" },
      });
    }

    if (installationType) {
      filter.push({
        installationType: {
          $regex: escapeRegex(installationType),
          $options: "i",
        },
      });
    }

    if (status) {
      filter.push({
        status: { $regex: escapeRegex(status), $options: "i" },
      });
    }

    const queries = filter.length ? { $and: filter } : {};

    // ---------- DATA ----------
    const meters = await meterDB.find(queries).limit(10000).lean();

    // ---------- CREATE 3 WORKBOOKS ----------
    const wb1 = new ExcelJS.Workbook();
    const wb2 = new ExcelJS.Workbook();
    const wb3 = new ExcelJS.Workbook();

    const sheet1 = wb1.addWorksheet("Store Data");
    const sheet2 = wb2.addWorksheet("Agency Data");
    const sheet3 = wb3.addWorksheet("Dispatch Data");

    // ---------- COLUMNS ----------
    sheet1.columns = [
      { header: "Equip Category", key: "equipCategory", width: 20 },
      { header: "Equip Number", key: "meterNumber", width: 20 },
      { header: "Material Type", key: "meterType", width: 20 },
      { header: "Store Name", key: "storeLocation", width: 25 },
      { header: "Asset Received Date", key: "createdAt", width: 25 },
    ];

    sheet2.columns = [
      { header: "Equipment Category", key: "equipCategory", width: 20 },
      { header: "Equipment Number", key: "meterNumber", width: 20 },
      { header: "Agency Name", key: "agency", width: 25 },
      { header: "Agency Issue Date", key: "agencyDate", width: 25 },
    ];

    sheet3.columns = [
      { header: "Equipment Category", key: "equipCategory", width: 20 },
      { header: "Equipment Number", key: "meterNumber", width: 20 },
      { header: "Field Engineer", key: "installerId", width: 25 },
      { header: "Installation Type", key: "installationType", width: 25 },
      { header: "Dispatch Date", key: "dispatchDate", width: 25 },
    ];

    // ---------- ADD DATA ----------
    meters.forEach((m) => {
      const created = new Date(m.createdAt);

      const storeDate = new Date(created);
      storeDate.setDate(storeDate.getDate() - 10);

      const agencyDate = new Date(created);
      agencyDate.setDate(agencyDate.getDate() - 10);

      const dispatchDate = new Date(created);
      dispatchDate.setDate(dispatchDate.getDate() - 2);

      sheet1.addRow({
        equipCategory: m.equipCategory,
        meterNumber: m.meterNumber,
        meterType: m.meterType,
        storeLocation: m.storeLocation,
        createdAt: formatDate(storeDate),
      });

      sheet2.addRow({
        equipCategory: m.equipCategory,
        meterNumber: m.meterNumber,
        agency: m.agency,
        agencyDate: formatDate(agencyDate),
      });

      sheet3.addRow({
        equipCategory: m.equipCategory,
        meterNumber: m.meterNumber,
        installerId: m.installerId,
        installationType: m.installationType,
        dispatchDate: formatDate(dispatchDate),
      });
    });

    // ---------- UNIQUE NAMES ----------
    const timestamp = Date.now();

    const file1Name = `store-data-${timestamp}.xlsx`;
    const file2Name = `agency-data-${timestamp}.xlsx`;
    const file3Name = `dispatch-data-${timestamp}.xlsx`;

    // ---------- ZIP RESPONSE ----------
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=meters-${timestamp}.zip`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    const buffer1 = await wb1.xlsx.writeBuffer();
    const buffer2 = await wb2.xlsx.writeBuffer();
    const buffer3 = await wb3.xlsx.writeBuffer();

    archive.append(buffer1, { name: file1Name });
    archive.append(buffer2, { name: file2Name });
    archive.append(buffer3, { name: file3Name });

    await archive.finalize();
  } catch (err) {
    console.error("EXCEL ERROR:", err);
    res.status(500).json({ message: "Error generating Excel" });
  }
});

module.exports = router;