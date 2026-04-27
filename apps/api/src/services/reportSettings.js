let isReportEnabled = false;

const getReportStatus = () => isReportEnabled;

const setReportStatus = (value) => {
  isReportEnabled = Boolean(value);
  return isReportEnabled;
};

module.exports = {
  getReportStatus,
  setReportStatus,
};
