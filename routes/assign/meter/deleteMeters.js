const express = require("express");
const router = express.Router();
const MeterDB = require("../../../models/meter");
const UserDB = require("../../../models/user");
const jwt = require("jsonwebtoken");
const AuthMiddleware = require("../../../middleware/authentication");
const { allowRoles } = require("../../../middleware/rbac");

router.use(AuthMiddleware);
router.use(allowRoles("admin", "superadmin"));

router.delete("/", async (req, res) => {
  try {
    const user = req?.user;
    const pkg = user?.pkg;
    if (!user || !pkg) {
      console.log("User data not available in req.user");
      return res.status(401).json({
        status: "error",
        message: "We are uneble to get user data",
      });
    }

    const { meters } = req.body;
    if (!Array.isArray(meters) || meters.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Please select at least one meter",
      });
    }
    let deletedMeters = [];
    try {
      deletedMeters = await MeterDB.deleteMany({ _id: { $in: meters }, pkg });
    } catch (error) {
      console.error("Mongoose Error:", error);
      return res.status(500).json({
        status: "error",
        message: "DATABASE ERROR",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Meters deleted successfully",
      data: deletedMeters,
    });
  } catch (error) {
    console.error("SERVER ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

module.exports = router;
