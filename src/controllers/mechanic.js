class Controller {
  constructor() {
    this.service = require("../services/mechanic");
  }

  async getMechanicStatistics(req, res) {
    await this.service.getMechanicStatistics(req, res);
  }

  async createMechanic(req, res) {
    await this.service.createMechanic(req, res);
  }

  async updateMechanic(req, res) {
    await this.service.updateMechanic(req, res);
  }

  async getMechanics(req, res) {
    await this.service.getMechanics(req, res);
  }

  async getMechanicById(req, res) {
    await this.service.getMechanicById(req, res);
  }

  async deleteMechanic(req, res) {
    await this.service.deleteMechanic(req, res);
  }

  async allocateHourlyRates(req, res) {
    await this.service.allocateHourlyRates(req, res);
  }
}

module.exports = new Controller();
