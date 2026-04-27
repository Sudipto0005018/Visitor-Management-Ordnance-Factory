const pool = require("../utils/dbConnect");
const ApiErrorResponce = require("../utils/ApiErrorResponce");
const ApiResponse = require("../utils/ApiResponse");
const { createTenantTable } = require("../utils/tableChakings");

async function addTenant(req, res) {
    const { name, tenantId, starting_date, expary_date, storage_limit } = req.body;
    if (!name || !tenantId || !starting_date || !expary_date) {
        return res.status(400).json(new ApiErrorResponce(400, {}, "All fields are required"));
    }
    try {
        await createTenantTable();
        const query =
            "INSERT INTO tenants (name, tenant_id, starting_date, expary_date, storage_limit) VALUES (?, ?, ?, ?, ?)";
        const values = [name, tenantId, starting_date, expary_date, storage_limit || 100];
        const [insertResult] = await pool.query(query, values);
        const tenantIdInserted = insertResult.insertId;
        return res
            .status(201)
            .json(
                new ApiResponse(201, { tenantId: tenantIdInserted }, "Tenant added successfully")
            );
    } catch (error) {
        return res
            .status(500)
            .json(new ApiErrorResponce(500, {}, error.message || "Internal server error"));
    }
}

module.exports = {
    addTenant,
};
