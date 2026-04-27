const cron = require("node-cron");
const { sendReportEmail, isEmailConfigured } = require("../services/emailService");
const { generateDailyReport } = require("../services/reportService");
const { getReportStatus } = require("../services/reportSettings");

let reportJob = null;

const runDailyReport = async () => {
  console.log("[daily-report] Execution du rapport automatique...");

  if (!getReportStatus()) {
    console.log("[daily-report] Envoi ignore: option desactivee.");
    return;
  }

  if (!isEmailConfigured()) {
    console.error(
      "[daily-report] Configuration email absente. Renseignez EMAIL_USER et EMAIL_PASS."
    );
    return;
  }

  try {
    const htmlContent = await generateDailyReport();
    await sendReportEmail(htmlContent);
    console.log("[daily-report] Email envoye avec succes.");
  } catch (error) {
    console.error("[daily-report] Echec de l'envoi:", error.message);
  }
};

const startDailyReportJob = () => {
  if (reportJob) {
    return reportJob;
  }

  const schedule = process.env.REPORT_CRON_SCHEDULE || "0 20 * * *";
  reportJob = cron.schedule(schedule, runDailyReport, {
    scheduled: true,
  });

  console.log(`[daily-report] Cron demarre avec la planification "${schedule}".`);
  return reportJob;
};

module.exports = {
  startDailyReportJob,
  runDailyReport,
};
