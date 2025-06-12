const chatSchema = {
  populate: [
    {
      path: "senderId receiverId"
    }
  ]
};

module.exports = chatSchema;
