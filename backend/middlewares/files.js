const fs = require("fs");
const multer = require("multer");
const path = require("path");

const uploadDir =
  process.env.NODE_ENV == "production"
    ? path.join(__dirname, "uploads")
    : path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const y = now.getFullYear().toString();
    const m = (now.getMonth() + 1).toString().padStart(2, "0");
    const d = now.getDate().toString().padStart(2, "0");

    const uploadPath = path.join(uploadDir, y, m, d);

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const field = file.fieldname == "visitor_image" ? "visitor" : "document";
    const timestamp = Date.now();
    cb(null, `${field}_${timestamp}${ext}`);
  },
});
let limit = 1024 * 1024; // 1 MB
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      !file.mimetype.startsWith("image/") &&
      !file.mimetype.startsWith("application/pdf")
    ) {
      return cb(new Error("Only images and PDF are allowed"), false);
    }
    limit = req.tenant.max_file_size || limit; // Default to 1 MB if not set
    cb(null, true);
  },
  limits: {
    fileSize: limit * 1024,
  },
});

const visitorMiddleware = upload.fields([
  { name: "visitor_image", maxCount: 1 },
  { name: "document_image", maxCount: 1 },
]);

const appointmentMiddleware = upload.fields([
  { name: "ad_image", maxCount: 1 },
]);

module.exports = {
  upload,
  visitorMiddleware,
  appointmentMiddleware,
};


// const fs = require("fs");
// const multer = require("multer");
// const path = require("path");

// const uploadDir =
//   process.env.NODE_ENV == "production"
//     ? path.join(__dirname, "uploads")
//     : path.join(__dirname, "../uploads");
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     const field = file.fieldname == "visitor_image" ? "visitor" : "document";
//     const timestamp = Date.now();
//     cb(null, `${field}_${timestamp}_${req.user.tenant_id}${ext}`);
//   },
// });
// let limit = 1024 * 1024; // 1 MB
// const upload = multer({
//   storage,
//   fileFilter: (req, file, cb) => {
//     if (
//       !file.mimetype.startsWith("image/") &&
//       !file.mimetype.startsWith("application/pdf")
//     ) {
//       return cb(new Error("Only image files are allowed"), false);
//     }
//     limit = req.tenant.max_file_size || limit; // Default to 1 MB if not set
//     cb(null, true);
//   },
//   limits: {
//     fileSize: limit * 1024,
//   },
// });

// const visitorMiddleware = upload.fields([
//   { name: "visitor_image", maxCount: 1 },
//   { name: "document_image", maxCount: 1 },
// ]);

// const appointmentMiddleware = upload.fields([
//   { name: "ad_image", maxCount: 1 },
// ]);

// module.exports = {
//   upload,
//   visitorMiddleware,
//   appointmentMiddleware,
// };
