const express = require("express");
const router = express.Router();

const UserDB = require("../../models/user");
const AuthMiddleware = require("../../middleware/authentication");
const { allowRoles } = require("../../middleware/rbac");

router.use(AuthMiddleware);
router.use(allowRoles("superadmin", "admin"));

// Read all users
router.get("/", async (req, res) => {
  try {
    const { user } = req;

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const isSuperadmin = user.role === "superadmin";

    let query = {};

    if (!isSuperadmin) {
      if (!user.pkg) {
        return res.status(400).json({
          status: "error",
          message: "User package is not assigned",
        });
      }

      query = {
        pkg: user.pkg,
      };
    }

    const users = await UserDB.find(query);

    return res.status(200).json({
      status: "success",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;