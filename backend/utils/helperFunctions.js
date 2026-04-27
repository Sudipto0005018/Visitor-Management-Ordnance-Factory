const fs = require("fs");
const path = require("path");
const fsPromises = require("fs").promises;
const sharp = require("sharp");

function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

function validateMobile(mobile) {
    const mobilePattern = /^\d{10}$/;
    return mobilePattern.test(mobile);
}

function unlinkFiles(files) {
    if (files && files.length > 0) {
        files.forEach((file) => {
            if (file) {
                fs.unlinkSync(file);
            }
        });
    }
}

async function resizeImage(imagePath, width, height) {
    const outputPath = path.join(path.dirname(imagePath), `resized_${path.basename(imagePath)}`);
    await sharp(imagePath).resize(width, height).toFile(outputPath);
    return outputPath;
}

async function getBase64Image(imagePath) {
    try {
        const buffer = await fsPromises.readFile(imagePath);
        const ext = path.extname(imagePath).slice(1);
        return `data:image/${ext};base64,${buffer.toString("base64")}`;
    } catch (err) {
        console.error("Failed to load image:", err);
        return "";
    }
}

function getTimeString(date) {
    const d = new Date(date);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);

    const time = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    return `${day}/${month}/${year} ${time}`;
}

function getDateOnly(date) {
  const d = new Date(date);

  const day = String(d.getDate()).padStart(2, "0");

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  const month = months[d.getMonth()];
  const year = d.getFullYear();

  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${day}-${month}-${year}`;
}

function getTimeOnly(date) {
  const d = new Date(date);

  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${time}`;
}
function getISTString(systemDate = new Date()) {
    const options = {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    };

    const parts = new Intl.DateTimeFormat("en-GB", options)
        .formatToParts(systemDate)
        .reduce((acc, part) => {
            if (part.type !== "literal") acc[part.type] = part.value;
            return acc;
        }, {});

    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function addTImeToDate(date, hours) {
    const d = new Date(date);

    d.setHours(d.getHours() + hours);
    return d;
}

function getSqlTimeStamp(jsTimeStamp) {
    const d = new Date(jsTimeStamp);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
        2,
        "0"
    )}:${String(d.getSeconds()).padStart(2, "0")}`;
    return date;
}

function generateReference() {
    const ts = Date.now().toString().slice(1); // last 12 digits
    return ts; // repeat in 31y
}
const formatDate = (date, includeTime = true, separator = ", ") => {
  if (!date) return "-";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  if (!includeTime) return `${day}/${month}/${year}`;

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strTime = `${String(hours).padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;

  return `${day}/${month}/${year}${separator}${strTime}`;
};

module.exports = {
    validateEmail,
    validateMobile,
    unlinkFiles,
    getBase64Image,
    getTimeString,
    addTImeToDate,
    getSqlTimeStamp,
    resizeImage,
    generateReference,
    getISTString,
    getTimeOnly,
    getDateOnly,
    formatDate
};
