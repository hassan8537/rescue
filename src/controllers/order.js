class Controller {
  constructor() {
    this.service = require("../services/order");
  }

  async getOrders(req, res) {
    await this.service.getOrders(req, res);
  }

  async getOrderById(req, res) {
    await this.service.getOrderById(req, res);
  }
}

module.exports = new Controller();
