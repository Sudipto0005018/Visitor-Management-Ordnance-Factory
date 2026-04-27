const express = require("express");
const router = express.Router();
const {
  addVisitor,
  getVisitors,
  viewSingleVisitor,
  updateUserStatus,
  updateCheckOut,
  issueGatePass,
  searchVisitor,
  searchVisitorByDate,
  getApprovedUsers,
  verifyEmail,
  verifyOTP,
  issueQR,
  verifyMobile,
  verifyMobileOTP,
  checkoutVisitor,
  getHistory,
  generateVisitorReportPDF,
  generateVisitorReportCSV,
} = require("../controllers/visitor.controller");
const { visitorMiddleware } = require("../middlewares/files");
const { authMiddleware, isUser, isApprover } = require("../middlewares/auth");

router.post("/add", authMiddleware, isUser, visitorMiddleware, addVisitor);
router.get("/get", authMiddleware, isUser, getVisitors);
router.get("/get/:id", authMiddleware, isUser, viewSingleVisitor);
router.post("/update-status", authMiddleware, isApprover, updateUserStatus);
router.post("/update-checkout", authMiddleware, isUser, updateCheckOut);
router.get("/issue-gate-pass/:id", authMiddleware, isUser, issueGatePass);
router.get("/issue-qr/:id", authMiddleware, isUser, issueQR);
router.get("/search", authMiddleware, searchVisitor);
router.post("/search-by-date", authMiddleware, searchVisitorByDate);
router.post("/get-approved-users", authMiddleware, isUser, getApprovedUsers);
router.post("/verify-email", authMiddleware, isUser, verifyEmail);
router.post("/verify-email-otp", authMiddleware, isUser, verifyOTP);
router.post("/verify-mobile", authMiddleware, isUser, verifyMobile);
router.post("/verify-mobile-otp", authMiddleware, isUser, verifyMobileOTP);
router.post("/check-out", authMiddleware, isUser, checkoutVisitor);
router.post("/get-history", authMiddleware, isUser, getHistory);
router.post("/get-pdf", authMiddleware, isUser, generateVisitorReportPDF);
router.post("/get-csv", authMiddleware, isUser, generateVisitorReportCSV);

module.exports = router;
