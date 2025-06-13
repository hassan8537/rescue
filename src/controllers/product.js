class Controller {
  constructor() {
    this.service = require("../services/product");
  }

  async createProduct(req, res) {
    await this.service.addProduct(req, res);
  }

  async updateProduct(req, res) {
    await this.service.editProduct(req, res);
  }

  async getProducts(req, res) {
    await this.service.getProducts(req, res);
  }

  async getProductById(req, res) {
    await this.service.getProductById(req, res);
  }

  async deleteProduct(req, res) {
    await this.service.deleteProduct(req, res);
  }

  async deactivateProduct(req, res) {
    await this.service.deactivateProduct(req, res);
  }

  async activateProduct(req, res) {
    await this.service.activateProduct(req, res);
  }
}

module.exports = new Controller();
