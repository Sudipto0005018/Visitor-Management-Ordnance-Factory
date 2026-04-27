const path = require("path");
const qr = require("qrcode");
const bcrypt = require("bcrypt");
const ejs = require("ejs");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const fsPromise = require("fs/promises");

const pool = require("../utils/dbConnect");
const ApiErrorResponce = require("../utils/ApiErrorResponce");
const ApiResponse = require("../utils/ApiResponse");
const { createVisitorTable } = require("../utils/tableChakings");

const uploadDir =
  process.env.NODE_ENV == "production"
    ? path.join(__dirname, "uploads")
    : path.join(__dirname, "../uploads");

const {
  validateEmail,
  validateMobile,
  unlinkFiles,
  getBase64Image,
  getTimeString,
  addTImeToDate,
  getSqlTimeStamp,
  resizeImage,
  generateReference,
  getISTString,
  getTimeOnly,
  getDateOnly,
  formatDate,
} = require("../utils/helperFunctions");
const { sendOTPEmail } = require("../utils/sendMail");
const { getIO } = require("../utils/socket");
const { getBrowser } = require("../utils/browser");

async function addVisitor(req, res) {
  let {
    name,
    email,
    visitor_contact,
    whome_to_meet,
    designation,
    unit_name,
    city,
    document_type,
    document_number,
    purpose,
    vehicle_number,
    in_time,
    visitor_address,
    user_name,
    Visitor_category,
    ref_number,
    mobile_verified = false,
    email_verified = false,
    status = "pending",
    approved_by = null,
    fingerprint = null,
    document_name = null,
  } = req.body;

  if (typeof mobile_verified == "string") {
    mobile_verified = mobile_verified.toLowerCase() === "true";
  }
  if (typeof email_verified == "string") {
    email_verified = email_verified.toLowerCase() === "true";
  }
  const uploadIdx = req.files.visitor_image[0].path?.indexOf("uploads\\");
  const relativePath = req.files.visitor_image[0].path.substr(
    uploadIdx + 8,
    10,
  );

  const files = [
    req.files.visitor_image
      ? path.join(uploadDir, relativePath, req.files.visitor_image[0].filename)
      : null,
    req.files.document_image
      ? path.join(uploadDir, relativePath, req.files.document_image[0].filename)
      : null,
  ];

  // let totalUploadSizeBytes = 0;
  // if (req.files.visitor_image?.[0])
  //   totalUploadSizeBytes += req.files.visitor_image[0].size;
  // if (req.files.document_image?.[0])
  //   totalUploadSizeBytes += req.files.document_image[0].size;
  // const totalUploadSizeKB = totalUploadSizeBytes / 1024;

  // try {
  //   const [[tenant]] = await pool.query(
  //     `SELECT storage_limit, storage_used FROM tenants WHERE tenant_id = ?`,
  //     [req.user.tenant_id],
  //   );

  //   if (!tenant) {
  //     unlinkFiles(files);
  //     return res
  //       .status(404)
  //       .json(new ApiErrorResponce(404, {}, "Tenant not found"));
  //   }

  //   if (tenant.storage_used + totalUploadSizeKB > tenant.storage_limit) {
  //     unlinkFiles(files);
  //     return res
  //       .status(400)
  //       .json(
  //         new ApiErrorResponce(
  //           400,
  //           {},
  //           "Storage limit exceeded. Cannot upload more files.",
  //         ),
  //       );
  //   }
  // } catch (err) {
  //   unlinkFiles(files);
  //   return res
  //     .status(500)
  //     .json(new ApiErrorResponce(500, {}, "Error checking storage limit"));
  // }

  if (
    !name ||
    !visitor_contact ||
    !whome_to_meet ||
    !purpose ||
    !in_time ||
    !document_type ||
    !visitor_address ||
    !user_name ||
    !Visitor_category ||
    !designation
  ) {
    unlinkFiles(files);
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Required fields are missing"));
  }
  if (!validateMobile(visitor_contact)) {
    unlinkFiles(files);
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Invalid mobile number"));
  }
  if (email && !validateEmail(email)) {
    unlinkFiles(files);
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Invalid email address"));
  }

  const visitorImagePath = files[0]
    ? relativePath + "\\" + req.files.visitor_image[0].filename
    : null;
  const documentImagePath = files[1]
    ? relativePath + "\\" + req.files.document_image[0].filename
    : null;

  if (!visitorImagePath) {
    unlinkFiles(files);
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Visitor image is required"));
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const createdBy = req.user.id;
    const tenantId = req.user.tenant_id;
    const created_at = getSqlTimeStamp(getISTString());

    const insertVisitorQuery = `
            INSERT INTO visitors_${tenantId} (
                ref_number, name, email, visitor_contact, visitor_address, unit_name, city, visitor_image, whome_to_meet,
                designation, document_type, document_number, document_image, purpose,
                vehicle_number, in_time, created_by, Visitor_category, user_name, created_at,
                mobile_verified, email_verified, status, approved_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;

    const values = [
      ref_number || generateReference(),
      name,
      email || null,
      visitor_contact,
      visitor_address,
      unit_name || null,
      city || null,
      visitorImagePath,
      whome_to_meet,
      designation,
      document_type || null,
      document_number || null,
      documentImagePath || document_name,
      purpose,
      vehicle_number || null,
      in_time,
      createdBy,
      Visitor_category,
      user_name,
      created_at,
      mobile_verified,
      email_verified,
      status,
      approved_by || null,
    ];

    const [row] = await connection.query(insertVisitorQuery, values);
    if (row.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      unlinkFiles(files);
      return res
        .status(500)
        .json(new ApiErrorResponce(500, {}, "Failed to add visitor"));
    }

    const visitorId = row.insertId;

    if (fingerprint) {
      await connection.query(
        `INSERT INTO visitor_fps_${tenantId} (visitor_id, fp) VALUES (?, ?)`,
        [visitorId, fingerprint],
      );
    }

    await connection.commit();
    connection.release();

    getIO()
      .to([`approver-${tenantId}`, `superuser-${tenantId}`])
      .emit("notification", {
        type: "visitor_added",
        id: visitorId,
        name,
        visitor_contact,
        in_time,
        visitor_address,
        user_name,
        Visitor_category,
        ref_number: ref_number,
      });

    res
      .status(201)
      .json(new ApiResponse(201, {}, "Visitor added successfully"));
  } catch (error) {
    await connection.rollback();
    connection.release();
    unlinkFiles(files);
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
      );
  }
}

async function getVisitors(req, res) {
  const tenantId = req.user.tenant_id;

  await createVisitorTable(tenantId);
  const tableName = `visitors_${tenantId}`;
  const userTable = `users_${tenantId}`;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.size) || 10;
  const offset = (page - 1) * pageSize;

  try {
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM ${tableName}`,
    );
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages == 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            items: [],
            totalItems: 0,
            totalPages: 0,
            currentPage: 1,
            pageSize,
          },
          "No visitor found",
        ),
      );
    }
    if (page > totalPages) {
      return res
        .status(404)
        .json(new ApiErrorResponce(404, {}, "Invalid page number"));
    }
    const query = `
            SELECT 
                v.*,
                creator.name AS creator_name,
                creator.mobile AS creator_mobile,
                approver.name AS approver_name,
                approver.mobile AS approver_mobile
            FROM ${tableName} v
            LEFT JOIN ${userTable} creator ON v.created_by = creator.id
            LEFT JOIN ${userTable} approver ON v.approved_by = approver.id
            ORDER BY v.created_at DESC
            LIMIT ? OFFSET ?;
        `;
    const [rows] = await pool.query(query, [pageSize, offset]);
    res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems,
          totalPages,
          currentPage: page,
          pageSize,
        },
        "Visitors fetched successfully",
      ),
    );
  } catch (error) {
    res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
      );
  }
}

