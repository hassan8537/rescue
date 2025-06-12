class Controller {
  constructor() {
    this.service = require("../services/profile");
  }

  async getMyProfile(req, res) {
    await this.service.getMyProfile(req, res);
  }

  async editMyProfile(req, res) {
    await this.service.editMyProfile(req, res);
  }
}

module.exports = new Controller();
