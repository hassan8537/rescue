const Content = require("../models/Content");
const handlers = require("../utilities/handlers");

class Service {
  constructor() {
    this.content = Content;
  }

  async getContents(req, res) {
    try {
      const contents = await this.content.find();

      if (!contents.length)
        return handlers.response.success({
          res,
          message: "No contents yet"
        });

      return handlers.response.success({
        res,
        message: "Success",
        data: contents
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async createContent(req, res) {
    try {
      const { type, url, description } = req.body;

      const content = await this.content.findOne({ type });

      if (content)
        return handlers.response.failed({
          res,
          message: "Content already exists"
        });

      const newContent = await this.content.create({
        type,
        url,
        description
      });

      return handlers.response.success({
        res,
        message: "Success",
        data: newContent
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async updateContent(req, res) {
    try {
      const { contentId } = req.params;
      const { url, description } = req.body;

      const content = await this.content.findById(contentId);

      if (!content) {
        return handlers.response.failed({
          res,
          message: "Invalid content ID"
        });
      }

      content.url = url || content.url;
      content.description = description || content.description;

      await content.save();

      return handlers.response.success({
        res,
        message: "Content updated successfully",
        data: content
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error
      });
    }
  }

  async deleteContent(req, res) {
    try {
      const { contentId } = req.params;

      const content = await this.content.findByIdAndDelete(contentId);

      if (!content) {
        return handlers.response.failed({
          res,
          message: "Invalid content ID"
        });
      }

      return handlers.response.success({
        res,
        message: "Content deleted successfully"
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
