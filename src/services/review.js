const Notification = require("../models/Notification");
const Review = require("../models/Review");
const User = require("../models/User");
const reviewSchema = require("../schemas/review");
const handlers = require("../utilities/handlers");

class Service {
  constructor() {
    this.user = User;
    this.review = Review;
    this.notification = Notification;
  }
  async createReview(req, res) {
    try {
      const user = req.user;

      const { receiverId, rating, review } = req.body;

      const receiver = await this.user.findById(receiverId);

      if (!receiver)
        return handlers.response.failed({
          res,
          message: "Invalid receiver ID"
        });

      const newReview = await this.review.create({
        senderId: user._id,
        receiverId: receiverId,
        rating: rating,
        review: review
      });

      await this.notification.create({
        senderId: user._id,
        receiverId: receiverId,
        message: `${firstName} ${lastName} has given you a review`,
        type: "Review",
        modelId: newReview._id
      });

      const allReviews = await this.review.find({ receiverId });
      const totalRatings = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRatings / allReviews.length;

      receiver.avgRating = parseFloat(avgRating.toFixed(1));
      await receiver.save();

      return handlers.response.success({
        res,
        message: "Success",
        data: newReview
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async getReviews(req, res) {
    try {
      const user = req.user;

      const { page, limit } = req.query;

      return await pagination({
        res,
        table: "Reviews",
        model: this.review,
        filters: { receiverId: user._id },
        page,
        limit,
        populate: reviewSchema.populate
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }
}

module.exports = new Service();
