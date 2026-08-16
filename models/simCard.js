const mongoose = require("mongoose");

const SIMSchema = new mongoose.Schema(
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
      default: "SIM",
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
    nsp: {
      type: String,
      required: true,
      enum: ["Airtel", "Jio"],
    },
    status: {
      type: String,
      enum: ["active", "pending", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SIM", SIMSchema);
