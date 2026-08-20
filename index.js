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
  "http://localhost:3000",
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
app.use("/api/getmeterdetails", require("./routes/getMeterDetails"));
app.use("/api/nicassign", require("./routes/nicAssign"));
app.use("/api/simassign", require("./routes/simAssign"));
app.use("/api/sealassign", require("./routes/sealAssign"));
app.use("/api/download", require("./routes/download"));
app.use("/api/searchmeter", require("./routes/searchMeter"));
app.use("/api/createuser", require("./routes/createUser"));
app.use("/api/statusupdate", require("./routes/updateMeterStatus"));
app.use("/api/wrongmeter", require("./routes/getInvalidMeters"));
app.use("/api/assign-location", require("./routes/meterLocation"));
app.use("/api/notification", require("./routes/notification"));
app.use("/api/generateReport", require("./routes/generate_unmapped_report"));
app.use(
  "/api/last-unmapped-report",
  require("./routes/get_last_unmapp_report"),
);
app.use("/events", require("./routes/sse"));
app.use("/api/bledevices", require("./routes/bleDevices"));
app.use(
  "/api/generate_unmapped_report_for_supervisor",
  require("./routes/generate_unmapped_report_for_supervisor"),
);
const port = process.env.PORT;
app.listen(port, () => {
  console.log("server is running on port", port);
});
