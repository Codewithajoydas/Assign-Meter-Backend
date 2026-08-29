const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const UserDB = require("../../models/user");
const AuthMiddleware = require("../../middleware/authentication");
const { allowRoles } = require("../../middleware/rbac");

router.use(AuthMiddleware);
router.use(allowRoles("superadmin", "admin"));

// Update user information
router.patch("/", async (req, res) => {
  try {
    // ---------------------------------------------
    // 1. Get current user
    // ---------------------------------------------
    const currentUser = req?.user;

    if (!currentUser) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // ---------------------------------------------
    // 5. Get request data
    // ---------------------------------------------
    const {
      email,
      name,
      password,
      isAdmin,
    } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Please provide user email",
      });
    }

    // ---------------------------------------------
    // 6. Find target user
    // ---------------------------------------------
    const targetUser = await UserDB.findOne({ email, pkg: currentUser.pkg });

    if (!targetUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // ---------------------------------------------
    // 7. Build allowed updates
    // ---------------------------------------------
    const updates = {};

    if (name !== undefined) {
      updates.name = name;
    }

    if (isAdmin !== undefined) {
      updates.isAdmin = isAdmin;
    }

    // ---------------------------------------------
    // 8. Update password if provided
    // ---------------------------------------------
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          status: "error",
          message:
            "Password must be at least 6 characters long",
        });
      }

      updates.password = await bcrypt.hash(
        password,
        10
      );
    }

    // ---------------------------------------------
    // 9. Make sure there is something to update
    // ---------------------------------------------
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No valid fields provided for update",
      });
    }

    // ---------------------------------------------
    // 10. Update user
    // ---------------------------------------------
    const updatedUser = await UserDB.findOneAndUpdate(
      { email },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    // ---------------------------------------------
    // 11. Send response
    // ---------------------------------------------
    return res.status(200).json({
      status: "success",
      message: "User information updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);

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
    // Duplicate email
    // ---------------------------------------------
    if (error.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "Email already exists",
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