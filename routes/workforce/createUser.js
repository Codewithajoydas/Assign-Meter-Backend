const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserDB = require("../../models/user");
const AuthMiddleware = require("../../middleware/authentication");
const { allowRoles } = require("../../middleware/rbac");

router.use(AuthMiddleware)
router.use(allowRoles("superadmin", "admin"))
router.post("/", async (req, res) => {
  try {
    const currentUser = req?.user;
    if(!currentUser){
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }
    // --------------------------------------------------
    // 5. Get request data
    // --------------------------------------------------
    const {
      name,
      email,
      password,
      role, 
    } = req.body;

    // --------------------------------------------------
    // 6. Validate required fields
    // --------------------------------------------------
    if (
      !name ||
      !email ||
      !password ||
      !role 
    ) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }

    // --------------------------------------------------
    // 7. Check whether email already exists
    // --------------------------------------------------
    const existingUser = await UserDB.findOne({
      email,
      pkg: currentUser.pkg,
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Email already exists",
      });
    }

    // --------------------------------------------------
    // 8. Hash password
    // --------------------------------------------------
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // --------------------------------------------------
    // 9. Create user
    // --------------------------------------------------
    const newUser = await UserDB.create({
      name,
      email,
      password: hashedPassword,
      role,
      pkg: currentUser.pkg,
    });

    // --------------------------------------------------
    // 10. Send response
    // --------------------------------------------------
    return res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

    // Invalid / expired JWT
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    // Everything else
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});
6
module.exports = router;