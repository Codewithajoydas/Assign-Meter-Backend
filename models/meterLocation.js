const mongoose = require("mongoose");

const meterLocationSchema = new mongoose.Schema({
    meterNumber: {
        type: String,
        required: true,
    },
    consumerNumber: {
        type: String,
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
},
    supervisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
},
});

module.exports = mongoose.model("MeterLocation", meterLocationSchema);