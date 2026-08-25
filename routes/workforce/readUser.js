const express = require("express");

const router = express.Router();

const UserDB = require("../../models/user");

const jwt = require("jsonwebtoken");

// Read all users
router.get("/", async (req, res) => {
  try {
    // ---------------------------------------------
    // 1. Get token from Authorization header
    // ---------------------------------------------
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const token = authorization.split(" ")[1];

    // ---------------------------------------------
    // 2. Verify token
    // ---------------------------------------------
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // ---------------------------------------------
    // 3. Find logged-in user
    // ---------------------------------------------
    const currentUser = await UserDB.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // ---------------------------------------------
    // 4. Only admin can read all users
    // ---------------------------------------------
    if (!currentUser.isAdmin) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to view users",
      });
    }

    // ---------------------------------------------
    // 5. Get all users
    // ---------------------------------------------
    const users = await UserDB.find();

    // ---------------------------------------------
    // 6. Send response
    // ---------------------------------------------
    return res.status(200).json({
      status: "success",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    // ---------------------------------------------
    // Invalid / expired JWT
    // ---------------------------------------------
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    // ---------------------------------------------
    // Other server errors
    // ---------------------------------------------
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;