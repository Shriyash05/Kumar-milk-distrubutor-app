const checkTimeLimit = (deliveryTime) => {
  const twoHoursBefore = new Date(deliveryTime).getTime() - 2 * 60 * 60 * 1000;
  return Date.now() < twoHoursBefore;
};

module.exports = checkTimeLimit;
