const pool = require("../utils/dbConnect");
const ApiErrorResponce = require("../utils/ApiErrorResponce");
const ApiResponse = require("../utils/ApiResponse");
const {
  generateReference,
  getSqlTimeStamp,
} = require("../utils/helperFunctions");
const { getIO } = require("../utils/socket");

// async function getEmployees(req, res) {
//     const tenantId = req.user.tenant_id;
//     const tableName = `employees_${tenantId}`;
//     const userTable = `users_${tenantId}`;
//     const query = `
//         SELECT e.*,
//                u.name AS created_by
//         FROM ${tableName} e
//         LEFT JOIN ${userTable} u ON e.created_by = u.id
//         ORDER BY e.created_at DESC;
//     `;
//     try {
//         const [rows] = await pool.query(query);
//         return res
//             .status(200)
//             .json(new ApiResponse(200, { employees: rows }, "Employees retrieved successfully"));
//     } catch (error) {
//         return res
//             .status(500)
//             .json(new ApiErrorResponce(500, {}, error.message || "Internal Server Error"));
//     }
// }

async function getEmployees(req, res) {
  const tenantId = req.user.tenant_id;
  const tableName = `employees_${tenantId}`;
  const userTable = `users_${tenantId}`;

  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 200;
  const offset = (page - 1) * size;
  const search = req.query.search;

  try {
    let searchQuery = "";
    let params = [];

    if (search) {
      searchQuery = `
        WHERE e.name LIKE ? 
        OR e.contact LIKE ? 
        OR e.email LIKE ? 
        OR e.designation LIKE ?
      `;
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    const [rows] = await pool.query(
      `SELECT e.*, u.name AS created_by
       FROM ${tableName} e
       LEFT JOIN ${userTable} u ON e.created_by = u.id
       ${searchQuery}
       ORDER BY e.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, size, offset],
    );

    const [[count]] = await pool.query(
      `SELECT COUNT(*) as total FROM ${tableName} e ${searchQuery}`,
      params,
    );

    return res.status(200).json({
      success: true,
      data: {
        employees: rows,
        items: rows,
        totalItems: count.total,
        totalPages: Math.ceil(count.total / size),
        currentPage: page,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getEmployeeDropdown(req, res) {
  const tenantId = req.user.tenant_id;
  const tableName = `employees_${tenantId}`;

  try {
    const [rows] = await pool.query(
      `SELECT id, name, designation 
       FROM ${tableName}
       WHERE status = 1 
       ORDER BY name ASC`,
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function addEmployee(req, res) {
  const tenantId = req.user.tenant_id;
  const userId = req.user.id;
  const tableName = `employees_${tenantId}`;

  const { name, email, contact, address, designation } = req.body;

  if (!name || !designation) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Missing required fields"));
  }

  // simple employee id generator
  const employee_id = `EMP-${Date.now()}`;

  try {
    const query = `
      INSERT INTO ${tableName} 
      (name, employee_id, email, contact, address, designation, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [row] = await pool.query(query, [
      name,
      employee_id,
      email || null,
      contact,
      address,
      designation,
      userId,
      getSqlTimeStamp(new Date()),
    ]);

    // socket notification (optional but keeping consistency)
    getIO()
      .to([`superuser-${tenantId}`])
      .emit("notification", {
        type: "employee_added",
        id: row.insertId,
        name,
        contact,
        employee_id,
      });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { name, email, contact, employee_id },
          "Employee added successfully",
        ),
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal server error"),
      );
  }
}

async function updateEmployee(req, res) {
  const tenantId = req.user.tenant_id;
  const tableName = `employees_${tenantId}`;
  const { id } = req.params;

  const { name, email, contact, address, designation, status } = req.body;

  if (!name || !designation) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  try {
    await pool.query(
      `UPDATE ${tableName}
       SET name=?, email=?, contact=?, address=?, designation=?, status=?
       WHERE id=?`,
      [name, email || null, contact, address, designation, status, id],
    );

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function deleteEmployee(req, res) {
  const tenantId = req.user.tenant_id;
  const tableName = `employees_${tenantId}`;
  const { id } = req.params;

  try {
    // await pool.query(`DELETE FROM ${tableName} WHERE id=?`, [id]);
    await pool.query(`UPDATE ${tableName} SET status = 0 WHERE id=?`, [id]);

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function toggleEmployeeStatus(req, res) {
  const tenantId = req.user.tenant_id;
  const tableName = `employees_${tenantId}`;
  const { id } = req.params;
  const { status } = req.body; // 0 or 1

  try {
    await pool.query(`UPDATE ${tableName} SET status=? WHERE id=?`, [
      status,
      id,
    ]);

    return res.status(200).json({
      success: true,
      message: "Status updated",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getEmployees,
  getEmployeeDropdown,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
};
