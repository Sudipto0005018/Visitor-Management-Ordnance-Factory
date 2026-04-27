const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../utils/dbConnect");
const ApiErrorResponce = require("../utils/ApiErrorResponce");
const ApiResponse = require("../utils/ApiResponse");
const { createUserTable } = require("../utils/tableChakings");
const { getSqlTimeStamp } = require("../utils/helperFunctions");

const cookieOptions = {
  httpOnly: true,
  secure: true,
  expire: Date.now() + 1000 * 60 * 60 * 8, // 8 hours
  sameSite: "none",
};

async function signUp(req, res) {
  const {
    name,
    user_name,
    mobile,
    password,
    role,
    tenantId,
    status = 1,
  } = req.body;
  if (!name || !user_name || !password || !role || !tenantId) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "All fields are required"));
  }
  //  a1b2c3
  try {
    createUserTable(tenantId);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const query =
      "INSERT INTO users_" +
      tenantId +
      " (name, user_name, mobile, password, role, tenant_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)";

    const values = [
      name,
      user_name,
      mobile,
      hashedPassword,
      role,
      tenantId,
      status,
    ];
    const [insertResult] = await pool.query(query, values);
    const userId = insertResult.insertId;
    const [userRows] = await pool.query(
      "SELECT id, name, mobile, role, tenant_id FROM users_" +
        tenantId +
        " WHERE id = ?",
      [userId],
    );
    const user = userRows[0];
    return res
      .status(201)
      .json(new ApiResponse(201, { ...user }, "User created successfully"));
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(400)
        .json(new ApiErrorResponce(400, {}, "Mobile number already exists"));
    }

    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal server error"),
      );
  }
}

async function login(req, res) {
  const { username, password, tenantId } = req.body;

  if (!tenantId) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Tenant ID is required"));
  }
  if (!username || !password) {
    return res
      .status(400)
      .json(
        new ApiErrorResponce(400, {}, "Username and password are required"),
      );
  }

  try {
    let query = "SELECT * FROM tenants WHERE tenant_id = ?";
    let [tenantRows] = await pool.query(query, [tenantId]);

    if (tenantRows.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponce(404, {}, "Tenant not found"));
    }

    let startingDate = new Date(tenantRows[0].starting_date);
    let expiryDate = new Date(tenantRows[0].expary_date);
    const today = new Date();
    if (today < startingDate || today > expiryDate) {
      return res
        .status(403)
        .json(new ApiErrorResponce(403, {}, "Tenant access expired"));
    }

    query = "SELECT * FROM users_" + tenantId + " WHERE user_name = ?";
    let [rows] = await pool.query(query, [username]);

    if (rows.length === 0) {
      return res
        .status(401)
        .json(new ApiErrorResponce(404, {}, "Invalid credentials"));
    }

    const user = rows[0];

    // Check if user account is active
    if (user.status === 0 || user.status === false) {
      return res
        .status(403)
        .json(
          new ApiErrorResponce(
            403,
            {},
            "Account is deactivated. Please contact super admin",
          ),
        );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json(new ApiErrorResponce(401, {}, "Invalid credentials"));
    }

    delete user.password;
    const token = jwt.sign(
      {
        mobile: user.mobile,
        tenantId: user.tenant_id,
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      },
    );

    return res
      .status(200)
      .cookie("token", token, cookieOptions)
      .json(new ApiResponse(200, { ...user, token }, "Login successful"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal server error"),
      );
  }
}

async function verify(req, res) {
  const token = req.cookies?.token;

  if (!token) {
    return res
      .status(200)
      .clearCookie("token", cookieOptions)
      .json(
        new ApiErrorResponce(
          401,
          {},
          "Not authorized or token expired, Please login again",
        ),
      );
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tenantId = decoded.tenantId;
    const [rows] = await pool.query(
      "SELECT * FROM users_" + tenantId + " WHERE mobile = ?",
      [decoded.mobile],
    );
    if (rows.length === 0) {
      return res
        .status(401)
        .json(
          new ApiErrorResponce(401, {}, "User not found, Please login again"),
        );
    }
    const user = { ...rows[0] };
    delete user.password;
    const token2 = jwt.sign(
      { mobile: user.mobile, tenantId: user.tenant_id },
      process.env.JWT_SECRET,
    );
    return res
      .status(200)
      .cookie("token", token2, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { ...user, token: token2 },
          "Token verified successfully",
        ),
      );
  } catch (error) {
    return res
      .status(200)
      .json(new ApiErrorResponce(401, {}, "Invalid token, Please login again"));
  }
}

