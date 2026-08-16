const mongoose = require("mongoose");

const sealSchema = new mongoose.Schema(
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
    sealType: {
      type: String,
      required: true,
      enum: [
        "Box Seal",
        "GTW Seal",
        "Left Seal",
        "NIC Seal",
        "Right Seal",
        "Terminal Seal",
      ],
    },
    status: {
      type: String,
      enum: ["active", "pending", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SEAL", sealSchema);
