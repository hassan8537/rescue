const reviewSchema = {
  populate: [
    {
      path: "senderId receiverId"
    }
  ]
};

module.exports = reviewSchema;
