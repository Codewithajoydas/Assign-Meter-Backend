const isValidMeterNumber = (val) => {
  return /^[0-9]{7}$/.test(val);
};


module.exports = isValidMeterNumber;