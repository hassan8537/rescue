class Controller {
  constructor() {
    this.service = require("../services/content");
  }

  async getContents(req, res) {
    await this.service.getContents(req, res);
  }

  async createContent(req, res) {
    await this.service.createContent(req, res);
  }

  async updateContent(req, res) {
    await this.service.updateContent(req, res);
  }

  async deleteContent(req, res) {
    await this.service.deleteContent(req, res);
  }
}

module.exports = new Controller();
