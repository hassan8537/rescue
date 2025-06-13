class Controller {
  constructor() {
    this.service = require("../services/upload");
  }

  async uploadFile(req, res) {
    await this.service.uploadFile(req, res);
  }
}

module.exports = new Controller();