function logout(req, res) {
  return res
    .status(200)
    .clearCookie("token", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
}

async function getUserDashboardData(req, res) {
  const tenantId = req.user.tenant_id;
  const tableName = `visitors_${tenantId}`;
  const userTable = `users_${tenantId}`;
  const { size, page } = req.query;
  const limit = size ? parseInt(size) : 10;
  const offset = page ? (parseInt(page) - 1) * limit : 0;

  const { startDate, endDate, currentTime } = req.body;

  try {
    const query = `SELECT COUNT(*) AS total_visitors, 
                        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_visitors, 
                        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_visitors ,
                        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_visitors,
                        SUM(CASE WHEN out_time IS NOT NULL AND out_time < ? THEN 1 ELSE 0 END) AS total_out_visitors
                       FROM ${tableName}
                       WHERE created_at BETWEEN ? AND ?`;
    const [rows] = await pool.query(query, [currentTime, startDate, endDate]);

    if (Math.ceil(rows[0].total_visitors / limit) > parseInt(page)) {
      return res
        .status(400)
        .json(new ApiResponse(200, {}, "Page number exceeds total pages"));
    }

    const query2 = `SELECT id, name, whome_to_meet, in_time
                        FROM ${tableName}
                        WHERE (out_time < ? OR out_time IS NULL)
                        AND created_at BETWEEN ? AND ?
                        ORDER BY created_at DESC
                        LIMIT ? OFFSET ?;`;
    const [activeVisitors] = await pool.query(query2, [
      currentTime,
      startDate,
      endDate,
      limit,
      offset,
    ]);

    const query3 = `SELECT
                            v.id,
                            v.name,
                            v.whome_to_meet, 
                            v.purpose,
                            v.status,
                            v.in_time,
                            v.out_time,
                            v.Visitor_category, 
                            u.name AS created_by_name,
                            a.name AS approved_by_name
                        FROM ${tableName} v
                        LEFT JOIN ${userTable} u ON v.created_by = u.id
                        LEFT JOIN ${userTable} a ON v.approved_by = a.id
                        WHERE v.created_at BETWEEN ? AND ?
                        ORDER BY v.created_at DESC
                        LIMIT ? OFFSET ?`;
    const [visitorDetails] = await pool.query(query3, [
      startDate,
      endDate,
      limit,
      offset,
    ]);
    const query4 = `SELECT 
                            a.name,
                            a.whome_to_meet,
                            a.appoint_time
                        FROM appointments_${tenantId} a
                        WHERE a.status = 'approved'
                        AND a.appoint_time BETWEEN ? AND ?`;
    const [appointmentDetails] = await pool.query(query4, [startDate, endDate]);

    const dashboardData = {
      totalVisitors: rows[0].total_visitors,
      approvedVisitors: parseInt(rows[0].approved_visitors),
      rejectedVisitors: parseInt(rows[0].rejected_visitors),
      pendingVisitors: parseInt(rows[0].pending_visitors),
      totalOutVisitors: parseInt(rows[0].total_out_visitors),
      totalAppointments: appointmentDetails.length,
      activeVisitors: activeVisitors,
      visitorDetails: visitorDetails,
      appointmentDetails: appointmentDetails,
      startDate: startDate,
      endDate: endDate,
    };
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          dashboardData,
          "Dashboard data retrieved successfully",
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

async function getApproverDashboardData(req, res) {
  const tenantId = req.user.tenant_id;
  const tableName = `visitors_${tenantId}`;
  const userTable = `users_${tenantId}`;
  const { size, page } = req.query;
  const limit = size ? parseInt(size) : 10;
  const offset = page ? (parseInt(page) - 1) * limit : 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const startDate = req.body?.startDate || getSqlTimeStamp(d);
  d.setDate(d.getDate() + 1);
  const endDate = req.body?.endDate || getSqlTimeStamp(d);
  const currentTime = req.body?.currentTime || getSqlTimeStamp(new Date());

  try {
    const query = `SELECT 
                        COUNT(*) AS total_visitors, 
                        IFNULL(SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END), 0) AS approved_visitors, 
                        IFNULL(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END), 0) AS rejected_visitors,
                        IFNULL(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_visitors,
                        IFNULL(SUM(CASE WHEN out_time IS NOT NULL AND out_time < ? THEN 1 ELSE 0 END), 0) AS total_out_visitors
                      FROM ${tableName}
                      WHERE created_at BETWEEN ? AND ?`;
    const [rows] = await pool.query(query, [currentTime, startDate, endDate]);

    const query2 = `SELECT 
                          v.name, 
                          v.Visitor_category, 
                          v.whome_to_meet, 
                          v.purpose, 
                          v.created_by,
                          u.name as created_by
                        FROM ${tableName} v
                        LEFT JOIN ${userTable} u ON v.created_by = u.id
                        WHERE v.status = ? AND v.created_at BETWEEN ? AND ?
                        ORDER BY v.created_at DESC
                        LIMIT ? OFFSET ?`;
    const [approvalPendings] = await pool.query(query2, [
      "pending",
      startDate,
      endDate,
      limit,
      offset,
    ]);
    const query3 = `SELECT 
                            COUNT(*) as total, 
                            whome_to_meet
                        FROM appointments_${tenantId} 
                        WHERE created_at BETWEEN ? AND ?
                        GROUP BY whome_to_meet
                        ORDER BY whome_to_meet`;

    const query4 = `SELECT 
                          COUNT(*) as pending,
                          whome_to_meet
                        FROM appointments_${tenantId} 
                        WHERE status = ? AND created_at BETWEEN ? AND ?
                        GROUP BY whome_to_meet
                        ORDER BY whome_to_meet`;
    const [appointmentSummary1] = await pool.query(query3, [
      startDate,
      endDate,
    ]);
    const [appointmentSummary2] = await pool.query(query4, [
      "pending",
      startDate,
      endDate,
    ]);
    const appSummary = [];
    for (let i = 0; i < appointmentSummary1.length; i++) {
      const item = appointmentSummary1[i];
      const pendingItem = appointmentSummary2.find(
        (p) => p.whome_to_meet === item.whome_to_meet,
      );
      appSummary.push({
        whome_to_meet: item.whome_to_meet,
        total: item.total,
        pending: pendingItem ? pendingItem.pending : 0,
      });
    }
    const query5 = `
                    WITH RECURSIVE date_range AS (
                        SELECT CAST(? AS DATE) AS visit_date
                        UNION ALL
                        SELECT DATE_ADD(visit_date, INTERVAL 1 DAY)
                        FROM date_range
                        WHERE visit_date < CAST(? AS DATE)
                    )
                    SELECT 
                        dr.visit_date,
                        COUNT(v.id) AS total_visitors
                    FROM date_range dr
                    LEFT JOIN ${tableName} v ON DATE(v.created_at) = dr.visit_date
                    GROUP BY dr.visit_date
                    ORDER BY dr.visit_date DESC
                `;
    const today = new Date(endDate);
    today.setDate(today.getDate() - 1);
    const prev = new Date(today);
    prev.setDate(prev.getDate() - 4);
    const [dailyVisitors] = await pool.query(query5, [
      getSqlTimeStamp(prev),
      today,
    ]);
    const vd = new Date(startDate);
    const visitingDate = `${vd.getFullYear()}-${(vd.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${vd.getDate().toString().padStart(2, "0")}`;

    const query6 = `
                        WITH time_ranges AS (
                            SELECT '08:00–09:59' AS time_slot, '08:00:00' AS start_time, '09:59:59' AS end_time UNION ALL
                            SELECT '10:00–11:59', '10:00:00', '11:59:59' UNION ALL
                            SELECT '12:00–13:59', '12:00:00', '13:59:59' UNION ALL
                            SELECT '14:00–15:59', '14:00:00', '15:59:59' UNION ALL
                            SELECT '16:00–17:59', '16:00:00', '17:59:59' UNION ALL
                            SELECT '18:00–19:59', '18:00:00', '19:59:59'
                        )
                        SELECT
                            tr.time_slot,
                            COUNT(v.id) AS total_visitors,
                            COUNT(CASE WHEN v.status = 'pending' THEN 1 END) AS pending,
                            COUNT(CASE WHEN v.status = 'approved' THEN 1 END) AS approved,
                            COUNT(CASE WHEN v.status = 'rejected' THEN 1 END) AS rejected
                        FROM time_ranges tr
                        LEFT JOIN visitors_a1b2c3d4 v 
                            ON TIME(v.created_at) BETWEEN tr.start_time AND tr.end_time
                        AND DATE(v.created_at) = ?
                        GROUP BY tr.time_slot, tr.start_time
                        ORDER BY tr.start_time
                `;
    const [timeSlotVisitors] = await pool.query(query6, [visitingDate]);
    const appointmentQuery = `
                        SELECT COUNT(*) AS total
                        FROM appointments_${tenantId}
                        WHERE created_at BETWEEN ? AND ?
                    `;
    const [appointmentCount] = await pool.query(appointmentQuery, [
      startDate,
      endDate,
    ]);

    const dashboardData = {
      totalVisitors: rows[0].total_visitors,
      approvedVisitors: parseInt(rows[0].approved_visitors),
      rejectedVisitors: parseInt(rows[0].rejected_visitors),
      pendingVisitors: parseInt(rows[0].pending_visitors),
      totalOutVisitors: parseInt(rows[0].total_out_visitors),
      totalAppointments: appointmentCount[0].total,
      approvalPendings,
      appointmentSummary: appSummary,
      dailyVisitors,
      timeSlotVisitors,
    };
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          dashboardData,
          "Dashboard data retrieved successfully",
        ),
      );
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal server error"),
      );
  }
}

