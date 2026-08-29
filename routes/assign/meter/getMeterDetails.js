const express = require("express");
const router = express.Router();
const MeterDB = require("../../../models/meter");
const UserDB = require("../../../models/user");
const jwt = require("jsonwebtoken");
const AuthMiddleware = require("../../../middleware/authentication");
const { allowRoles } = require("../../../middleware/rbac");

router.get(
  "/",
  AuthMiddleware,
  allowRoles("admin", "superadmin"),
  async (req, res) => {
    try {
      const user = req?.user;
      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized",
        });
      }

      // ---------------- QUERY PARAMS ----------------
      const status =
        typeof req.query.status === "string" ? req.query.status : null;

      const agency =
        typeof req.query.agency === "string" ? req.query.agency : null;

      const store =
        typeof req.query.store === "string" ? req.query.store : null;

      const meterType =
        typeof req.query.meterType === "string" ? req.query.meterType : null;

      const installationType =
        typeof req.query.installationType === "string"
          ? req.query.installationType
          : null;

      const startDate = req.query.startDate;
      const endDate = req.query.endDate;

      // ---------------- PAGINATION ----------------
      let pageNumber = parseInt(req.query.pageNumber) || 1;
      let limit = parseInt(req.query.limit) || 10;
      let sort = req.query.sort === "asc" ? "asc" : "desc";

      pageNumber = Math.max(pageNumber, 1);
      limit = Math.min(Math.max(limit, 1), 100);

      // ---------------- STATUS ----------------
      const allowedStatus = ["active", "pending", "installed", "rejected"];

      if (status && !allowedStatus.includes(status.toLowerCase())) {
        return res.status(400).json({
          status: "error",
          message: "Invalid status value",
        });
      }

      const finalStatus = status ? status.toLowerCase() : null;

      // ---------------- FILTER ----------------
      const filter = {};

      if (finalStatus) filter.status = finalStatus;
      if (store) filter.storeLocation = store;
      if (agency) filter.agency = agency;
      if (meterType) filter.meterType = meterType;
      if (installationType) filter.installationType = installationType;

      // ---------------- DATE FILTER ----------------
      if (startDate || endDate) {
        filter.createdAt = {};

        if (startDate) {
          filter.createdAt.$gte = new Date(startDate);
        }

        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }

      // ---------------- PKG FILTER ----------------
      if (user.pkg) {
        filter.pkg = user.pkg;
      }

      // ---------------- QUERY ----------------
      const meters = await MeterDB.find(filter)
        .populate("supervisor")
        .sort({ createdAt: sort === "asc" ? 1 : -1 })
        .skip((pageNumber - 1) * limit)
        .limit(limit)
        .lean();
      const totalData = await MeterDB.countDocuments(filter);

      return res.status(200).json({
        status: "success",
        count: meters.length,
        data: meters,
        totalPages: Math.ceil(totalData / limit),
        currentPage: pageNumber,
        totalData,
      });
    } catch (error) {
      console.error("SERVER ERROR:", error);

      return res.status(500).json({
        status: "error",
        message: "Server error",
      });
    }
  },
);

router.get(
  "/supervisor",
  AuthMiddleware,
  allowRoles("supervisor", "admin", "superadmin"),
  async (req, res) => {
    try {
      const user = req?.user;
      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized",
        });
      }
      const sort = req.query.sort;

      const finalSort = () => {
        if (sort === "newold") return { createdAt: -1 }; // newest first
        if (sort === "oldnew") return { createdAt: 1 }; // oldest first
        if (sort === "meterid") return { meterNumber: 1 };
        if (sort === "status") return { status: 1 };
        return { createdAt: -1 }; // default
      };
      const search = req.query.search || "";
      const status = req.query.status || null;
      const agency = req.query.agency || null;
      const store = req.query.store || null;
      const meterType = req.query.meterType || null;
      const installationType = req.query.installationType || null;

      const filter = {};

      if (status) filter.status = status;
      if (store) filter.storeLocation = store;
      if (agency) filter.agency = agency;
      if (meterType) filter.meterType = meterType;
      if (installationType) filter.installationType = installationType;

      const findMeter = await MeterDB.find({
        ...filter,
        supervisor: user._id,
        pkg: user.pkg,
        meterNumber: { $regex: search, $options: "i" },
      })
        .sort(finalSort())
        .lean();
      return res.status(200).json({
        status: "success",
        data: findMeter,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: "error", message: "Server error" });
    }
  },
);

module.exports = router;
