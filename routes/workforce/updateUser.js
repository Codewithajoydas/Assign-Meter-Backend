const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();

const UserDB = require("../../models/user");

// Update user information
router.patch("/", async (req, res) => {
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

    // Find logged-in admin
    const user = await UserDB.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Only admin can update users
    if (!user.isAdmin) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to update users",
      });
    }

    // Get target user's email
    const { email, password, ...updates } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Please provide user email",
      });
    }

    // Find target user
    const findUser = await UserDB.findOne({ email });

    if (!findUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          status: "error",
          message: "Password must be at least 6 characters long",
        });
      }

      updates.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await UserDB.findOneAndUpdate(
      { email },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    return res.status(200).json({
      status: "success",
      message: "User information updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);

    // Duplicate email
    if (error.code === 11000) {
      return res.status(409).json({
        status: "error",
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;