async function viewSingleVisitor(req, res) {
  const tenantId = req.user.tenant_id;
  await createVisitorTable(tenantId);
  const visitorId = req.params.id;
  const tableName = `visitors_${tenantId}`;
  try {
    const query = `
            SELECT 
                v.*,
                creator.name AS creator_name,
                creator.mobile AS creator_mobile,
                approver.name AS approver_name,
                approver.mobile AS approver_mobile,
                updater.name AS updater_name,
                updater.mobile AS updater_mobile
            FROM ${tableName} v
            LEFT JOIN users_${tenantId} creator ON v.created_by = creator.id
            LEFT JOIN users_${tenantId} approver ON v.approved_by = approver.id
            LEFT JOIN users_${tenantId} updater ON v.checkout_updated_by = updater.id
            WHERE v.id = ?;
        `;
    const [rows] = await pool.query(query, [visitorId]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponce(404, {}, "Visitor not found"));
    }
    const data = rows[0];
    delete data.created_by;
    delete data.approved_by;
    delete data.checkout_updated_by;

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Visitor details fetched successfully"));
  } catch (error) {
    res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
      );
  }
}

async function updateUserStatus(req, res) {
  const tenantId = req.user.tenant_id;
  const { id, status } = req.body;
  if (!id || !status) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "ID and status are required"));
  }
  if (status == "rejected" && !req.body.comment) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Comment is required for rejection"));
  }
  const { comment } = req.body;
  if (comment && comment.length > 500) {
    return res
      .status(400)
      .json(
        new ApiErrorResponce(
          400,
          {},
          "Comment should not exceed 500 characters",
        ),
      );
  }
  const approved_by = req.user.id;

  try {
    const query = `UPDATE visitors_${tenantId} SET status = ?, approved_by = ?, comment = ? WHERE id = ?`;
    const [result] = await pool.query(query, [
      status,
      approved_by,
      comment ? comment : null,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponce(404, {}, "Visitor not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Visitor status updated successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
      );
  }
}

async function updateCheckOut(req, res) {
  const tenantId = req.user.tenant_id;
  const { id, out_time, required_registration, comment } = req.body;
  const checkout_updated_by = req.user.id;
  if (!id || !out_time) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "ID and out time are required"));
  }
  try {
    const query = `
            UPDATE visitors_${tenantId} 
            SET out_time = ?, required_registration = ?, comment = ?, checkout_updated_by = ?
            WHERE id = ?;
        `;
    const [result] = await pool.query(query, [
      out_time,
      required_registration || false,
      comment || null,
      checkout_updated_by,
      id,
    ]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponce(404, {}, "Visitor not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Visitor checked out successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
      );
  }
}

