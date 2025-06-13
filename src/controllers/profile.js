class Controller {
  constructor() {
    this.service = require("../services/profile");
  }

  async getMyProfile(req, res) {
    await this.service.getMyProfile(req, res);
  }

  async setUpMyProfile(req, res) {
    await this.service.setUpMyProfile(req, res);
  }

  async editMyProfile(req, res) {
    await this.service.editMyProfile(req, res);
  }

  async deactivateAccount(req, res) {
    await this.service.deactivateAccount(req, res);
  }

  async activateAccount(req, res) {
    await this.service.activateAccount(req, res);
  }

  async changePassword(req, res) {
    await this.service.changePassword(req, res);
  }

  async getAdmin(req, res) {
    await this.service.getAdmin(req, res);
  }
}

module.exports = new Controller();
