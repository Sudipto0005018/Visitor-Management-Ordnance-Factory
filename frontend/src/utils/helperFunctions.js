function base64ToBlob(base64Data, contentType = "image/jpeg") {
  const base64String = base64Data.split(",")[1];
  if (!base64String) return null;
  const byteCharacters = atob(base64String);
  const byteArrays = [];
  for (let i = 0; i < byteCharacters.length; i += 512) {
    const slice = byteCharacters.slice(i, i + 512);
    const byteNumbers = new Array(slice.length);
    for (let j = 0; j < slice.length; j++) {
      byteNumbers[j] = slice.charCodeAt(j);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}

function getSqlTimeStamp(jsTimeStamp) {
  const d = new Date(jsTimeStamp);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  return date;
}

function isoToLocal(iso) {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date);
  return time;
}

function showCheckOutTime(time) {
  let d1;
  if (time) {
    d1 = new Date(time);
  } else {
    d1 = new Date();
  }
  if (d1.getTime() > new Date().getTime()) {
    return null;
  } else {
    return isoToLocal(time);
  }
}

function getAppointmentDate(date) {
  let d = new Date(date.toLocaleString());
  let dat = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;

  let h = d.getHours();
  let m = d.getMinutes();
  let ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  m = m < 10 ? "0" + m : m;
  h = h < 10 ? "0" + h : h;
  return `${dat} ${h}:${m} ${ampm}`;
}

function getTodayString() {
  const today = new Date();
  return `${today.getDate().toString().padStart(2, "0")}-${(
    today.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${today.getFullYear()}`;
}

async function makeAvatarName(name) {
  if (!name) return "";

  const initials = name
    ?.split(" ")
    ?.map((word) => word.charAt(0).toUpperCase())
    ?.join("");
  return initials;
}

function parsePassTime(passTime) {
  if (!passTime) return "";

  const date = new Date(passTime);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  day = day < 10 ? "0" + day : day;
  month = month < 10 ? "0" + month : month;
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} ${ampm}`;
}

const minifyRefNumber = (refNumber) => {
  if (!refNumber) return "";
  return `...${refNumber?.slice(6, 12)}`;
};

function getDateTime(date) {
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

function capitalizeWords(str) {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export {
  base64ToBlob,
  getSqlTimeStamp,
  isoToLocal,
  getAppointmentDate,
  getTodayString,
  makeAvatarName,
  parsePassTime,
  minifyRefNumber,
  showCheckOutTime,
  getDateTime,
  capitalizeWords,
};
