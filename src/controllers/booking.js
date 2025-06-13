class Controller {
  constructor() {
    this.service = require("../services/booking");
  }

  async createBooking(req, res) {
    await this.service.createBooking(req, res);
  }

  async getBookings(req, res) {
    await this.service.getBookings(req, res);
  }

  async getBookingById(req, res) {
    await this.service.getBookingById(req, res);
  }

  async cancelBooking(req, res) {
    await this.service.cancelBooking(req, res);
  }
}

module.exports = new Controller();
