const express = require("express");
const router = express.Router();

const {
    signUp,
    login,
    verify,
    logout,
    getUserDashboardData,
    getApproverDashboardData,
    changePassword,
    getUsers,
    updateUser
} = require("../controllers/user.controller");
const { authMiddleware, isUser } = require("../middlewares/auth");

router.post("/signup", signUp);
router.post("/login", login);
router.get("/verify", verify);
router.get("/logout", logout);
router.post("/user-dashboard", authMiddleware, isUser, getUserDashboardData);
router.post("/approver-dashboard", authMiddleware, isUser, getApproverDashboardData);
router.post("/change-password", authMiddleware, isUser, changePassword);
router.get("/list", authMiddleware, isUser, getUsers);
router.post("/update/:id", authMiddleware, isUser, updateUser);

module.exports = router;
