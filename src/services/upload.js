const handlers = require("../utilities/handlers");

class Service {
  async uploadFile(req, res) {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        handlers.logger.failed({ message: "No files uploaded" });

        return handlers.response.failed({
          res,
          message: "No files uploaded"
        });
      }

      const uploaded = [];

      for (const fieldname in req.files) {
        req.files[fieldname].forEach((file) => {
          uploaded.push({
            path: file.path
          });
        });
      }

      return handlers.response.success({
        res,
        message: "Files uploaded successfully",
        data: uploaded
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error
      });
    }
  }
}

module.exports = new Service();
