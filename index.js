const express = require("express");
const app = express();
require("dotenv").config();
const connectToMongo = require("./config/mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
const __dir = path.resolve();
app.use(cookieParser());
app.use(express.static(path.join(__dir, "public")));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
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

app.use("/api/signin", require("./routes/auth/signin"));
app.use("/api/signup", require("./routes/auth/signup"));
app.use("/api/meterassign", require("./routes/assign/meter/meterAssign"));
app.use("/api/deletemeter", require("./routes/assign/meter/deleteMeters"));
app.use(
  "/api/getmeterdetails",
  require("./routes/assign/meter/getMeterDetails"),
);
app.use("/api/nicassign", require("./routes/assign/nicAssign"));
app.use("/api/simassign", require("./routes/assign/simAssign"));
app.use("/api/sealassign", require("./routes/assign/sealAssign"));
app.use("/api/download", require("./routes/assign/meter/download"));
app.use("/api/searchmeter", require("./routes/assign/meter/searchMeter"));

app.use("/api/createuser", require("./routes/workforce/createUser"));
app.use("/api/deleteuser", require("./routes/workforce/deleteUser"));
app.use("/api/getusers", require("./routes/workforce/readUser"));
app.use("/api/updateuser", require("./routes/workforce/updateUser"));

app.use(
  "/api/statusupdate",
  require("./routes/assign/meter/updateMeterStatus"),
);
app.use("/api/wrongmeter", require("./routes/others/getInvalidMeters"));
app.use("/api/assign-location", require("./routes/others/meterLocation"));
app.use("/api/notification", require("./routes/others/notification"));
app.use(
  "/api/generateReport",
  require("./routes/reports/generate_unmapped_report"),
);
app.use(
  "/api/last-unmapped-report",
  require("./routes/reports/get_last_unmapp_report"),
);
app.use("/events", require("./routes/sse/sse"));
app.use("/api/bledevices", require("./routes/others/bleDevices"));
app.use(
  "/api/generate_unmapped_report_for_supervisor",
  require("./routes/reports/generate_unmapped_report_for_supervisor"),
);

app.use("/api/pivottabls/getallinstallername", require("./routes/reports/generate_pivot_table"));

const port = process.env.PORT;
app.listen(port, () => {
  console.log("server is running on port", port);
});
