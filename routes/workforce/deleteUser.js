const express = require("express");

const router = express.Router();

const UserDB = require("../../models/user");

const jwt = require("jsonwebtoken");

// Delete user
router.delete("/", async (req, res) => {
  try {
    // Get token from Authorization header
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const token = authorization.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Find logged-in user
    const currentUser = await UserDB.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // Only admin can delete users
    if (!currentUser.isAdmin) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to delete users",
      });
    }

    // Get target user's email
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Please provide email",
      });
    }

    // Find target user
    const targetUser = await UserDB.findOne({ email });

    if (!targetUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Prevent admin from deleting themselves
    if (targetUser._id.equals(currentUser._id)) {
      return res.status(400).json({
        status: "error",
        message: "You cannot delete your own account",
      });
    }

    // Delete target user
    await UserDB.findOneAndDelete({ email });

    return res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    // Invalid or expired JWT
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;