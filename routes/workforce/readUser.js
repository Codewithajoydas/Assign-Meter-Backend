const express = require("express");

const router = express.Router();

const UserDB = require("../../models/user");

const jwt = require("jsonwebtoken");

// Read all users
router.get("/", async (req, res) => {
  try {
    // Get authentication token
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find logged-in user
    const user = await UserDB.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Only admin can read all users
    if (!user.isAdmin) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to view users",
      });
    }

    // Get all users
    const users = await UserDB.find();

    return res.status(200).json({
      status: "success",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;