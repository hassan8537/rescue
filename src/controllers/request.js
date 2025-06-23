class Controller {
  constructor() {
    this.service = require("../services/request");
  }

  async sendBudgetRequest(req, res) {
    await this.service.sendBudgetRequest(req, res);
  }

  async sendProductRequest(req, res) {
    await this.service.sendProductRequest(req, res);
  }

  async getBudgetRequests(req, res) {
    await this.service.getBudgetRequests(req, res);
  }

  async getProductRequests(req, res) {
    await this.service.getProductRequests(req, res);
  }

  async approveBudgetRequest(req, res) {
    await this.service.approveBudgetRequest(req, res);
  }

  async rejectBudgetRequest(req, res) {
    await this.service.rejectBudgetRequest(req, res);
  }
}

module.exports = new Controller();