async function issueGatePass(req, res) {
  const tenantId = req.user.tenant_id;
  const { id } = req.params;
  const { rfid_num } = req.query;

  if (!id) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Visitor ID is required"));
  }

  try {
    // const [config] = await pool.query(
    //   `SELECT * FROM config_${tenantId} WHERE key_name = ? OR key_name = ? OR key_name = ?`,
    //   ["gate_pass_expairy_time", "visitor_exp_times", "visitor_types"],
    // );

    // let visitorTypes = [];
    // let exp_times = [];
    // const expObj = {};
    // let vis = config.filter((c) => c.key_name === "visitor_types");
    // if (vis.length > 0) {
    //   visitorTypes = vis[0].value.split(";").map((type) => type.trim());
    // }
    // let exp = config.filter((c) => c.key_name === "visitor_exp_times");
    // if (exp.length > 0) {
    //   exp_times = exp[0].value.split(";").map((time) => parseInt(time.trim()));
    // }
    // for (let i = 0; i < visitorTypes.length; i++) {
    //   expObj[visitorTypes[i].toLowerCase().trim()] = exp_times[i];
    // }

    const [rfidUser] = await pool.query(
      `SELECT * FROM visitors_${tenantId} WHERE rfid_num = ? AND checkout_updated_by IS NULL`,
      [rfid_num],
    );
    if (rfidUser.length > 0) {
      return res
        .status(400)
        .json(new ApiErrorResponce(400, {}, "Card is already issued"));
    }

    // Fetch updated visitor
    const [selectResult] = await pool.query(
      `SELECT * FROM visitors_${tenantId} WHERE id = ?`,
      [id],
    );
    const v = selectResult[0];
    // const category = v.Visitor_category.toLowerCase().trim();

    const imageName = v.visitor_image.split("/").pop();
    const imagePath = path.join(uploadDir, imageName);

    // const expTime = addTImeToDate(getISTString(), expObj[category] || 24);
    // const pass_expiry_time = getTimeString(getISTString(expTime));
    const ref = v.ref_number || generateReference();

    let query;
    let values;
    if (rfid_num) {
      // Update Last visitor with same RFID
      await pool.query(
        `UPDATE visitors_${tenantId}
                SET rfid_num = NULL
                WHERE id = (
                    SELECT id FROM (
                        SELECT id
                        FROM visitors_${tenantId}
                        WHERE rfid_num = ?
                        ORDER BY created_at DESC
                        LIMIT 1
                    ) AS subquery
                )`,
        [rfid_num.toUpperCase()],
      );
      query = `UPDATE visitors_${tenantId} SET gate_pass_issued = TRUE, gate_pass_time = ?, rfid_num = ?  WHERE id = ?`;
      values = [getSqlTimeStamp(getISTString()), rfid_num.toUpperCase(), id];
    } else {
      query = `UPDATE visitors_${tenantId} SET gate_pass_issued = TRUE, gate_pass_time = ? WHERE id = ?`;
      values = [getSqlTimeStamp(getISTString()), id];
    }
    // const idVal = values.pop();
    // values.push(getSqlTimeStamp(getISTString(expTime)), idVal);
    await pool.query(query, values);

    // const qrDetails = `Reference No: ${ref}\nName: ${v.name}\nContact: ${v.visitor_contact}\nCheck-out time: ${pass_expiry_time}`;

    // Generate QR & Image in parallel
    const [imageBase64] = await Promise.all([
      getBase64Image(await resizeImage(imagePath, 150, 150)),
    ]);
    let imgName = imageName.substr(11);
    const relativePath = imageName.substr(0, 10);

    unlinkFiles([path.join(uploadDir, relativePath, "resized_" + imgName)]);

    // Prepare visitor object //Previously all were in getTimeString(instead of getDateOnly, getTimeOnly)
    const visitor = {
      id: v.id,
      name: v.name,
      reference: ref,
      contact: v.visitor_contact,
      address: v.visitor_address,
      email: v.email || "",
      registrationTime: getTimeString(new Date(v.created_at)),
      issueTime: getTimeOnly(getISTString()),
      // expiryTime: pass_expiry_time,
      issuedBy: "GBT Tech Solution",
      image: imageBase64,
      rfid_num: rfid_num ? rfid_num.toUpperCase() : v.rfid_num,

      unit_name: v.unit_name,
      city: v.city,
      nationality: v.nationality || "Indian",
      whome_to_meet: v.whome_to_meet,
      designation: v.designation,
      purpose: v.purpose,
      date: getDateOnly(getISTString()),
    };

    // Generate PDF using PDFKit instead of EJS
    const pdfBuffer = await generateGatePassPDF(visitor);
    const pdfLocation = getPDFDir();
    const pdfName =
      visitor.reference + "_" + visitor.name + "_" + visitor.date + ".pdf";
    // const pdfName = `${visitor.reference}_${visitor.name}_${visitor.date}.pdf`;
    if (!fs.existsSync(pdfLocation)) {
      fs.mkdirSync(pdfLocation, { recursive: true });
    }
    await fsPromise.writeFile(path.join(pdfLocation, pdfName), pdfBuffer);

    // Send PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=gate_pass_${ref}.pdf`,
    );
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
      );
  }
}

// async function generateGatePassPDF(visitor) {
//     return new Promise((resolve) => {
//         const doc = new PDFDocument({ size: "A4", margin: 20 });
//         const buffers = [];
//         doc.on("data", buffers.push.bind(buffers));
//         doc.on("end", () => resolve(Buffer.concat(buffers)));

//         // Title
//         doc.fontSize(20).font("Helvetica-Bold").text("Gate Pass", { align: "center" });
//         doc.strokeColor("#cccccc");
//         doc.moveTo(20, 50).lineTo(580, 50).lineWidth(1).stroke();

//         // Left images
//         doc.image(visitor.image, 30, 70, { width: 100, height: 100 });
//         doc.image(visitor.qr, 25, 205, { width: 115, height: 115 });

//         // Table
//         let startX = 150;
//         let startY = 70;
//         let rowHeight = 30;
//         let col1Width = 165;
//         let col2Width = 265;
//         const tableData = [
//             ["Visitor Name", visitor.name],
//             ["Visitor Reference", visitor.reference],
//             ["Visitor Address", visitor.address],
//             ["Visitor Contact No", visitor.contact],
//             ["Visitor Email", visitor.email],
//             ["Registration Time", visitor.registrationTime],
//             ["Check in Date & Time", visitor.issueTime],
//             ["Check out Date & Time", visitor.expiryTime],
//         ];

//         doc.fontSize(12).font("Helvetica");
//         tableData.forEach((row, i) => {
//             const y = startY + i * rowHeight;
//             doc.rect(startX, y, col1Width, rowHeight).lineWidth(0.5).stroke();
//             doc.rect(startX + col1Width, y, col2Width, rowHeight)
//                 .lineWidth(0.5)
//                 .stroke();
//             doc.text(row[0], startX + 5, y + 10, { width: col1Width - 10 });
//             doc.text(row[1], startX + col1Width + 5, y + 10, { width: col2Width - 10 });
//         });

