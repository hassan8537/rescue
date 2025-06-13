const quoteSchema = {
  populate: [
    {
      path: "bookingId mechanicId"
    }
  ]
};

module.exports = quoteSchema;
