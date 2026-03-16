const express = require("express");
const app = express();
require("dotenv").config();
const connectToMongo = require("./config/mongoose");

connectToMongo();
const cors = require("cors");
app.use(
  cors({
    origin: ["exp://192.168.29.152:8081", "http://localhost:3001"],
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.use("/api/signin", require("./routes/signin"));
app.use("/api/signup", require("./routes/signup"));
app.use("/api/meterassign", require("./routes/meterAssign"));
app.use('/api/getmeterdetails', require('./routes/getMeterDetails'));
app.use("/api/nicassign", require("./routes/nicAssign"));
app.use("/api/simassign", require("./routes/simAssign"));
app.use("/api/sealassign", require("./routes/sealAssign"));
const port = process.env.PORT;
app.listen(port, () => {
  console.log("server is running on port", port);
});
