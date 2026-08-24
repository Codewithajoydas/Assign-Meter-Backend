const express = require("express");

const router = express.Router();

const UserDB = require("../../models/user");

const jwt = require("jsonwebtoken");

// Delete user
router.delete("/", async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserDB.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Only admin can delete users
    if (!user.isAdmin) {
      return res.status(403).json({
        status: "error",
        message: "You are not authorized to delete users",
      });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Please provide email",
      });
    }

    // Find user by email
    const findUser = await UserDB.findOne({ email });

    if (!findUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Prevent admin from deleting their own account
    if (findUser._id.equals(user._id)) {
      return res.status(400).json({
        status: "error",
        message: "You cannot delete your own account",
      });
    }

    // Delete user by email
    await UserDB.findOneAndDelete({ email });

    return res.status(200).json({
      status: "success",
      message: "User deleted successfully",
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