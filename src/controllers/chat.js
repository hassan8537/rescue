class Controller {
  constructor() {
    this.service = require("../services/chat");
  }

  async getInbox(req, res) {
    return await this.service.getInbox(req, res);
  }

  async newChat(data) {
    return await this.service.newChat(data);
  }

  async getChats(data) {
    return await this.service.getChats(data);
  }
}

module.exports = new Controller();
