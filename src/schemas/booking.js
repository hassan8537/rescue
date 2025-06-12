const bookingSchema = {
  populate: [
    {
      path: "userId"
    }
  ]
};

module.exports = bookingSchema;
