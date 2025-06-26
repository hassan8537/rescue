const orderSchema = {
  populate: [
    {
      path: "customerId products"
    }
  ]
};

module.exports = orderSchema;
