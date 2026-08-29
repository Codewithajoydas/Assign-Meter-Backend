require("dotenv").config();
const readline = require("node:readline");
const UserDB = require("../../models/user");
const connectMongoDB = require("../../config/mongoose");
connectMongoDB();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(text) {
  return new Promise((resolve) => {
    rl.question(text, resolve);
  });
}

async function input() {
  try {
    console.log("Wencome to the superadmin creator");
    console.log("Check Email id is this exist or not?")
    const email = await question("Enter user email: ");
    const checkUser = await UserDB.findOne({ email });
    if (checkUser) {
      console.log("User already exists.");
      await UserDB.updateOne({ email }, { $set: { role: "superadmin" } });
      console.log("Superadmin updated successfully.");
      process.exit(0);
      return;
    }
    
    const name = await question("Enter user name: ");
    const pkg = await question("Enter user pkg: ");
    const user = await UserDB.create({
      name,
      email,
      pkg,
      role: "superadmin",
    });

    console.log("Superadmin created successfully.");
    console.log(user);
  } catch (error) {
    console.error("Failed to create superadmin:", error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

input();
