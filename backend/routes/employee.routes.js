const express = require("express");
const router = express.Router();
const { authMiddleware, isUser } = require("../middlewares/auth");

const {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeDropdown,
  toggleEmployeeStatus,
} = require("../controllers/employees.controller");

router.get("/", authMiddleware, isUser, getEmployees);
router.get("/dropdown", authMiddleware, isUser, getEmployeeDropdown);
router.post("/add", authMiddleware, isUser, addEmployee);
router.put("/:id", authMiddleware, isUser, updateEmployee);
router.delete("/:id", authMiddleware, isUser, deleteEmployee);
router.put("/status/:id", authMiddleware, isUser, toggleEmployeeStatus);

module.exports = router;
