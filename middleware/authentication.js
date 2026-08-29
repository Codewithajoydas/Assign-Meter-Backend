require("dotenv").config();
const jwt  = require("jsonwebtoken")
const UserDB = require("../models/user");
const AuthMiddleware = async (req, res, next) => {
    try {
        const token = req?.headers?.authorization?.split(" ")[1];
        if (!token) {
            console.log('Error from Auth Middleware for token');
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
        req.user = user;
        next();
    } catch (error) {
        console.log('Error from auth middleware',error);
        return res.status(401).json({
            status: "error",
            message: "Unauthorized",
        });
    }
}

module.exports = AuthMiddleware;