class Controller {
  constructor() {
    this.service = require("../services/review");
  }

  async createReview(req, res) {
    await this.service.createReview(req, res);
  }

  async getReviews(req, res) {
    await this.service.getReviews(req, res);
  }
}

module.exports = new Controller();
