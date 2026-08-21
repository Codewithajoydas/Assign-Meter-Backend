const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const UserDB = require("../../models/user");

router.post("/add", async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "error",
                message: "Authorization token is required.",
            });
        }
        const token = authHeader.split(" ")[1];
        const { expoNotificationToken } = req.body;

        if (!expoNotificationToken) {
            return res.status(400).json({
                status: "error",
                message: "Expo notification token is required.",
            });
        }
        console.log(expoNotificationToken);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserDB.findByIdAndUpdate(
            decoded.id,
            {
                expoNotificationToken,
            },
            {
                new: true,
            }
        );
        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found.",
            });
        }
        return res.status(200).json({
            status: "success",
            message: "Notification token saved successfully.",
        });
    } catch (error) {
        console.error(error);
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                status: "error",
                message: "Invalid or expired token.",
            });
        }
        return res.status(500).json({
            status: "error",
            message: "Internal server error.",
        });
    }
});

module.exports = router;