class Controller {
  constructor() {
    this.service = require("../services/chat");
  }

  async getInbox(req, res) {
    await this.service.getInbox(req, res);
  }

  async newChat(data) {
    await this.service.newChat(data);
  }

  async getChats(data) {
    await this.service.getChats(data);
  }
}

module.exports = new Controller();
