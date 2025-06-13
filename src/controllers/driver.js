class Controller {
  constructor() {
    this.service = require("../services/driver");
  }

  async createDriver(req, res) {
    await this.service.createDriver(req, res);
  }

  async updateDriver(req, res) {
    await this.service.updateDriver(req, res);
  }

  async getDrivers(req, res) {
    await this.service.getDrivers(req, res);
  }

  async deleteDriver(req, res) {
    await this.service.deleteDriver(req, res);
  }

  async allocateBudget(req, res) {
    await this.service.allocateBudget(req, res);
  }
}

module.exports = new Controller();
