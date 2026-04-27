const nodemailer = require("nodemailer");

const isEmailConfigured = () =>
  Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const createTransporter = () => {
  if (!isEmailConfigured()) {
    throw new Error(
      "La configuration email est incomplete. Renseignez EMAIL_USER et EMAIL_PASS."
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendReportEmail = async (htmlContent) => {
  const transporter = createTransporter();

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: "Rapport journalier - Point de Vente Est",
    html: htmlContent,
  });
};

module.exports = {
  isEmailConfigured,
  sendReportEmail,
};
