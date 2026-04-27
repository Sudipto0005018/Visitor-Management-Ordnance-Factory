const jwt = require("jsonwebtoken");
const db = require("../utils/dbConnect");
const ApiErrorResponce = require("../utils/ApiErrorResponce");

const authMiddleware = async (req, res, next) => {
    let token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return res
            .status(400)
            .json(
                new ApiErrorResponce(400, {}, "Not authorized or token expires, Please login again")
            );
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const tenantId = decoded.tenantId;
        if (!tenantId) {
            return res
                .status(400)
                .json(new ApiErrorResponce(400, {}, "Invalid token, Please login again"));
        }
        const [rows] = await db.query("SELECT * FROM users_" + tenantId + " WHERE mobile = ?", [
            decoded.mobile,
        ]);
        if (rows.length > 0) {
            const user = { ...rows[0] };
            delete user.password;
            req.user = user;
            const [tenants] = await db.query("SELECT * FROM tenants WHERE tenant_id = ?", [
                user.tenant_id,
            ]);
            if (tenants.length === 0) {
                return res
                    .status(404)
                    .json(new ApiErrorResponce(404, {}, "Tenant not found, Please login again"));
            }
            req.tenant = tenants[0];
            next();
        } else {
            return res
                .status(401)
                .json(new ApiErrorResponce(401, undefined, "User not found, Please login again"));
        }
    } catch (error) {
        return res
            .status(401)
            .json(new ApiErrorResponce(401, {}, "Invalid token, Please login again"));
    }
};

const isSuperUser = async (req, res, next) => {
    if (!req.user) {
        return res
            .status(401)
            .json(new ApiErrorResponce(401, {}, "Not authorized, Please login again"));
    }
    const { role } = req.user;
    if (role?.toLowerCase() !== "superuser") {
        return res.status(403).json(new ApiErrorResponce(403, {}, "Access denied, Superuser only"));
    }
    next();
};
const isAdmin = async (req, res, next) => {
    if (!req.user) {
        return res
            .status(401)
            .json(new ApiErrorResponce(401, {}, "Not authorized, Please login again"));
    }
    const { role } = req.user;
    if (role?.toLowerCase() !== "admin" && role?.toLowerCase() !== "superuser") {
        return res.status(403).json(new ApiErrorResponce(403, {}, "Access denied, Admin only"));
    }
    next();
};
const isApprover = async (req, res, next) => {
    if (!req.user) {
        return res
            .status(401)
            .json(new ApiErrorResponce(401, {}, "Not authorized, Please login again"));
    }
    const { role } = req.user;
    if (
        role?.toLowerCase() !== "approver" &&
        role?.toLowerCase() !== "admin" &&
        role?.toLowerCase() !== "superuser"
    ) {
        return res.status(403).json(new ApiErrorResponce(403, {}, "Access denied, Approver only"));
    }
    next();
};

const isUser = async (req, res, next) => {
    if (!req.user) {
        return res
            .status(401)
            .json(new ApiErrorResponce(401, {}, "Not authorized, Please login again"));
    }
    const { role } = req.user;
    if (
        role?.toLowerCase() !== "user" &&
        role?.toLowerCase() !== "admin" &&
        role?.toLowerCase() !== "superuser" &&
        role?.toLowerCase() !== "approver"
    ) {
        return res.status(403).json(new ApiErrorResponce(403, {}, "Access denied, Visitor only"));
    }
    next();
};

module.exports = {
    authMiddleware,
    isSuperUser,
    isAdmin,
    isApprover,
    isUser,
};