//         // Footer
//         doc.moveTo(30, 335).lineTo(580, 335).lineWidth(0.5).stroke();
//         doc.fontSize(14)
//             .font("Helvetica-Bold")
//             .text(`This gate pass has been issued by ${visitor.issuedBy}`, 50, 350, {
//                 align: "center",
//             });

//         doc.end();
//     });
// }

async function generateGatePassPDF(visitor) {
  const templatePath = path.join(process.cwd(), "template", "gatePass.ejs");

  //read logo
  const logoPath = path.join(process.cwd(), "template", "GSF.png");
  const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });

  const html = await ejs.renderFile(templatePath, {
    visitor,
    logo: `data:image/jpeg;base64,${logoBase64}`,
  });

  // const browser = await puppeteer.launch({
  //     headless: "new",
  //     args: ["--no-sandbox"],
  // });

  const browser = await getBrowser();

  const page = await browser.newPage();

  // await page.setContent(html, { waitUntil: "domcontentloaded" });

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    // width: "1000px",
    // height: "700px",
    width: "210mm",
    height: "148.5mm",
    printBackground: true,
    margin: {
      top: "0px",
      right: "0px",
      bottom: "0px",
      left: "0px",
    },
  });

  await page.close();

  //   await browser.close();

  return pdf;
}

async function searchVisitor(req, res) {
  const tenantId = req.user.tenant_id;
  const { query } = req.query;

  if (!query) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Search query is required"));
  }

  try {
    const tableName = `visitors_${tenantId}`;
    const sqlQuery = `
            SELECT * FROM ${tableName} 
            WHERE name LIKE ? OR visitor_contact LIKE ? OR FLOOR(UNIX_TIMESTAMP(created_at)) LIKE ?
            ORDER BY created_at DESC;
        `;

    const [rows] = await pool.query(sqlQuery, [
      `%${query}%`,
      `%${query}%`,
      `%${query}%`,
    ]);

    if (rows.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No visitors found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, rows, "Visitors fetched successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
      );
  }
}

