const mongoose = require("mongoose");

const MeterSchema = new mongoose.Schema(
  {
    meterNumber: {
      type: String,
      required: true,
      unique: true,
    },

    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    equipCategory: {
      type: String,
      required: true,
      enum: ["CT", "METER", "NIC", "PT", "SEAL", "SIM"],
    },

    meterType: {
      type: String,
      required: true,
      enum: [
        "1P,2W,5-30A",
        "3P,4W,-/1A",
        "3P,4W,-/5A",
        "3P,4W,10-60A",
        "3P,4W,100/5A",
        "3P,4W,200/5A",
        "3P,4W,400/5A",
        "3P,4W,50/5A",
      ],
    },

    installationType: {
      type: String,
      enum: ["DTMeter", "FeederMeter", "HTCT", "LTCT", "LTWC"],
      required: true,
    },

    storeLocation: {
      type: String,
      enum: ["Golaghat", "Nagaon"],
      default: "Nagaon",
      required: true,
    },

    agency: {
      type: String,
      required: true,
    },

    installerId: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "pending", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Meter", MeterSchema);
