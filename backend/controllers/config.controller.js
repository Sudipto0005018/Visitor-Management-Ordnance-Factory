const { createConfigTable } = require("../utils/tableChakings");
const ApiErrorResponce = require("../utils/ApiErrorResponce");
const ApiResponse = require("../utils/ApiResponse");
const pool = require("../utils/dbConnect");

const addConfig = async (req, res) => {
  const { key, value } = req.body;
  const tenantId = req.user.tenant_id;
  const tableName = `config_${tenantId}`;
  if (!key || !value) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Required fields are missing"));
  }
  try {
    await createConfigTable(tenantId);

    const query = `INSERT INTO ${tableName} (key_name, value) VALUES (?, ?)`;
    await pool.query(query, [key, value]);

    return res
      .status(201)
      .json(new ApiResponse(201, {}, "Configuration added successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
      );
  }
};

const getConfig = async (req, res) => {
  const userConfigs = ["document_types", "visitor_types"];
  const tenantId = req.user.tenant_id;
  const tableName = `config_${tenantId}`;
  try {
    const query = `SELECT * FROM ${tableName}`;
    const [rows] = await pool.query(query);
    const config = {};

    rows.forEach((row) => {
      if (userConfigs.includes(row.key_name)) {
        let val = row.value.split(";");
        if (val.length == 1) {
          val = val[0];
        }
        config[row.key_name] = val;
      }
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { config },
          "Configurations retrieved successfully",
        ),
      );
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
      );
  }
};

async function addDocType(req, res) {
  const { doc_type } = req.body;
  const tenantId = req.user.tenant_id;
  const tableName = `config_${tenantId}`;
  if (!doc_type) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Please provide a document type"));
  }
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT value FROM ${tableName} WHERE key_name = ?`,
      ["document_types"],
    );
    let r = rows[0].value;
    r += ";" + doc_type;
    connection.query(`UPDATE ${tableName} SET value = ? WHERE key_name = ?`, [
      r,
      "document_types",
    ]);
    connection.commit();
    return res
      .status(200)
      .json(new ApiResponse(200, { doc_type: r }, "Added Successfully"));
  } catch (error) {
    connection.rollback();
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
      );
  } finally {
    connection.release();
  }
}

async function addCategory(req, res) {
  const { Visitor_category } = req.body;
  const tenantId = req.user.tenant_id;
  const tableName = `config_${tenantId}`;
  if (!Visitor_category) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Please provide a document type"));
  }
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT value FROM ${tableName} WHERE key_name = ?`,
      ["visitor_types"],
    );
    let r = rows[0].value;
    r += ";" + Visitor_category;
    connection.query(`UPDATE ${tableName} SET value = ? WHERE key_name = ?`, [
      r,
      "visitor_types",
    ]);
    connection.commit();
    return res
      .status(200)
      .json(
        new ApiResponse(200, { Visitor_category: r }, "Added Successfully"),
      );
  } catch (error) {
    connection.rollback();
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
      );
  } finally {
    connection.release();
  }
}

async function deleteConfigValue(req, res) {
  const { key, value } = req.body; // key = document_types / visitor_types
  const tenantId = req.user.tenant_id;
  const tableName = `config_${tenantId}`;

  if (!key || !value) {
    return res
      .status(400)
      .json(new ApiErrorResponce(400, {}, "Key and value are required"));
  }

  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `SELECT value FROM ${tableName} WHERE key_name = ?`,
      [key],
    );

    if (!rows.length) {
      return res
        .status(404)
        .json(new ApiErrorResponce(404, {}, "Config not found"));
    }

    let valuesArray = rows[0].value.split(";");

    // remove selected value
    valuesArray = valuesArray.filter((item) => item !== value);

    const updatedValue = valuesArray.join(";");

    await connection.query(
      `UPDATE ${tableName} SET value = ? WHERE key_name = ?`,
      [updatedValue, key],
    );

    await connection.commit();

    return res
      .status(200)
      .json(new ApiResponse(200, { updatedValue }, "Deleted successfully"));
  } catch (error) {
    await connection.rollback();
    return res
      .status(500)
      .json(
        new ApiErrorResponce(500, {}, error.message || "Internal Server Error"),
      );
  } finally {
    connection.release();
  }
}

module.exports = {
  addConfig,
  getConfig,
  addDocType,
  addCategory,
  deleteConfigValue,
};
