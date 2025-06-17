const Notification = require("../models/Notification");
const Request = require("../models/Request");
const User = require("../models/User");
const requestSchema = require("../schemas/request");
const handlers = require("../utilities/handlers");
const pagination = require("../utilities/pagination");

class Service {
  constructor() {
    this.user = User;
    this.request = Request;
    this.notification = Notification;
  }

  async sendBudgetRequest(req, res) {
    try {
      const user = req.user;

      const { firstName, lastName } = user;

      const { reason, amount } = req.body;

      if (user.role !== "driver")
        return handlers.response.failed({
          res,
          message: "Only drivers can send budget request"
        });

      if (!user.fleetManagerId)
        return handlers.response.failed({
          res,
          message: "You do not belong to any fleet"
        });

      const pendingBudgetRequest = await this.request.findOne({
        senderId: user._id,
        receiverId: user.fleetManagerId,
        type: "budget",
        status: "pending"
      });

      if (pendingBudgetRequest)
        return handlers.response.failed({
          res,
          message: "A budget request is already pending"
        });

      const newBudgetRequest = await this.request.create({
        senderId: user._id,
        receiverId: user.fleetManagerId,
        type: "budget",
        reason: reason,
        amount: amount
      });

      await this.notification.create({
        senderId: user._id,
        receiverId: user.fleetManagerId,
        message: `${firstName} ${lastName} has requested a budget`,
        type: "Request",
        modelId: newBudgetRequest._id
      });

      return handlers.response.success({
        res,
        message: "Success",
        data: newBudgetRequest
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async getBudgetRequests(req, res) {
    try {
      const user = req.user;
      const { page, limit } = req.query;

      const filters = { type: "budget" };

      if (user.role === "fleet-manager") {
        filters.receiverId = user._id;
      } else if (user.role === "driver") {
        filters.senderId = user._id;
      } else {
        return handlers.response.failed({
          res,
          message: `Only ${user.role}s can view budget requests`
        });
      }

      return await pagination({
        res,
        table: "Budget requests",
        model: this.request,
        filters: filters,
        page,
        limit,
        populate: requestSchema.populate
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async approveBudgetRequest(req, res) {
    try {
      const user = req.user;

      const { requestId } = req.params;

      const request = await this.request.findById(requestId);

      if (!request)
        return handlers.response.failed({ res, message: "Invalid request ID" });

      if (user.role !== "fleet-manager")
        return handlers.response.failed({
          res,
          message: "Only fleet managers can approve budget request"
        });

      if (request.receiverId.toString() !== user._id.toString())
        return handlers.response.failed({
          res,
          message: "You cannot approve this budget request"
        });

      if (request.status === "approved") {
        return handlers.response.failed({
          res,
          message: "Budget request already approved"
        });
      }

      if (request.status === "rejected") {
        return handlers.response.failed({
          res,
          message: "Budget request already rejected"
        });
      }

      const driver = await this.user.findById(request.senderId);

      if (!driver)
        return handlers.response.failed({
          res,
          message: "You cannot approve budget request of this driver"
        });

      driver.budget += Number(request.amount);
      await driver.save();

      request.status = "approved";
      await request.save();

      return handlers.response.success({
        res,
        message: "Success"
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async rejectBudgetRequest(req, res) {
    try {
      const user = req.user;

      const { requestId } = req.params;

      const request = await this.request.findById(requestId);

      if (!request)
        return handlers.response.failed({ res, message: "Invalid request ID" });

      if (user.role !== "fleet-manager")
        return handlers.response.failed({
          res,
          message: "Only fleet managers can reject budget request"
        });

      if (request.receiverId.toString() !== user._id.toString())
        return handlers.response.failed({
          res,
          message: "You cannot reject this budget request"
        });

      if (request.status === "approved") {
        return handlers.response.failed({
          res,
          message: "Budget request already approved"
        });
      }

      if (request.status === "rejected") {
        return handlers.response.failed({
          res,
          message: "Budget request already rejected"
        });
      }

      request.status = "rejected";
      await request.save();

      return handlers.response.success({
        res,
        message: "Success"
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async sendProductRequest(req, res) {
    try {
      const user = req.user;

      const { firstName, lastName } = user;

      const { productName, quantityNeeded, justification } = req.body;

      if (user.role !== "mechanic")
        return handlers.response.failed({
          res,
          message: "Only mechanics can send product request"
        });

      if (!user.shopOwnerId)
        return handlers.response.failed({
          res,
          message: "You do not belong to any shop owner"
        });

      const pendingProductRequest = await this.request.findOne({
        senderId: user._id,
        receiverId: user.shopOwnerId,
        type: "product",
        status: "pending"
      });

      if (pendingProductRequest)
        return handlers.response.failed({
          res,
          message: "A product request is already pending"
        });

      const newProductRequest = await this.request.create({
        senderId: user._id,
        receiverId: user.shopOwnerId,
        type: "product",
        productName: productName,
        quantityNeeded: quantityNeeded,
        justification: justification
      });

      await this.notification.create({
        senderId: user._id,
        receiverId: user.shopOwnerId,
        message: `${firstName} ${lastName} has requested a product`,
        type: "Request",
        modelId: newProductRequest._id
      });

      return handlers.response.success({
        res,
        message: "Success",
        data: newProductRequest
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async getProductRequests(req, res) {
    try {
      const user = req.user;
      const { page, limit } = req.query;

      const filters = { type: "product" };

      if (user.role === "shop-owner") {
        filters.receiverId = user._id;
      } else if (user.role === "mechanic") {
        filters.senderId = user._id;
      } else {
        return handlers.response.failed({
          res,
          message: `Only ${user.role}s can view product requests`
        });
      }

      return await pagination({
        res,
        table: "Product requests",
        model: this.request,
        filters: filters,
        page,
        limit,
        populate: requestSchema.populate
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
