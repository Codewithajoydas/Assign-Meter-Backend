const express = require("express");
const router = express.Router();
const NICDB = require("../models/nic");
const UserDB = require("../models/user");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
  const token = req?.headers?.authorization?.split(" ")[1];

  const {
    equipmentNumber,
    agency,
    type,
    nicCommType,
    installerNumber,
  } = req.body;

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
      !type ||
      !nicCommType ||
      !installerNumber
    ) {
      return res.status(400).json({
        status: "error",
        message: "Please provide all required details",
      });
    }

    const existingNIC = await NICDB.findOne({
      equipmentNumber,
    });

    if (existingNIC) {
      return res.status(400).json({
        status: "error",
        message: "Equipment already assigned",
      });
    }

    const nic = await NICDB.create({
      equipmentNumber,
      agency,
      meterType:type,
      nicCommType,
      installerId:installerNumber,
      supervisor: user._id,
      equipCategory: "NIC",
    });

    res.status(200).json({
      status: "success",
      data: nic,
      message: "NIC assigned successfully",
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
