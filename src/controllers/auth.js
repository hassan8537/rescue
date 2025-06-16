class Controller {
  constructor() {
    this.service = require("../services/auth");
  }

  async signUp(req, res) {
    await this.service.signUp(req, res);
  }

  async signIn(req, res) {
    await this.service.signIn(req, res);
  }

  async forgotPassword(req, res) {
    await this.service.forgotPassword(req, res);
  }

  async resetPassword(req, res) {
    await this.service.resetPassword(req, res);
  }
}

module.exports = new Controller();
