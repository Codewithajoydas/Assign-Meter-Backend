const mongoose = require("mongoose")

const BleDevicesSchema = new mongoose.Schema({
    deviceId: {
        type: String,

    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    localName: {
        type: String,
        required: true,
    },
    rssi: {
        type: Number,
        required: true,
    },
    location: {
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
        accuracy: {
            type: Number,
            required: true,
        },
    },
    supervisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    scannedAt: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    timestamps: true
})

module.exports = mongoose.model("BleDevices", BleDevicesSchema)