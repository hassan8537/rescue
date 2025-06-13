const bookingSchema = {
  populate: [
    {
      path: "driverId mechanicId"
    }
  ]
};

module.exports = bookingSchema;
