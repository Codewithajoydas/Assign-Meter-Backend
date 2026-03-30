const express = require("express");
const router = express.Router();
const UserDB = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
router.post("/", async (req, res) => {
  const token = req.cookies?.token;
  if (!token)
    return res.status(401).json({ status: "error", message: "Unauthorized" });

  const { name, email, password, isAdmin } = req.body;
    console.log(name, email, password, isAdmin, pkg);
  if (!name || !email || !password || isAdmin === undefined) {
    return res.status(400).json({
      status: "error",
      message: "Please provide all required details",
    });
  }

  try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      const findUser = await UserDB.findById(decode.id);
      if (!findUser) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized",
        });
      }

      const checkEmail = await UserDB.findOne({email});
      if(checkEmail){
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
      pkg : findUser.pkg,
    });
    res.status(200).json({ status: "success", data: { user } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Server error" });
  }
});

module.exports = router;
