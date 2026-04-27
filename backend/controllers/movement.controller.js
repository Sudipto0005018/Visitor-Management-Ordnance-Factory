const pool = require("../utils/dbConnect");
const ApiErrorResponce = require("../utils/ApiErrorResponce");
const ApiResponse = require("../utils/ApiResponse");

async function addMovement(req, res) {
    const { tenantId, cardNo, gate, passTime } = req.body;

    if (!cardNo || !gate || !tenantId) {
        return res
            .status(400)
            .json(new ApiErrorResponce(400, {}, "Card number, gate, and tenant ID are required."));
    }
    const card = cardNo.trim().toUpperCase();
    try {
        const [visitorRows] = await pool.query(
            `SELECT id FROM visitors_${tenantId} WHERE rfid_num = ? ORDER BY created_at DESC LIMIT 1`,
            [card]
        );
        if (visitorRows.length === 0) {
            return res
                .status(404)
                .json(
                    new ApiErrorResponce(404, {}, "Visitor not found for the provided card number.")
                );
        }
        const visitorId = visitorRows[0].id;
        const tableName = `movements_${tenantId}`;
        const [response] = await pool.query(`SELECT * FROM ${tableName} WHERE visitor_id = ?`, [
            visitorId,
        ]);
        let details = [];
        if (response.length > 0) {
            details = JSON.parse(response[0].gate_details);
        }
        details.push([gate, passTime]);
        let query, values;
        if (response.length > 0) {
            query = `
                UPDATE ${tableName} 
                SET gate_details = ? 
                WHERE visitor_id = ?;
            `;
            values = [JSON.stringify(details), visitorId];
        } else {
            query = `
                INSERT INTO ${tableName} (visitor_id, gate_details) 
                VALUES (?, ?);
            `;
            values = [visitorId, JSON.stringify(details)];
        }
        await pool.query(query, values);
        return res.status(201).json(new ApiResponse(201, {}, "Movement added successfully."));
    } catch (error) {
        console.error("Error adding movement:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}

const getMovements = async (req, res) => {
    const tenantId = req.user.tenant_id;
    const tableName = `movements_${tenantId}`;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.size) || 5;
    const offset = (page - 1) * pageSize;
    const userTable = `users_${tenantId}`;
    const { startDate, endDate, search } = req.body;
    if (!startDate || !endDate) {
        return res
            .status(400)
            .json(new ApiErrorResponce(400, {}, "Start date and end date are required."));
    }
    let query, values;
    if (search) {
        query = `
            SELECT
                v.*, 
                m.*,
                creator.name AS creator_name,
                creator.mobile AS creator_mobile,
                approver.name AS approver_name,
                approver.mobile AS approver_mobile
            FROM ${tableName} m
            JOIN visitors_${tenantId} v ON m.visitor_id = v.id
            LEFT JOIN ${userTable} creator ON v.created_by = creator.id
            LEFT JOIN ${userTable} approver ON v.approved_by = approver.id
            WHERE v.in_time BETWEEN ? AND ?
            AND (v.name LIKE ? OR v.visitor_contact LIKE ? OR v.ref_number LIKE ?)
            ORDER BY m.id DESC
            LIMIT ? OFFSET ?;
        `;
        values = [
            startDate,
            endDate,
            `%${search}%`,
            `%${search}%`,
            `%${search}%`,
            pageSize,
            offset,
        ];
    } else {
        query = `
            SELECT 
                v.*, 
                m.*,
                creator.name AS creator_name,
                creator.mobile AS creator_mobile,
                approver.name AS approver_name,
                approver.mobile AS approver_mobile
            FROM ${tableName} m
            JOIN visitors_${tenantId} v ON m.visitor_id = v.id
            LEFT JOIN ${userTable} creator ON v.created_by = creator.id
            LEFT JOIN ${userTable} approver ON v.approved_by = approver.id
            WHERE v.in_time BETWEEN ? AND ?
            ORDER BY m.id DESC
            LIMIT ? OFFSET ?;
        `;
        values = [startDate, endDate, pageSize, offset];
    }
    try {
        const [rows] = await pool.query(query, values);
        const [countRows] = await pool.query(
            `
            SELECT COUNT(*) AS total
            FROM ${tableName} m
            JOIN visitors_${tenantId} v ON m.visitor_id = v.id
            WHERE v.in_time BETWEEN ? AND ?
            ${
                search
                    ? "AND (v.name LIKE ? OR v.visitor_contact LIKE ? OR v.ref_number LIKE ?)"
                    : ""
            }
        `,
            search
                ? [startDate, endDate, `%${search}%`, `%${search}%`, `%${search}%`]
                : [startDate, endDate]
        );
        const totalItems = countRows[0].total;
        const totalPages = Math.ceil(totalItems / pageSize);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    movements: rows,
                    pageSize,
                    currentPage: page,
                    totalItems,
                    totalPages,
                },
                "Movements retrieved successfully"
            )
        );
    } catch (error) {
        console.error(error);
        return res
            .status(500)
            .json(new ApiErrorResponce(500, {}, error.message || "Internal server error"));
    }
};

module.exports = {
    addMovement,
    getMovements,
};