async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  const tenantId = req.user.tenant_id;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json(
        new ApiErrorResponce(400, {}, "Old and new passwords are required"),
      );
  }
  if (newPassword.length < 6) {
    return res
      .status(400)
      .json(
        new ApiErrorResponce(
          400,
          {},
          "Password must be at least 6 characters long",
        ),
      );
  }

  const tableName = `users_${tenantId}`;
  try {
    const [rows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [
      userId,
    ]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponce(404, {}, "User not found"));
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json(new ApiErrorResponce(401, {}, "Old password is incorrect"));
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query(`UPDATE ${tableName} SET password = ? WHERE id = ?`, [
      hashedPassword,
      userId,
    ]);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal server error"),
      );
  }
}

async function getUsers(req, res) {
  const tenantId = req.user.tenant_id;
  const tableName = `users_${tenantId}`;

  const { page = 1, size = 10, search = "" } = req.query;
  const limit = parseInt(size);
  const offset = (parseInt(page) - 1) * limit;

  try {
    let searchQuery = "";
    let values = [];

    if (search) {
      searchQuery = `WHERE name LIKE ? OR user_name LIKE ? OR mobile LIKE ?`;
      values = [`%${search}%`, `%${search}%`, `%${search}%`];
    }

    // total count
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM ${tableName} ${searchQuery}`,
      values,
    );

    // data
    const [rows] = await pool.query(
      `SELECT id, name, user_name, mobile, email, role, status
             FROM ${tableName}
             ${searchQuery}
             ORDER BY id DESC
             LIMIT ? OFFSET ?`,
      [...values, limit, offset],
    );

    return res.status(200).json({
      success: true,
      data: {
        items: rows,
        totalItems: countRows[0].total,
        totalPages: Math.ceil(countRows[0].total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function updateUser(req, res) {
  const tenantId = req.user.tenant_id;
  const { id } = req.params;
  const { name, user_name, mobile, role, status, password } = req.body;

  if (!id) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "User ID required"));
  }

  if (!name || !user_name || !role) {
    return res
      .status(400)
      .json(
        new ApiErrorResponce(
          400,
          {},
          "Name, Username, Password, Role are required",
        ),
      );
  }

  try {
    let query = `
      UPDATE users_${tenantId}
      SET name = ?, user_name = ?, mobile = ?, role = ?, status = ?
    `;

    let values = [name, user_name, mobile, role, status];

    // If password provided → update it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      query += `, password = ?`;
      values.push(hashedPassword);
    }

    query += ` WHERE id = ?`;
    values.push(id);

    await pool.query(query, values);

    return res.status(200).json(new ApiResponse(200, {}, "User updated"));
  } catch (error) {
    return res.status(500).json(new ApiErrorResponce(500, {}, error.message));
  }
}

module.exports = {
  signUp,
  login,
  verify,
  logout,
  getUserDashboardData,
  getApproverDashboardData,
  changePassword,
  getUsers,
  updateUser,
};
