const bookingSchema = {
  populate: [
    {
      path: "driverId mechanicId productsRequired"
    }
  ]
};

module.exports = bookingSchema;
