const requestSchema = {
  populate: [
    {
      path: "senderId receiverId products"
    }
  ]
};

module.exports = requestSchema;
