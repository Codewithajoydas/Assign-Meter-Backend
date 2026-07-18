const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    pkg: {
      type: String,
      required: true,
      enum: [
        "ASS1",
        "ASS2",
        "ASS3",
        "ASS4",
        "ASS5",
        "ASS6",
        "ASS7",
        "ASS8",
        "ASS9",
        "ASS10",
      ],
    },
    expoNotificationToken:{
      type: String,
      default:null
    }
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
