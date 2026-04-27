const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const cron = require("node-cron");
const { backupDatabase } = require("./utils/backup");

const { init } = require("./utils/socket");

dotenv.config({ path: "./.env", quiet: true });

// middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// serve static files
app.use("/images", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "build")));

// routes
const userRoutes = require("./routes/user.routes");
const tenantRoutes = require("./routes/tenant.routes");
const visitorRoutes = require("./routes/visitor.routes");
const configRoutes = require("./routes/config.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const employeeRoutes = require("./routes/employee.routes");
const movementRoutes = require("./routes/movement.routes");
const backupRoutes = require("./routes/backup.routes");

// Use the routes
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/tenant", tenantRoutes);
app.use("/api/v1/visitor", visitorRoutes);
app.use("/api/v1/config", configRoutes);
app.use("/api/v1/appointment", appointmentRoutes);
app.use("/api/v1/employee", employeeRoutes);
app.use("/api/v1/movement", movementRoutes);
app.use("/api/v1/backup", backupRoutes);

const PORT = process.env.PORT || 7777;

// SSL certificate and key
// const sslOptions = {
//     key: fs.readFileSync(path.join(__dirname, "./key/192.168.31.115-key.pem")),
//     cert: fs.readFileSync(path.join(__dirname, "./key/192.168.31.115.pem")),
// };

// const https = require("https");
// const server = https.createServer(sslOptions, app);
const http = require("http");
const server = http.createServer(app);
init(server); // Initialize socket.io with the HTTPS server

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.get("/api/helth", (req, res) => {
  res.json({ success: true });
});

cron.schedule(
  "24 15 * * *", // 3:24 pm
  async () => {
    console.log("Running backup...");

    try {
      const file = await backupDatabase();
      console.log("Backup successful:", file);
    } catch (error) {
      console.error("Backup failed:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);

// (async () => {
//   console.log("Running backup...");
//   const file = await backupDatabase();
//   console.log("Backup successful:", file);
// })()

server.listen(PORT, () => {
  console.log(`HTTP Server is running on http://localhost:${PORT}`);
});
