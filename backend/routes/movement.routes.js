const express = require("express");
const router = express.Router();

const { addMovement, getMovements } = require("../controllers/movement.controller");
const { authMiddleware } = require("../middlewares/auth");

router.post("/add", addMovement);
router.post("/", authMiddleware, getMovements);

module.exports = router;
