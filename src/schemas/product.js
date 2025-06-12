const productSchema = {
  populate: [
    {
      path: "userId"
    }
  ]
};

module.exports = productSchema;
