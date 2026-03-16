const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserDB = require("../models/user");


router.post("/", async (req, res) => {
  const { name, email, password, isAdmin } = req.body;
  try {
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({status: "error", message: "Please provide email and password" });
    }
    const user = await UserDB.findOne({ email });
    if (user) {
      return res.status(400).json({status: "error", message: "User already exists." });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const createUser = await UserDB.create({
        name,
        email,
        password: hashedPassword,
        isAdmin,
      });
      res.status(200).json({ status: "success", data: {user: createUser } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

module.exports = router;
