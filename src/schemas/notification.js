const notificationSchema = {
  populate: [
    {
      path: "senderId receiverId"
    }
  ]
};

module.exports = notificationSchema;