async function searchVisitorByDate(req, res) {
  const tenantId = req.user.tenant_id;
  await createVisitorTable(tenantId);
  const tableName = `visitors_${tenantId}`;
  const userTable = `users_${tenantId}`;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.size) || 5;
  const offset = (page - 1) * pageSize;
  const { startDate, endDate, search } = req.body;

  const sqlQuery = `
        SELECT
            v.*,
            creator.name AS creator_name,
            creator.mobile AS creator_mobile,
            approver.name AS approver_name,
            approver.mobile AS approver_mobile
        FROM ${tableName} v
        LEFT JOIN ${userTable} creator ON v.created_by = creator.id
        LEFT JOIN ${userTable} approver ON v.approved_by = approver.id
        WHERE (v.name LIKE ? OR v.visitor_contact LIKE ? OR v.visitor_contact LIKE ? OR v.whome_to_meet LIKE ?) 
            AND v.in_time BETWEEN ? AND ?
        ORDER BY v.created_at DESC
        LIMIT ? OFFSET ?;
    `;
  const values = [
    `%${search}%`,
    `%${search}%`,
    `%${search}%`,
    `%${search}%`,
    startDate,
    endDate,
    pageSize,
    offset,
  ];
  try {
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM ${tableName} WHERE (name LIKE ? OR visitor_contact LIKE ? OR visitor_contact LIKE ? OR whome_to_meet LIKE ?) 
            AND in_time BETWEEN ? AND ?`,
      [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        startDate,
        endDate,
      ],
    );
    console.log(countRows, "sdf");

    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / pageSize);

    if (totalItems == 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            items: [],
            totalItems,
            totalPages: 0,
            currentPage: page,
            pageSize,
          },
          "Visitors fetched successfully",
        ),
      );
    }

    const [rows] = await pool.query(sqlQuery, values);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems,
          totalPages,
          currentPage: page,
          pageSize,
        },
        "Visitors fetched successfully",
      ),
    );
  } catch (error) {
    console.log(error);

    res.json(
      new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
    );
  }
}

// async function getApprovedUsers(req, res) {
//   const tenantId = req.user.tenant_id;
//   const tableName = `visitors_${tenantId}`;
//   const userTable = `users_${tenantId}`;
//   const page = parseInt(req.query.page) || 1;
//   const pageSize = parseInt(req.query.size) || 10;
//   const offset = (page - 1) * pageSize;
//   const { startDate, endDate } = req.body;
//   const query = `
//         SELECT
//             v.*,
//             a.name AS approved_by,
//             c.name AS created_by
//         FROM ${tableName} v
//         LEFT JOIN ${userTable} a ON v.approved_by = a.id
//         LEFT JOIN ${userTable} c ON v.created_by = c.id
//         WHERE v.status = 'approved' AND v.in_time BETWEEN ? AND ?
//         ORDER BY v.in_time DESC
//         LIMIT ? OFFSET ?;
//     `;
//   const values = [startDate, endDate, pageSize, offset];
//   try {
//     const [countRows] = await pool.query(
//       `SELECT COUNT(*) AS total FROM ${tableName} WHERE status = 'approved' AND in_time BETWEEN ? AND ?`,
//       [startDate, endDate],
//     );
//     const totalItems = countRows[0].total;
//     const totalPages = Math.ceil(totalItems / pageSize);
//     if (totalItems == 0) {
//       return res.status(200).json(
//         new ApiResponse(
//           200,
//           {
//             items: [],
//             totalItems: 0,
//             totalPages: 0,
//             currentPage: page,
//             pageSize,
//           },
//           "No approved visitors found",
//         ),
//       );
//     }
//     if (page > totalPages) {
//       return res
//         .status(404)
//         .json(new ApiErrorResponce(404, {}, "Invalid page number"));
//     }
//     const [rows] = await pool.query(query, values);
//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           items: rows,
//           totalItems,
//           totalPages,
//           currentPage: page,
//           pageSize,
//         },
//         "Approved visitors fetched successfully",
//       ),
//     );
//   } catch (error) {
//     return res
//       .status(500)
//       .json(
//         new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
//       );
//   }
// }

async function getApprovedUsers(req, res) {
  const tenantId = req.user.tenant_id;
  const tableName = `visitors_${tenantId}`;
  const userTable = `users_${tenantId}`;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.size) || 10;
  const offset = (page - 1) * pageSize;
  const { startDate, endDate, search } = req.body;

  const query = `
  SELECT 
      v.*,
      a.name AS approved_by,
      c.name AS created_by
  FROM ${tableName} v
  LEFT JOIN ${userTable} a ON v.approved_by = a.id
  LEFT JOIN ${userTable} c ON v.created_by = c.id
  WHERE v.status = 'approved' 
    AND v.in_time BETWEEN ? AND ?
    AND (
      v.name LIKE ? OR
      v.visitor_contact LIKE ? OR
      v.ref_number LIKE ?
    )
  ORDER BY v.in_time DESC
  LIMIT ? OFFSET ?;
`;
  const searchValue = `%${search || ""}%`;

  const values = [
    startDate,
    endDate,
    searchValue,
    searchValue,
    searchValue,
    pageSize,
    offset,
  ];
  try {
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total 
   FROM ${tableName} 
   WHERE status = 'approved' 
   AND in_time BETWEEN ? AND ?
   AND (
      name LIKE ? OR
      visitor_contact LIKE ? OR
      ref_number LIKE ?
   )`,
      [startDate, endDate, searchValue, searchValue, searchValue],
    );
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalItems == 0) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            items: [],
            totalItems: 0,
            totalPages: 0,
            currentPage: page,
            pageSize,
          },
          "No approved visitors found",
        ),
      );
    }
    if (page > totalPages) {
      return res
        .status(404)
        .json(new ApiErrorResponce(404, {}, "Invalid page number"));
    }
    const [rows] = await pool.query(query, values);
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: rows,
          totalItems,
          totalPages,
          currentPage: page,
          pageSize,
        },
        "Approved visitors fetched successfully",
      ),
    );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
      );
  }
}

async function verifyEmail(req, res) {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Email is required"));
  }
  if (!validateEmail(email)) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Invalid email address"));
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    await sendOTPEmail(email, otp);
    console.log(otp);
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);
    return res
      .status(200)
      .cookie("email", hashedOTP, {
        httpOnly: true,
        secure: true,
        expire: Date.now() + 5 * 60 * 1000,
      })
      .json(
        new ApiResponse(200, {}, "OTP sent to your email for verification"),
      );
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return res
      .status(500)
      .json(new ApiErrorResponce(500, {}, "Failed to send OTP email"));
  }
}

async function verifyOTP(req, res) {
  const { otp } = req.body;
  if (!otp) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "OTP is required"));
  }
  const cookieOtp = req.cookies?.email;
  if (!cookieOtp) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Invalid OTP or OTP expired"));
  }
  const isMatch = await bcrypt.compare(otp, cookieOtp);
  if (!isMatch) {
    return res.status(400).json(new ApiErrorResponce(400, {}, "Invalid OTP"));
  }
  return res
    .status(200)
    .clearCookie("otp")
    .json(new ApiResponse(200, {}, "OTP verified successfully"));
}

async function issueQR(req, res) {
  const tenantId = req.user.tenant_id;
  const { id } = req.params;
  const { rfid_num } = req.query;

  if (!id) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Visitor ID is required"));
  }

  try {
    const [config] = await pool.query(
      `SELECT * FROM config_${tenantId} WHERE key_name = ? OR key_name = ? OR key_name = ?`,
      ["gate_pass_expairy_time", "visitor_exp_times", "visitor_types"],
    );

    let visitorTypes = [];
    let exp_times = [];
    const expObj = {};

    let vis = config.filter((c) => c.key_name === "visitor_types");
    if (vis.length > 0) {
      visitorTypes = vis[0].value.split(";").map((type) => type.trim());
    }

    let exp = config.filter((c) => c.key_name === "visitor_exp_times");
    if (exp.length > 0) {
      exp_times = exp[0].value.split(";").map((time) => parseInt(time.trim()));
    }

    for (let i = 0; i < visitorTypes.length; i++) {
      expObj[visitorTypes[i].toLowerCase().trim()] = exp_times[i];
    }

    // Update DB — unchanged from your original
    let query;
    let values;
    if (rfid_num) {
      await pool.query(
        `UPDATE visitors_${tenantId}
                SET rfid_num = NULL
                WHERE id = (
                    SELECT id FROM (
                        SELECT id
                        FROM visitors_${tenantId}
                        WHERE rfid_num = ?
                        ORDER BY created_at DESC
                        LIMIT 1
                    ) AS subquery
                )`,
        [rfid_num.toUpperCase()],
      );
      query = `UPDATE visitors_${tenantId} SET gate_pass_issued = TRUE, gate_pass_time = ?, rfid_num = ?, out_time = ? WHERE id = ?`;
      values = [getSqlTimeStamp(getISTString()), rfid_num, id];
    } else {
      query = `UPDATE visitors_${tenantId} SET gate_pass_issued = TRUE, gate_pass_time = ?, out_time = ? WHERE id = ?`;
      values = [getSqlTimeStamp(getISTString()), id];
    }

    // Fetch updated visitor
    const [selectResult] = await pool.query(
      `SELECT * FROM visitors_${tenantId} WHERE id = ?`,
      [id],
    );
    if (selectResult.length === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponce(404, {}, "Visitor not found"));
    }

    const v = selectResult[0];
    const category = v.Visitor_category.toLowerCase().trim();
    const sqlOutTime = addTImeToDate(getISTString(), expObj[category] || 24);
    const pass_expiry_time = getTimeString(sqlOutTime);

    // Complete SQL update
    const idVal = values.pop();
    values.push(getSqlTimeStamp(sqlOutTime), idVal);
    await pool.query(query, values);

    // QR details
    const qrDetails2 = `Ref no: ${v.ref_number}, \nName: ${v.name}, \nContact: ${v.visitor_contact}, \nCheck-out time: ${pass_expiry_time}`;
    const qrCode = await qr.toDataURL(qrDetails2);

    // PDF with QR code
    const pdfBuffer = await generateQRPdf(qrCode, v.ref_number);

    // Send PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=qr_code_${v.ref_number}.pdf`,
    );
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
      );
  }
}

