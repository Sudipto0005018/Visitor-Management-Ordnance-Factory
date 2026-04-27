const pool = require("./dbConnect");

const createUserTable = async (tenantId) => {
    const tableName = `users_${tenantId}`;
    const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id int NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            user_name VARCHAR(255) NOT NULL,
            mobile VARCHAR(16) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            tenant_id VARCHAR(50) NOT NULL,
            PRIMARY KEY (id)
        );
    `;

    try {
        await pool.query(query);
    } catch (error) {
        console.error(`Error creating table ${tableName}`);
    }
};

const createTenantTable = async () => {
    const tableName = `tenants`;
    const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id int NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            tenant_id VARCHAR(50) NOT NULL UNIQUE,
            starting_date DATETIME NOT NULL,
            expary_date DATETIME NOT NULL,
            pass_expiry_time INT DEFAULT 3, ${/* in hours */ ""}
            storage_limit DECIMAL(14, 5) DEFAULT 102400, ${/* in KB */ ""}
            storage_used DECIMAL(14, 5) DEFAULT 0, ${/* in KB */ ""}
            PRIMARY KEY (id)
        );
    `;

    try {
        await pool.query(query);
    } catch (error) {
        console.error(`Error creating table ${tableName}`);
    }
};

const createVisitorTable = async (tenantId) => {
    const tableName = `visitors_${tenantId}`;
    const userTable = `users_${tenantId}`;

    const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id int NOT NULL AUTO_INCREMENT,
            ref_number VARCHAR(16) NOT NULL UNIQUE,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(64) DEFAULT NULL,
            visitor_contact VARCHAR(16) NOT NULL,
            visitor_address VARCHAR(255) NOT NULL,
            visitor_image VARCHAR(255) NOT NULL,
            whome_to_meet VARCHAR(255) NOT NULL,
            document_type VARCHAR(50) DEFAULT NULL,
            document_number VARCHAR(50) DEFAULT NULL,
            document_image VARCHAR(255) DEFAULT NULL,
            purpose VARCHAR(255) NOT NULL,
            vehicle_number VARCHAR(50) DEFAULT NULL,
            in_time DATETIME NOT NULL,
            out_time DATETIME DEFAULT NULL,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            approved_by INT DEFAULT NULL,
            gate_pass_issued BOOLEAN DEFAULT FALSE,
            gate_pass_time DATETIME DEFAULT NULL, 
            required_registration BOOLEAN DEFAULT FALSE,
            comment TEXT DEFAULT NULL,
            created_by int NOT NULL,
            checkout_updated_by INT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            Visitor_category VARCHAR(50) NOT NULL,
            user_name VARCHAR(50) NOT NULL,
            qr_issued BOOLEAN DEFAULT FALSE,
            registation_type ENUM('online', 'offline') DEFAULT 'offline',
            mobile_verified BOOLEAN DEFAULT FALSE,
            email_verified BOOLEAN DEFAULT FALSE,
            rfid_num VARCHAR(32) DEFAULT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY (created_by) REFERENCES ${userTable}(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (approved_by) REFERENCES ${userTable}(id) ON DELETE SET NULL ON UPDATE CASCADE,
            FOREIGN KEY (checkout_updated_by) REFERENCES ${userTable}(id) ON DELETE SET NULL ON UPDATE CASCADE
        );
    `;
    try {
        await pool.query(query);
    } catch (error) {
        console.error(`Error creating table ${tableName}`);
    }
};

const createConfigTable = async (tenantId) => {
    const tableName = `config_${tenantId}`;
    const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id int NOT NULL AUTO_INCREMENT,
            key_name VARCHAR(255) NOT NULL UNIQUE,
            value TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        );
    `;
    try {
        await pool.query(query);
    } catch (error) {
        console.error(`Error creating table ${tableName}`);
    }
};

const createAppointmentTable = async (tenantId) => {
    const tableName = `appointments_${tenantId}`;
    const userTable = `users_${tenantId}`;
    const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id int NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            ref_number VARCHAR(16) NOT NULL UNIQUE,
            email VARCHAR(64) NOT NULL,
            visitor_contact VARCHAR(16) NOT NULL,
            visitor_address VARCHAR(255) NOT NULL,
            visitor_image VARCHAR(255) DEFAULT NULL,
            whome_to_meet VARCHAR(255) NOT NULL,
            purpose VARCHAR(255) NOT NULL,
            appoint_time DATETIME NULL,
            Visitor_category VARCHAR(50) DEFAULT NULL,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            approved_by INT DEFAULT NULL,
            approved_at DATETIME DEFAULT NULL,
            comment TEXT DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (approved_by)
            REFERENCES ${userTable}(id) ON DELETE SET NULL ON UPDATE CASCADE
        );
    `;
    try {
        await pool.query(query);
    } catch (error) {
        console.error(`Error creating table ${tableName}`);
    }
};

const createEmployeeTable = async (tenantId) => {
    const tableName = `employees_${tenantId}`;
    const userTable = `users_${tenantId}`;
    const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id int NOT NULL AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            employee_id VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(64) DEFAULT NULL,
            contact VARCHAR(16) NOT NULL,
            address VARCHAR(255) NOT NULL,
            image VARCHAR(255) DEFAULT NULL,
            department VARCHAR(100) DEFAULT NULL,
            designation VARCHAR(100) DEFAULT NULL,
            created_by int NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (created_by) REFERENCES ${userTable}(id) ON DELETE CASCADE ON UPDATE CASCADE
        );
    `;
    try {
        await pool.query(query);
    } catch (error) {
        console.error(`Error creating table ${tableName}`);
    }
};

const createMovementTable = async (tenantId) => {
    const tableName = `movements_${tenantId}`;
    const query = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            id int NOT NULL AUTO_INCREMENT,
            visitor_id INT NOT NULL,
            gate_details TEXT NOT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY (visitor_id) REFERENCES visitors_${tenantId}(id) ON DELETE CASCADE ON UPDATE CASCADE
        );
    `;
    try {
        await pool.query(query);
        console.log(`Table ${tableName} created successfully.`);
    } catch (error) {
        console.error(`Error creating table ${tableName}`);
    }
};

module.exports = {
    createUserTable,
    createTenantTable,
    createVisitorTable,
    createConfigTable,
    createAppointmentTable,
    createEmployeeTable,
    createMovementTable,
};
