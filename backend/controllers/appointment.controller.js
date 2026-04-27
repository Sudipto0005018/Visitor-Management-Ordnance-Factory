const ApiErrorResponce = require("../utils/ApiErrorResponce");
const ApiResponse = require("../utils/ApiResponse");
const {
  getSqlTimeStamp,
  validateMobile,
  unlinkFiles,
} = require("../utils/helperFunctions");
const pool = require("../utils/dbConnect");
const fs = require("fs").promises;
const path = require("path");

//new
const uploadDir =
  process.env.NODE_ENV == "production"
    ? path.join(__dirname, "uploads")
    : path.join(__dirname, "../uploads");
//end of new

async function addAppointment(req, res) {
  const tenantId = req.user.tenant_id;
  const tableName = `appointments_${tenantId}`;
  const {
    name,
    email,
    visitor_contact,
    visitor_address,
    whome_to_meet,
    unit_name,
    designation,
    purpose,
    reference,
    ref_date,
  } = req.body;

  //new
  //   const uploadIdx = req.files.visitor_image[0].path?.indexOf("uploads\\");
  //   const relativePath = req.files.visitor_image[0].path.substr(
  //     uploadIdx + 8,
  //     10,
  //   );

  // if (!req.files || !req.files.ad_image) {
  //   return res
  //     .status(400)
  //     .json(new ApiErrorResponce(400, {}, "Document image is required"));
  // }

  let file = null;
  let files = [];
  if (req.files?.ad_image) {
    file = req.files?.ad_image[0];

    const uploadIdx = file.path?.indexOf("uploads\\");
    const relativePath = file.path?.substr(uploadIdx + 8, 10);

    files = [
      req.files?.ad_image
        ? path.join(uploadDir, relativePath, req.files.ad_image[0].filename)
        : null,
    ];
  }

  //   const files = [
  //     req.files.visitor_image
  //       ? path.join(uploadDir, relativePath, req.files.visitor_image[0].filename)
  //       : null,
  //     req.files.document_image
  //       ? path.join(uploadDir, relativePath, req.files.document_image[0].filename)
  //       : null,
  //   ];
  //end of new

  if (
    !name ||
    !visitor_contact ||
    !visitor_address ||
    !whome_to_meet ||
    !purpose ||
    !reference ||
    !ref_date
  ) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Missing required fields"));
  }

  if (!validateMobile(visitor_contact)) {
    unlinkFiles(files);
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Invalid mobile number"));
  }
  //new
  //   const visitorImagePath = files[0]
  //     ? relativePath + "\\" + req.files.visitor_image[0].filename
  //     : null;
  //   const documentImagePath = files[1]
  //     ? relativePath + "\\" + req.files.document_image[0].filename
  //     : null;

  //   if (!visitorImagePath) {
  //     unlinkFiles(files);
  //     return res
  //       .status(400)
  //       .json(new ApiErrorResponce(400, {}, "Visitor image is required"));
  //   }
  //end of new

  const connection = await pool.getConnection();
  try {
    let document_image = null;
    if (req.files && req.files.ad_image) {
      // document_image = req.files.ad_image[0].filename;
      document_image = req.files.ad_image[0].path.replace(uploadDir, "");
    }
    await connection.beginTransaction();
    const query = `
            INSERT INTO ${tableName} (ref_number, ref_date, name, email, visitor_contact, visitor_address, whome_to_meet, purpose, unit_name, designation, created_at, document_image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    await connection.query(query, [
      reference,
      new Date(ref_date),
      name,
      email,
      visitor_contact,
      visitor_address,
      whome_to_meet.toLowerCase(),
      purpose,
      unit_name,
      designation,
      getSqlTimeStamp(new Date()),
      document_image,
    ]);
    connection.commit();

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { name, email, visitor_contact, reference },
          "Appointment added successfully",
        ),
      );
  } catch (error) {
    if (req.files && req.files.ad_image) {
      await fs.unlink(req.files.ad_image[0].path);
    }
    await connection.rollback();
    let errMsg = error.message;
    if (
      errMsg.indexOf("Duplicate entry") >= 0 &&
      errMsg.indexOf("ref_number") >= 0
    ) {
      errMsg = "Duplicate reference number";
    }
    return res
      .status(500)
      .json(new ApiErrorResponce(500, {}, errMsg || "Internal server error"));
  } finally {
    connection.release();
  }
}

async function searchUser(req, res) {
  const { tenant_id } = req.user;
  const { search } = req.body;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.size) || 10;
  const offset = (page - 1) * pageSize;

  if (!search || search.trim() === "") {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Search term is required"));
  }

  const tableName = `appointments_${tenant_id}`;
  const userTable = `users_${tenant_id}`;
  const query = `
        SELECT v.*,
        u.name as approved_by
        FROM ${tableName} v
        LEFT JOIN ${userTable} u ON v.approved_by = u.id
        WHERE 
            v.name LIKE ? OR
            v.visitor_contact LIKE ? OR
            v.email LIKE ? OR
            v.whome_to_meet LIKE ? OR
            v.ref_number LIKE ?
        ORDER BY v.created_at DESC
        LIMIT ? OFFSET ?
    `;
  const searchTerm = `%${search}%`;
  const queryParams = [
    searchTerm,
    searchTerm,
    searchTerm,
    searchTerm,
    searchTerm,
    pageSize,
    offset,
  ];
  try {
    const [rows] = await pool.query(query, queryParams);
    if (rows.length === 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { data: [], totalPages: 0, currentPage: 0, pageSize },
            "No users found",
          ),
        );
    }
    const countQuery = `
            SELECT COUNT(id) as total
            FROM ${tableName}
            WHERE 
                name LIKE ? OR
                visitor_contact LIKE ? OR
                email LIKE ? OR
                whome_to_meet LIKE ? OR
                ref_number LIKE ?
        `;
    queryParams.splice(-2);
    const [countRows] = await pool.query(countQuery, queryParams);
    const total = countRows[0].total;
    const totalPages = Math.ceil(total / pageSize);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          data: rows,
          totalPages,
          currentPage: page,
          pageSize,
          totalItems: total,
        },
        "Users retrieved successfully",
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

async function getAppointments(req, res) {
  const tenantId = req.user.tenant_id;
  const { startDate, endDate, status } = req.body;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.size) || 10;
  const offset = (page - 1) * pageSize;
  const tableName = `appointments_${tenantId}`;
  const userTable = `users_${tenantId}`;
  let query = "";
  let query2 = "";
  let queryParams;

  if (!startDate && !endDate && !status) {
    query = `
            SELECT
                v.*,
                u.name as approved_by
            FROM ${tableName} v
            LEFT JOIN ${userTable} u ON v.approved_by = u.id
            ORDER BY v.id DESC
            LIMIT ? OFFSET ?
        `;
    query2 = `
            SELECT COUNT(id) as total
            FROM ${tableName}
        `;
    queryParams = [pageSize, offset];
  } else if (startDate && endDate && !status) {
    query = `
            SELECT
                v.*,
                u.name as approved_by
            FROM ${tableName} v
            LEFT JOIN ${userTable} u ON v.approved_by = u.id
            WHERE v.created_at BETWEEN ? AND ?
            ORDER BY v.id DESC
            LIMIT ? OFFSET ?
        `;
    query2 = `
            SELECT COUNT(id) as total
            FROM ${tableName}
            WHERE created_at BETWEEN ? AND ?
        `;
    queryParams = [startDate, endDate, pageSize, offset];
  } else if (status && !startDate && !endDate) {
    query = `
            SELECT
                v.*,
                u.name as approved_by
            FROM ${tableName} v
            LEFT JOIN ${userTable} u ON v.approved_by = u.id
            WHERE v.status = ?
            ORDER BY v.id DESC
            LIMIT ? OFFSET ?
        `;
    query2 = `
            SELECT COUNT(id) as total
            FROM ${tableName}
            WHERE status = ?
        `;
    queryParams = [status, pageSize, offset];
  } else {
    query = `
            SELECT
                v.*,
                u.name as approved_by
            FROM ${tableName} v
            LEFT JOIN ${userTable} u ON v.approved_by = u.id
            WHERE v.status = ? AND v.created_at BETWEEN ? AND ?
            ORDER BY v.id DESC
            LIMIT ? OFFSET ?
        `;
    query2 = `
            SELECT COUNT(id) as total
            FROM ${tableName}
            WHERE status = ? AND created_at BETWEEN ? AND ?
        `;
    queryParams = [status, startDate, endDate, pageSize, offset];
  }
  try {
    const [rows] = await pool.query(query, queryParams);
    if (rows.length === 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            data: [],
            totalPages: 0,
            currentPage: 0,
            pageSize,
            totalItems: 0,
          },
          "No appointments found",
        ),
      );
    }
    queryParams.splice(-2);
    const [pageData] = await pool.query(query2, queryParams);
    const total = pageData[0].total;
    const totalPages = Math.ceil(total / pageSize);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          data: rows,
          totalPages,
          currentPage: page,
          pageSize,
          totalItems: total,
        },
        "Appointments retrieved successfully",
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

async function approveRejectAppointment(req, res) {
  const { ref_number, status, comment, appoint_time } = req.body;

  const tenantId = req.user.tenant_id;
  const approved_by = req.user.id;
  const tableName = `appointments_${tenantId}`;
  if (!ref_number || !status) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Missing required fields"));
  }
  if (status !== "approved" && status !== "rejected") {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Invalid status value"));
  }
  if (status === "rejected" && !comment) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Comment is required for rejection"));
  }
  if (status === "approved" && !appoint_time) {
    return res
      .status(400)
      .json(
        new ApiErrorResponce(
          400,
          {},
          "Appointment time is required for approval",
        ),
      );
  }
  const approved_at = getSqlTimeStamp(new Date());
  const query = `
        UPDATE ${tableName}
        SET status = ?, approved_by = ?, approved_at = ?, comment = ?, appoint_time = ?
        WHERE ref_number = ? AND status = 'pending'
    `;
  try {
    const [result] = await pool.query(query, [
      status,
      approved_by,
      approved_at,
      comment ? comment : null,
      status === "approved" ? appoint_time : null,
      ref_number,
    ]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(
          new ApiErrorResponce(
            404,
            {},
            "Appointment not found or already processed",
          ),
        );
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Appointment processed successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal server error"),
      );
  }
}

async function getAppointmentByRefNumber(req, res) {
  const tenantId = req.user.tenant_id;
  const ref_number = req.params.refNumber;
  const tableName = `appointments_${tenantId}`;
  const userTable = `users_${tenantId}`;
  if (!ref_number) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Reference number is required"));
  }
  const query = `
        SELECT v.*,
        u.name as approved_by,
        v.approved_by as approved_by_id
        FROM ${tableName} v
        LEFT JOIN ${userTable} u ON v.approved_by = u.id
        WHERE v.ref_number = ? AND v.status = 'approved'
    `;
  try {
    const [rows] = await pool.query(query, [ref_number]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponce(404, {}, "Appointment not found"));
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, rows[0], "Appointment retrieved successfully"),
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal server error"),
      );
  }
}

async function getAppointmentByDate(req, res) {
  const tenantId = req.user.tenant_id;
  const { date } = req.body;
  const tableName = `appointments_${tenantId}`;
  if (!date) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Date is required"));
  }
  const query = `
        SELECT ref_number, name
        FROM ${tableName}
        WHERE status = 'approved' AND DATE(appoint_time) = ?
    `;
  try {
    const [rows] = await pool.query(query, [date]);
    if (rows.length === 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(200, [], "No appointments found for the given date"),
        );
    }
    return res
      .status(200)
      .json(new ApiResponse(200, rows, "Appointments retrieved successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal server error"),
      );
  }
}

module.exports = {
  addAppointment,
  getAppointments,
  searchUser,
  approveRejectAppointment,
  getAppointmentByRefNumber,
  getAppointmentByDate,
};
