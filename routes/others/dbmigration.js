const express = require("express");
const router = express.Router();

// update
router.get("/update", async (req, res) => {
  try {
    const UserDB = require("../../models/user");
    const updateUserDB = await UserDB.updateMany(
      { isAdmin: false },
      {
        $set: {
          role: "supervisor",
        },
      },
    );
    res.status(200).json({updateUserDB});
  } catch (error) {
    console.log(error);
  }
});


module.exports = router;