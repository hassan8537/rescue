const Notification = require("../models/Notification");
const Review = require("../models/Review");
const User = require("../models/User");
const reviewSchema = require("../schemas/review");
const notificationSchema = require("../schemas/notification");
const handlers = require("../utilities/handlers");
const sendPushNotification = require("../utilities/send-push-notification");

class Service {
  constructor() {
    this.user = User;
    this.review = Review;
    this.notification = Notification;
  }

  async createReview(req, res) {
    try {
      const user = req.user;
      const { firstName, lastName, _id: userId } = user;
      const { receiverId, rating, review } = req.body;

      // Validate receiver
      const receiver = await this.user.findById(receiverId);
      if (!receiver) {
        return handlers.response.failed({
          res,
          message: "Invalid receiver ID"
        });
      }

      // Create review
      const newReview = await this.review.create({
        senderId: userId,
        receiverId: receiverId,
        rating: rating,
        review: review
      });

      // Create notification
      const newNotification = await this.notification.create({
        senderId: userId,
        receiverId: receiverId,
        message: `${firstName} ${lastName} has given you a review`,
        type: "Review",
        modelId: newReview._id
      });

      // Populate notification for push payload
      await newNotification.populate(notificationSchema.populate);
      const {
        senderId,
        receiverId: populatedReceiver,
        message,
        type,
        _id: modelId
      } = newNotification;

      // Send push notification if receiver has deviceToken
      if (populatedReceiver.deviceToken) {
        const notificationPayload = {
          deviceToken: populatedReceiver.deviceToken,
          title: "New Review Received",
          body: message,
          data: {
            senderImage: senderId.image?.toString() || "",
            senderName: `${senderId.firstName} ${senderId.lastName}`,
            receiverImage: populatedReceiver.image?.toString() || "",
            receiverName: `${populatedReceiver.firstName} ${populatedReceiver.lastName}`,
            modelId: modelId.toString(),
            type: type || "",
            message: message || ""
          }
        };

        await sendPushNotification(notificationPayload);
      }

      // Recalculate average rating
      const allReviews = await this.review.find({ receiverId });
      const totalRatings = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRatings / allReviews.length;

      receiver.avgRating = parseFloat(avgRating.toFixed(1));
      await receiver.save();

      // Success response
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
