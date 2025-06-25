class AdminController {
  constructor() {
    this.service = require("../services/admin");
  }

  async signIn(req, res) {
    await this.service.signIn(req, res);
  }

  async getUsers(req, res) {
    await this.service.getUsers(req, res);
  }

  async getAccounts(req, res) {
    await this.service.getAccounts(req, res);
  }

  async getBookings(req, res) {
    await this.service.getBookings(req, res);
  }

  async getChats(req, res) {
    await this.service.getChats(req, res);
  }

  async getContents(req, res) {
    await this.service.getContents(req, res);
  }

  async getOtps(req, res) {
    await this.service.getOtps(req, res);
  }

  async getNotifications(req, res) {
    await this.service.getNotifications(req, res);
  }

  async getProducts(req, res) {
    await this.service.getProducts(req, res);
  }

  async getQuotes(req, res) {
    await this.service.getQuotes(req, res);
  }

  async getRequests(req, res) {
    await this.service.getRequests(req, res);
  }

  async getReviews(req, res) {
    await this.service.getReviews(req, res);
  }
}

module.exports = new AdminController();
