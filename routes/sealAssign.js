const express = require("express");
const router = express.Router();
const sealDB = require("../models/seal");
const UserDB = require("../models/user");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  const token = req?.headers?.authorization?.split(" ")[1];

  const { equipmentNumber, agency, sealType, installerNumber } = req.body;

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

    if (!equipmentNumber || !agency || !sealType || !installerNumber) {
      return res.status(400).json({
        status: "error",
        message: "Please provide all required details",
      });
    }

    const existingseal = await sealDB.findOne({
      equipmentNumber,
    });

    if (existingseal) {
      return res.status(400).json({
        status: "error",
        message: "Equipment already assigned",
      });
    }

    const seal = await sealDB.create({
      equipmentNumber,
      agency,
      sealType,
      installerId: installerNumber,
      supervisor: user._id,
    });

    res.status(200).json({
      status: "success",
      data: seal,
      message: "Seal assigned successfully",
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
