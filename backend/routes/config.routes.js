const express = require("express");
const router = express.Router();
const { authMiddleware, isUser, isAdmin } = require("../middlewares/auth");

const {
  addConfig,
  getConfig,
  addDocType,
  addCategory,
  deleteConfigValue,
} = require("../controllers/config.controller");

router.post("/add", authMiddleware, isAdmin, addConfig);
router.get("/get", authMiddleware, isUser, getConfig);
router.post("/document", authMiddleware, isUser, addDocType);
router.post("/category", authMiddleware, isUser, addCategory);
router.post("/delete", authMiddleware, isUser, deleteConfigValue);

module.exports = router;
