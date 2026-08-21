const express = require("express");
const router = express.Router();
const MeterLocationDB = require("../../models/meterLocation");
const UserDB = require("../../models/user");
const jwt = require("jsonwebtoken");

router.post("/", async (req, res) => {
    try {
        const { meterNumber, consumerNumber, location } = req.body;

        if (!meterNumber || !consumerNumber || !location) {
            return res.status(400).json({
                status: "error",
                message: "meterNumber, consumerNumber and location are required",
            });
        }

        if (
            typeof location.latitude !== "number" ||
            typeof location.longitude !== "number"
        ) {
            return res.status(400).json({
                status: "error",
                message: "Invalid location format",
            });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({
                status: "error",
                message: "No token provided",
            });
        }

        const token = authHeader.split(" ")[1];

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({
                status: "error",
                message: "Invalid token",
            });
        }

        const user = await UserDB.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "User not found",
            });
        }

        const updatedMeter = await MeterLocationDB.findOneAndUpdate(
            { meterNumber }, // find condition
            {
                meterNumber,
                consumerNumber,
                location,
                supervisor: user._id,
            },
            {
                new: true,      // return updated doc
                upsert: true,   // create if not exists
                setDefaultsOnInsert: true,
            }
        );

        return res.status(200).json({
            status: "success",
            message: "Meter location saved/updated",
            data: updatedMeter,
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});

module.exports = router;