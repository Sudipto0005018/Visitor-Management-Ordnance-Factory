const express = require("express");
const router = express.Router();

const { addTenant } = require("../controllers/tenant.controller");

router.post("/add", addTenant);

module.exports = router;
