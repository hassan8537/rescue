class Controller {
  constructor() {
    this.service = require("../services/chat");
  }

  async getInbox(data) {
    return await this.service.getInbox(data);
  }

  async newChat(data) {
    return await this.service.newChat(data);
  }

  async getChats(data) {
    return await this.service.getChats(data);
  }
}

module.exports = new Controller();
