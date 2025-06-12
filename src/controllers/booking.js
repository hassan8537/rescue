class Controller {
  constructor() {
    this.service = require("../services/booking");
  }

  async createEmergencyServiceBooking(req, res) {
    await this.service.createEmergencyServiceBooking(req, res);
  }
}

module.exports = new Controller();
