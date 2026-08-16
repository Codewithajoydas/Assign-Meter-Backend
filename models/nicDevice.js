const mongoose = require("mongoose");

const NICSchema = new mongoose.Schema(
  {
    equipmentNumber: {
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
      default: "NIC",
    },

    meterType: {
      type: String,
      required: true,
      enum: ["1 Phase", "3 Phase"],
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
    nicCommType: {
      type: String,
      required: true,
      enum: ["RF", "Cellular"],
    },
    status: {
      type: String,
      enum: ["active", "pending", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("NIC", NICSchema);
