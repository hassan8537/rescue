const Notification = require("../models/Notification");
const notificationSchema = require("../schemas/notification");
const handlers = require("../utilities/handlers");
const pagination = require("../utilities/pagination");

class Service {
  constructor() {
    this.notification = Notification;
  }

  async toggleNotifications(req, res) {
    try {
      const user = req.user;

      user.isNotificationEnabled = !user.isNotificationEnabled;
      await user.save();

      console.log(user.isNotificationEnabled);

      return handlers.response.success({
        res,
        message: "Success",
        data: { isNotificationEnabled: user.isNotificationEnabled }
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async getNotifications(req, res) {
    try {
      const user = req.user;
      const { page, limit, status } = req.query;

      const filters = { receiverId: user._id };

      if (status) filters.status = status;

      return await pagination({
        res,
        table: "Notifications",
        model: this.notification,
        filters: filters,
        page: page,
        limit: limit,
        populate: notificationSchema.populate
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
