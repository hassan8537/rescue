const handlers = require("../utilities/handlers");

class Service {
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
}

module.exports = new Service();
