const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const UserDB = require("../../models/user");
const AuthMiddleware = require("../../middleware/authentication");
const { allowRoles } = require("../../middleware/rbac");

const PACKAGES = [
  "ASS1", "ASS2", "ASS3", "ASS4", "ASS5",
  "ASS6", "ASS7", "ASS8", "ASS9", "ASS10",
];

// What each role is allowed to ASSIGN when creating a user.
// superadmin -> anything
// admin -> anything except admin / superadmin
const ASSIGNABLE_ROLES = {
  superadmin: ["installer", "supervisor", "user", "admin", "superadmin"],
  admin: ["installer", "supervisor", "user"],
};

router.use(AuthMiddleware);
router.use(allowRoles("superadmin", "admin"));

router.post("/", async (req, res) => {
  try {
    const currentUser = req?.user;

    if (!currentUser) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    const { name, email, password, role, pkg } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }

    // --------------------------------------------------
    // Role hierarchy check
    // admin can NOT create admin or superadmin accounts.
    // --------------------------------------------------
    const allowedRoles = ASSIGNABLE_ROLES[currentUser.role] || [];

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        status: "error",
        message: `You are not allowed to assign the role "${role}"`,
      });
    }

    // --------------------------------------------------
    // Package resolution
    // superadmin can target any valid package via req.body.pkg,
    // defaulting to their own if omitted.
    // admin is ALWAYS locked to their own package, regardless
    // of what's sent in the request body.
    // --------------------------------------------------
    let targetPkg;

    if (currentUser.role === "superadmin") {
      targetPkg = pkg || currentUser.pkg;

      if (!PACKAGES.includes(targetPkg)) {
        return res.status(400).json({
          status: "error",
          message: "Invalid package",
        });
      }
    } else {
      // admin — ignore whatever pkg the client sent
      targetPkg = currentUser.pkg;
    }

    // --------------------------------------------------
    // Check whether email already exists
    // (email is globally unique per schema, not per-pkg)
    // --------------------------------------------------
    const existingUser = await UserDB.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserDB.create({
      name,
      email,
      password: hashedPassword,
      role,
      pkg: targetPkg,
    });

    return res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: {
        user: newUser,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    // Mongoose duplicate key (race condition / missed check above)
    if (error.code === 11000) {
      return res.status(400).json({
        status: "error",
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

module.exports = router;