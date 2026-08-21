const express = require("express");
const router = express.Router();
const UserDB = require("../../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  const { name, email, password, isAdmin } = req.body;

  if (!name || !email || !password || isAdmin === undefined) {
    return res.status(400).json({
      status: "error",
      message: "All fields are required",
    });
  }

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    const findUser = await UserDB.findById(decode.id);

    if (!findUser) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (!findUser.isAdmin) {
      return res.status(403).json({
        status: "error",
        message: "Only admin allowed",
      });
    }

    const checkEmail = await UserDB.findOne({ email });
    if (checkEmail) {
      return res.status(400).json({
        status: "error",
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserDB.create({
      name,
      email,
      password: hashedPassword,
      isAdmin,
      pkg: findUser.pkg,
    });

    res.status(201).json({ status: "success", data: { user } });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

module.exports = router;
