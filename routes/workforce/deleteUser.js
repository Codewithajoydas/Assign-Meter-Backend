const express = require("express");
const router = express.Router();
const UserDB = require("../../models/user");
const AuthMiddleware = require("../../middleware/authentication");
const { allowRoles } = require("../../middleware/rbac");

router.use(AuthMiddleware);
router.use(allowRoles("superadmin", "admin"));
// Delete user
router.delete("/", async (req, res) => {
  try {
    // Get current user
    const currentUser = req?.user;
    const pkg = currentUser?.pkg;
    if (!currentUser) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
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
    const targetUser = await UserDB.findOne({ email, pkg });

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
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;
