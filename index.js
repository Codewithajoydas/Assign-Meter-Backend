const express = require("express");
const app = express();
require("dotenv").config();
const connectToMongo = require("./config/mongoose");
const cookieParser = require("cookie-parser");
app.use(cookieParser()); 
 

connectToMongo();
const cors = require("cors");
const allowedOrigins = [
  "https://assign-meter-web.vercel.app",
  "http://localhost:3001",
  "exp://192.168.29.152:8081",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin); // reflect exact origin
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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
app.use("/api/download", require("./routes/download"));
app.use("/api/searchmeter", require("./routes/searchMeter"));
app.use("/api/createuser", require("./routes/createUser"));
app.use("/api/statusupdate", require("./routes/updateMeterStatus"));
const port = process.env.PORT;
app.listen(port, () => {
  console.log("server is running on port", port);
});
