class Controller {
  constructor() {
    this.service = require("../services/notification");
  }

  async toggleNotifications(req, res) {
    await this.service.toggleNotifications(req, res);
  }
}

module.exports = new Controller();
