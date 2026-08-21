const express = require("express");
const jwt = require("jsonwebtoken");
const ExcelJS = require("exceljs");
const UserDB = require("../../models/user");
const DeviceDB = require("../../models/bleDevices");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized",
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

        const {
            deviceId,
            name,
            localName,
            rssi,
            location,
            scannedAt,
        } = req.body;

        if (!deviceId || !location) {
            return res.status(400).json({
                status: "error",
                message: "deviceId and location are required.",
            });
        }

        if (name) {
            const exists = await DeviceDB.exists({ name });
            if (exists) {
                return res.status(409).json({
                    status: "error",
                    message: "Device already exists.",
                });
            }
        }

        const device = await DeviceDB.create({
            deviceId,
            name: name ?? null,
            localName: localName ?? null,
            rssi: typeof rssi === "number" ? rssi : null,
            location,
            scannedAt: scannedAt || new Date(),
            user: user._id,
        });

        return res.status(201).json({
            status: "success",
            message: "Device added successfully.",
            data: device,
        });

    } catch (error) {
        console.error("Add Device Error:", error);

        return res.status(500).json({
            status: "error",
            message: "Internal server error.",
        });
    }
});

router.get("/", async (req, res) => {
    try {

        const devices = await DeviceDB.find().populate("supervisor");
        return res.status(200).json({
            status: "success",
            data: devices,
        });
    } catch (error) {
        console.error("Get Devices Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error.",
        });
    }
})


router.get("/download", async (req, res) => {
    try {
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=BleDevices-${Date.now()}.xlsx`,
        );

        const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
            stream: res,
        });

        const sheet = workbook.addWorksheet("bleDevices");

        sheet.columns = [
            { header: "Device ID", key: "deviceId", width: 20 },
            { header: "Name", key: "name", width: 20 },
            { header: "Local Name", key: "localName", width: 20 },
            { header: "RSSI", key: "rssi", width: 20 },
            { header: "Location", key: "location", width: 25 },
            { header: "Scanned At", key: "scannedAt", width: 25 },
        ];

        const devices = await DeviceDB.find();

        devices.forEach((device) => {
            sheet.addRow({
                deviceId: device.deviceId,
                name: device.name,
                localName: device.localName,
                rssi: device.rssi,
                location: device.location,
                scannedAt: device.scannedAt,
            });
        });

        await workbook.commit();
        res.end();

    } catch (error) {
        console.error("Get Devices Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error.",
        });
    }
})

module.exports = router;