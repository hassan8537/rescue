class Controller {
  constructor() {
    this.service = require("../services/account");
  }

  async addAccount(req, res) {
    await this.service.addAccount(req, res);
  }

  async removeAccount(req, res) {
    await this.service.removeAccount(req, res);
  }

  async getAccounts(req, res) {
    await this.service.getAccounts(req, res);
  }

  async setDefaultAccount(req, res) {
    await this.service.setDefaultAccount(req, res);
  }
}

module.exports = new Controller();
