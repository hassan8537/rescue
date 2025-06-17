class Controller {
  constructor() {
    this.service = require("../services/job");
  }

  async getJobs(req, res) {
    return await this.service.getJobs(req, res);
  }

  async getJobById(req, res) {
    return await this.service.getJobById(req, res);
  }
}

module.exports = new Controller();
