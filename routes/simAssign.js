const express = require("express");
const router = express.Router();
const SIMDB = require("../models/simCard");
const UserDB = require("../models/user");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  const token = req?.headers?.authorization?.split(" ")[1];

  const { equipmentNumber, agency,nsp, installerNumber } = req.body;

  try {
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserDB.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    if (
      !equipmentNumber ||
      !agency ||
      !nsp ||
      !installerNumber
    ) {
      return res.status(400).json({
        status: "error",
        message: "Please provide all required details",
      });
    }

    const existingsim = await SIMDB.findOne({
      equipmentNumber,
    });

    if (existingsim) {
      return res.status(400).json({
        status: "error",
        message: "Equipment already assigned",
      });
    }

    const sim = await SIMDB.create({
      equipmentNumber,
      agency,
      nsp,
      installerId:installerNumber,
      supervisor: user._id,
      equipCategory: "SIM",
    });

    res.status(200).json({
      status: "success",
      data: sim,
      message: "Sim assigned successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
});

module.exports = router;
