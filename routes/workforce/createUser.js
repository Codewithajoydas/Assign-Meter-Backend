const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserDB = require("../../models/user");

router.post("/", async (req, res) => {
  try {
    // --------------------------------------------------
    // 1. Get access token
    // --------------------------------------------------
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const token = authorization.split(" ")[1];

    // --------------------------------------------------
    // 2. Verify token
    // --------------------------------------------------
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // --------------------------------------------------
    // 3. Find logged-in user
    // --------------------------------------------------
    const currentUser = await UserDB.findById(decoded.id);

    if (!currentUser) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    // --------------------------------------------------
    // 4. Check admin permission
    // --------------------------------------------------
    if (!currentUser.isAdmin) {
      return res.status(403).json({
        status: "error",
        message: "Only admin allowed",
      });
    }

    // --------------------------------------------------
    // 5. Get request data
    // --------------------------------------------------
    const {
      name,
      email,
      password,
      isAdmin,
    } = req.body;

    // --------------------------------------------------
    // 6. Validate required fields
    // --------------------------------------------------
    if (
      !name ||
      !email ||
      !password ||
      isAdmin === undefined
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
      isAdmin,
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

module.exports = router;