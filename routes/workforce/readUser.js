const express = require("express");

const router = express.Router();

const UserDB = require("../../models/user");

const jwt = require("jsonwebtoken");
const AuthMiddleware = require("../../middleware/authentication");
const { allowRoles } = require("../../middleware/rbac");

router.use(AuthMiddleware);
router.use(allowRoles("superadmin", "admin"));

// Read all users
router.get("/", async (req, res) => {
  try {
   const user = req?.user;
   const pkg = user?.pkg;
    // ---------------------------------------------
    // 5. Get all users
    // ---------------------------------------------
    const users = await UserDB.find({ pkg });

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