async function generateQRPdf(qrBase64, ref_number) {
  return new Promise((resolve) => {
    // Create PDF document (size: 5cm x 2.5cm in points)
    const doc = new PDFDocument({ size: [141.73, 70.86] });
    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.image(qrBase64, 0, 0, { width: 60, height: 60 });

    const imgPath = path.join(__dirname, "../template/GSF.png");
    doc.image(imgPath, 141.73 - 60, 10, { width: 60, height: 37 });

    doc.fontSize(8).text(`${ref_number}`, 0, 62, {
      width: 141.73,
      height: 10,
      align: "center",
    });
    doc.end();
  });
}

async function verifyMobile(req, res) {
  const { mobile } = req.body;
  if (!mobile) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Mobile number is required"));
  }
  if (!validateMobile(mobile)) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Invalid mobile number"));
  }

  try {
    const URL = process.env.SMS_API_URL;
    const API_KEY = process.env.SMS_API_KEY;
    const SENDER_ID = process.env.SMS_SENDER_ID;
    if (!URL || !API_KEY || !SENDER_ID) {
      return res
        .status(500)
        .json(new ApiErrorResponce(500, {}, "Failed to send OTP"));
    }
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apikey: API_KEY,
        senderid: SENDER_ID,
        number: mobile,
        message: `Your Access Code for test is {OTP}. \n -TEPL`,
        format: "json",
        digit: "6",
        intl: "1",
      }),
    });
    const data = await response.json();
    console.log(data);

    if (data.Status !== "Success") {
      return res
        .status(500)
        .json(
          new ApiErrorResponce(500, {}, data.message || "Failed to send OTP"),
        );
    }
    const otp = data.Details;
    return res
      .status(200)
      .cookie("mobile", otp, {
        httpOnly: true,
        secure: true,
        expire: Date.now() + 5 * 60 * 1000,
      })
      .json(
        new ApiResponse(200, {}, "OTP sent to your mobile for verification"),
      );
  } catch (error) {
    return res
      .status(500)
      .json(new ApiErrorResponce(500, {}, "Failed to send OTP"));
  }
}

async function verifyMobileOTP(req, res) {
  const { otp } = req.body;
  if (!otp) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "OTP is required"));
  }
  const cookieOtp = req.cookies?.mobile;
  if (!cookieOtp) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Invalid OTP or OTP expired"));
  }
  const smsVerificationURL = process.env.SMS_VERIFICATION_URL;
  if (!smsVerificationURL) {
    return res
      .status(500)
      .json(new ApiErrorResponce(500, {}, "Failed to verify OTP"));
  }
  const response = await fetch(smsVerificationURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apikey: process.env.SMS_API_KEY,
      otp: otp,
      sessionid: cookieOtp,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    return res
      .status(500)
      .json(
        new ApiErrorResponce(
          500,
          {},
          errorData.message || "Failed to verify OTP",
        ),
      );
  }
  const responseData = await response.json();
  if (responseData.Status !== "Success") {
    return res
      .status(400)
      .json(
        new ApiErrorResponce(400, {}, responseData.message || "Invalid OTP"),
      );
  }
  const isMatch = responseData.Status == "Success";
  if (!isMatch) {
    return res.status(400).json(new ApiErrorResponce(400, {}, "Invalid OTP"));
  }
  return res
    .status(200)
    .clearCookie("mobile")
    .json(new ApiResponse(200, {}, "OTP verified successfully"));
}

