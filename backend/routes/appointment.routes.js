const express = require("express");
const router = express.Router();

const {
    addAppointment,
    getAppointments,
    searchUser,
    approveRejectAppointment,
    getAppointmentByRefNumber,
    getAppointmentByDate,
} = require("../controllers/appointment.controller");

const { authMiddleware, isUser, isApprover } = require("../middlewares/auth");
const { appointmentMiddleware } = require("../middlewares/files");

router.post("/add", authMiddleware, isUser, appointmentMiddleware, addAppointment);
router.post("/get-appointments", authMiddleware, isUser, getAppointments);
router.post("/search", authMiddleware, isUser, searchUser);
router.post("/approve-reject", authMiddleware, isApprover, approveRejectAppointment);
router.get("/get-appointment/:refNumber", authMiddleware, isUser, getAppointmentByRefNumber);
router.post("/get-appointment-by-date", authMiddleware, isUser, getAppointmentByDate);

module.exports = router;
