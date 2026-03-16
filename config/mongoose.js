const mongoose = require("mongoose");

async function connectToMongo() {
  try {
    await mongoose.connect(process.env.MONGOOSE_URL);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

module.exports = connectToMongo;