async function checkoutVisitor(req, res) {
  const { id, out_time } = req.body;
  if (!id || !out_time) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "ID and out time are required"));
  }
  try {
    const query = `
            UPDATE visitors_${req.user.tenant_id} 
            SET out_time = ?, checkout_updated_by = ?
            WHERE id = ?;
        `;
    const [result] = await pool.query(query, [out_time, req.user.id, id]);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json(new ApiErrorResponce(404, {}, "Visitor not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Visitor checked out successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiErrorResponce(500, {}, "Failed to checkout visitor"));
  }
}

// async function getHistory(req, res) {
//   try {
//     const { current_time } = req.body;
//     const page = parseInt(req.query.page) || 1;
//     const pageSize = parseInt(req.query.size) || 5;
//     const offset = (page - 1) * pageSize;
//     if (page < 1) {
//       return res
//         .status(400)
//         .json(new ApiErrorResponce(400, {}, "Invalid page number"));
//     }
//     if (!current_time) {
//       return res
//         .status(400)
//         .json(new ApiErrorResponce(400, {}, "Current time is required"));
//     }
//     const d = new Date(current_time);
//     const endDate = getSqlTimeStamp(d);
//     d.setHours(0, 0, 0, 0);
//     d.setDate(d.getDate() - 60);
//     const startDate = getSqlTimeStamp(d);
//     const [totalRows] = await pool.query(
//       `SELECT COUNT(*) AS total FROM visitors_${req.user.tenant_id} WHERE out_time BETWEEN ? AND ?`,
//       [startDate, endDate],
//     );
//     const totalPages = Math.ceil(totalRows[0].total / pageSize);
//     if (page > totalPages) {
//       return res
//         .status(400)
//         .json(new ApiErrorResponce(400, {}, "Invalid page number"));
//     }
//     if (totalRows[0].total == 0) {
//       return res.status(200).json(
//         new ApiResponse(
//           200,
//           {
//             items: [],
//             totalItems: 0,
//             totalPages: 0,
//             currentPage: 1,
//             pageSize: pageSize,
//           },
//           "No history found",
//         ),
//       );
//     }

//     const query = `SELECT * FROM visitors_${req.user.tenant_id} WHERE out_time BETWEEN ? AND ? ORDER BY out_time DESC LIMIT ? OFFSET ?;`;
//     const [result] = await pool.query(query, [
//       startDate,
//       endDate,
//       pageSize,
//       offset,
//     ]);
//     return res.status(200).json(
//       new ApiResponse(
//         200,
//         {
//           items: result,
//           totalItems: totalRows[0].total,
//           totalPages: totalPages,
//           currentPage: page,
//           pageSize: pageSize,
//         },
//         "History fetched successfully",
//       ),
//     );
//   } catch (error) {
//     res
//       .status(500)
//       .json(new ApiErrorResponce(500, {}, "Failed to get history"));
//   }
// }

async function getHistory(req, res) {
  try {
    const { current_time, search, startDate, endDate } = req.body;

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.size) || 5;
    const offset = (page - 1) * pageSize;

    if (!current_time) {
      return res.status(400).json({ message: "Current time is required" });
    }

    let filters = [];
    let values = [];

    if (startDate && endDate) {
      filters.push("out_time BETWEEN ? AND ?");
      values.push(startDate, endDate);
    }

    if (search) {
      filters.push(`
        (
          name LIKE ? OR
          ref_number LIKE ? OR
          visitor_contact LIKE ? OR
          whome_to_meet LIKE ?
        )
      `);

      const searchVal = `%${search}%`;
      values.push(searchVal, searchVal, searchVal, searchVal);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [totalRows] = await pool.query(
      `SELECT COUNT(*) as total FROM visitors_${req.user.tenant_id} ${whereClause}`,
      values,
    );

    const totalPages = Math.ceil(totalRows[0].total / pageSize);

    const [result] = await pool.query(
      `SELECT * FROM visitors_${req.user.tenant_id}
       ${whereClause}
       ORDER BY out_time DESC
       LIMIT ? OFFSET ?`,
      [...values, pageSize, offset],
    );

    return res.status(200).json({
      success: true,
      data: {
        items: result,
        totalItems: totalRows[0].total,
        totalPages,
        currentPage: page,
        pageSize,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get history" });
  }
}

function getPDFDir() {
  const d = new Date();
  const y = d.getFullYear().toString();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const dt = d.getDate().toString().padStart(2, "0");
  return process.env.NODE_ENV == "production"
    ? path.join(__dirname, "gatepass", y, m, dt)
    : path.join(__dirname, "..", "gatepass", y, m, dt);
}

const toTitleCase = (str) => {
  return str
    ? str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
      )
    : "-";
};

async function generateVisitorReportPDF(req, res) {
  const tenantId = req.user.tenant_id;
  const { startDate, endDate, currentTime } = req.body;
  // const pool = await poolPromise;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json(
        new ApiErrorResponce(400, {}, "Start date and end date are required"),
      );
  }

  try {
    const tableName = `visitors_${tenantId}`;
    const userTable = `users_${tenantId}`;

    const query = `
            SELECT *
            FROM ${tableName} 
            WHERE in_time BETWEEN ? AND ?
            ORDER BY in_time DESC
        `;

    const queryParams = [startDate, endDate];
    const [rows] = await pool.execute(query, queryParams);

    const doc = new PDFDocument({
      margin: 20,
      size: "A4",
      layout: "landscape",
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=visitor_report.pdf");
    doc.pipe(res);

    const startX = 20;
    const startY = 30;
    const tableTop = 65;
    const rowHeight = 35;
    const borderThickness = 0.1;
    const colWidths = [40, 100, 70, 60, 80, 90, 90, 90, 90, 90, 80];
    const headers = [
      "Image",
      "Name",
      "Contact No.",
      "Status",
      "Purpose",
      "Whom to Meet",
      "Document Type",
      "Check In",
      "Check Out",
      "Card No.",
    ];

    const drawTableHeader = (y) => {
      let x = startX;
      doc.lineWidth(borderThickness);
      doc.fontSize(10).font("Helvetica-Bold");
      headers.forEach((text, i) => {
        const width = colWidths[i];
        doc.rect(x, y, width, rowHeight).stroke();
        doc.text(text, x + 2, y + 12, { width: width - 4, align: "center" });
        x += width;
      });
    };

    const drawDataRow = (y, data) => {
      let x = startX;
      doc.lineWidth(borderThickness);
      data.forEach((text, i) => {
        const width = colWidths[i];
        doc.rect(x, y, width, rowHeight).stroke();
        const fontSize = 9;
        doc.fontSize(fontSize).font("Helvetica");
        if (i === 0 && text) {
          try {
            if (fs.existsSync(text)) {
              doc.image(text, x + 5, y + 2, {
                width: 30,
                height: 30,
                fit: [30, 30],
              });
            }
          } catch (e) {}
        } else {
          doc.text(text || "-", x + 2, y + 10, {
            width: width - 4,
            align: "center",
          });
        }
        x += width;
      });
    };

    const drawFooter = (page) => {
      const footerY = 560;
      doc.fontSize(8).font("Helvetica");
      doc.text(
        `Page ${page} of ${totalPages} | Generated on ${formatDate(new Date(currentTime), true, " ")}`,
        startX,
        footerY,
        { align: "center", width: 800 },
      );
    };

    const logoPath = path.join(__dirname, "../template/GSF.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, startX, 15, { width: 40, height: 37 });
    }

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`Gun & Shell Factory`, { align: "center" });
    doc.fontSize(12).text("Visitor Report", { align: "center" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `From: ${formatDate(startDate, false)}    To: ${formatDate(endDate, false)}`,
        {
          align: "center",
        },
      );

    let currentY = tableTop;
    let currentPageRows = 0;
    let pageNumber = 1;
    const firstPageLimit = 12;
    const otherPageLimit = 14;

    const totalRows = rows.length;
    const totalPages =
      totalRows <= firstPageLimit
        ? 1
        : Math.ceil((totalRows - firstPageLimit) / otherPageLimit) + 1;

    drawTableHeader(currentY);
    currentY += rowHeight;

    for (const v of rows) {
      const imagePath = v.visitor_image
        ? path.join(__dirname, "../uploads", path.basename(v.visitor_image))
        : null;

      const rowData = [
        imagePath,
        toTitleCase(v.name),
        v.visitor_contact,
        toTitleCase(v.status),
        toTitleCase(v.purpose),
        toTitleCase(v.whome_to_meet),
        toTitleCase(v.document_type),
        formatDate(v.in_time, true, "\n"),
        formatDate(v.out_time, true, "\n"),
        v.rfid_num || "--",
      ];

      const limit = pageNumber === 1 ? firstPageLimit : otherPageLimit;

      if (currentPageRows >= limit) {
        drawFooter(pageNumber);
        doc.addPage();
        pageNumber++;
        currentPageRows = 0;
        currentY = startY;
        drawTableHeader(currentY);
        currentY += rowHeight;
      }

      drawDataRow(currentY, rowData);
      currentY += rowHeight;
      currentPageRows++;
    }

    drawFooter(pageNumber);
    doc.end();
  } catch (error) {
    console.error("PDF Generation Error:", error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json(
          new ApiErrorResponce(
            500,
            {},
            error.message || "Internal Server Error",
          ),
        );
    }
  }
}

async function generateVisitorReportCSV(req, res) {
  const tenantId = req.user.tenant_id;
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({
      message: "Start date and end date are required",
    });
  }

  try {
    const tableName = `visitors_${tenantId}`;

    const query = `
      SELECT *
      FROM ${tableName}
      WHERE in_time BETWEEN ? AND ?
      ORDER BY in_time DESC
    `;

    const [rows] = await pool.execute(query, [startDate, endDate]);

    // ✅ Updated Headers
    const headers = [
      "Name",
      "Email",
      "Contact No.",
      "Status",
      "Purpose",
      "Whom to Meet",
      "Visitor Category",
      "Designation",
      "Unit Name",
      "City",
      "Address",
      "Vehicle Number",
      "Document Type",
      "Document Number",
      "Check In",
      "Check Out",
      "Card No.",
    ];

    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(","));

    // Add data rows
    rows.forEach((v) => {
      const row = [
        `"${toTitleCase(v.name || "")}"`,
        `"${v.email || ""}"`,
        `"${v.visitor_contact || ""}"`,
        `"${toTitleCase(v.status || "")}"`,
        `"${toTitleCase(v.purpose || "")}"`,
        `"${toTitleCase(v.whome_to_meet || "")}"`,
        `"${toTitleCase(v.Visitor_category || "")}"`,
        `"${toTitleCase(v.designation || "")}"`,
        `"${toTitleCase(v.unit_name || "")}"`,
        `"${toTitleCase(v.city || "")}"`,
        `"${v.visitor_address || ""}"`,
        `"${v.vehicle_number || ""}"`,
        `"${toTitleCase(v.document_type || "")}"`,
        `"${v.document_number || ""}"`,
        `"${formatDate(v.in_time, true, " ")}"`,
        `"${formatDate(v.out_time, true, " ")}"`,
        `"${v.rfid_num || "--"}"`,
      ];

      csvRows.push(row.join(","));
    });

    const csvData = csvRows.join("\n");

    // ✅ Excel-friendly BOM
    const BOM = "\uFEFF";

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=visitor_report_${Date.now()}.csv`,
    );

    return res.send(BOM + csvData);
  } catch (error) {
    console.error("CSV Generation Error:", error);
    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
}

// async function generateVisitorReportCSV(req, res) {
//   const tenantId = req.user.tenant_id;
//   const { startDate, endDate } = req.body;

//   if (!startDate || !endDate) {
//     return res.status(400).json({
//       message: "Start date and end date are required",
//     });
//   }

//   try {
//     const tableName = `visitors_${tenantId}`;

//     const query = `
//       SELECT *
//       FROM ${tableName}
//       WHERE in_time BETWEEN ? AND ?
//       ORDER BY in_time DESC
//     `;

//     const [rows] = await pool.execute(query, [startDate, endDate]);

//     // CSV Headers
//     const headers = [
//       "Name",
//       "Contact No.",
//       "Status",
//       "Whom to Meet",
//       "Document Type",
//       "Check In",
//       "Check Out",
//       "Card No.",
//     ];

//     // Convert rows to CSV format
//     const csvRows = [];

//     // Add header row
//     csvRows.push(headers.join(","));

//     // Add data rows
//     rows.forEach((v) => {
//       const row = [
//         `"${toTitleCase(v.name) || ""}"`,
//         `"${v.visitor_contact || ""}"`,
//         `"${toTitleCase(v.status) || ""}"`,
//         `"${toTitleCase(v.whome_to_meet) || ""}"`,
//         `"${toTitleCase(v.document_type) || ""}"`,
//         `"${formatDate(v.in_time, true, " ")}"`,
//         `"${formatDate(v.out_time, true, " ")}"`,
//         `"${v.rfid_num || "--"}"`,
//       ];

//       csvRows.push(row.join(","));
//     });

//     const csvData = csvRows.join("\n");

//     // Set headers for download
//     res.setHeader("Content-Type", "text/csv");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=visitor_report_${Date.now()}.csv`,
//     );

//     return res.send(csvData);
//   } catch (error) {
//     console.error("CSV Generation Error:", error);
//     return res.status(500).json({
//       message: error.message || "Internal Server Error",
//     });
//   }
// }

module.exports = {
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
  getPDFDir,
  generateVisitorReportPDF,
  generateVisitorReportCSV,
};
