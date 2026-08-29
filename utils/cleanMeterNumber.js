const cleanMeterNumber = (val) => {
  if (!val) return null;
  return String(val)
    .replace(/[\r\n\t]/g, "")
    .replace(/\s+/g, "")
    .trim();
};

module.exports = cleanMeterNumber;