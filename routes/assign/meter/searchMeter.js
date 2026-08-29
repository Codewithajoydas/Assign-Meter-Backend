const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const UserDB = require("../../../models/user");
const MeterDB = require("../../../models/meter");
const AuthMiddleware = require("../../../middleware/authentication");
const { allowRoles } = require("../../../middleware/rbac");


router.use(AuthMiddleware);
router.use(allowRoles("admin", "superadmin", "supervisor"));
router.get("/", async (req, res) => {
  try {
    const user = req?.user;
      if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }
    const meterNumber = req.query.meterNumber;
    if (!meterNumber) {
      return res.status(400).json({
        status: "error",
        message: "meterNumber is required",
      });
    }
    const findMeter = await MeterDB.find({ meterNumber, pkg: user.pkg }).populate("supervisor");
    if (!findMeter)
      return res
        .status(404)
        .json({ status: "error", message: "Meter not found" });
    res.status(200).json({ status: "success", data: { meters: findMeter } });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

module.exports = router;
