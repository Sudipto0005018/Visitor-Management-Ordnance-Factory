const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const ejs = require("ejs");

const userEmail = process.env.USER_EMAIL;
const appPassword = process.env.APP_PASSWORD;
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: userEmail,
        pass: appPassword,
    },
});
async function sendOTPEmail(to, otp) {
    if (!to || !otp) {
        throw new Error("Recipient email and OTP are required");
    }
    const subject = "Your OTP for  Email Verification";
    const templatePath = path.join(__dirname, "../template/otp_template.ejs");
    const template = fs.readFileSync(templatePath, "utf-8");
    const html = ejs.render(template, { otp });

    const mailOptions = {
        from: userEmail,
        to: to,
        subject: subject,
        html: html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
    } catch (error) {
        console.error("Error sending email: ", error);
    }
}

async function sendAppointmentApproveEmail(to, date, time, name, refNumber) {
    if (!to || !name || !refNumber || !date || !time) {
        throw new Error("Recipient email, name, refNumber, date, and time are required");
    }
    const subject = "Appointment Approved";
    const templatePath = path.join(__dirname, "../template/appointment_approve.ejs");
    const template = fs.readFileSync(templatePath, "utf-8");
    const html = ejs.render(template, { name, refNumber, date, time });
    const mailOptions = {
        from: userEmail,
        to: to,
        subject: subject,
        html: html,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: " + info.response);
    } catch (error) {
        console.error("Error sending email: ", error);
    }
}

module.exports = { sendOTPEmail, sendAppointmentApproveEmail };
