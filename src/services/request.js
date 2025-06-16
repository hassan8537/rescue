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

      if (user.role !== "fleet-manager")
        return handlers.response.failed({
          res,
          message: "Only fleet managers can view budget requests"
        });

      const filters = { receiverId: user._id, type: "budget" };

      return await pagination({
        res,
        table: "Requests",
        model: this.request,
        filters: filters,
        page: page,
        limit: limit,
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

      const receiver = await this.user.findById(request.receiverId);

      if (!receiver)
        return handlers.response.failed({
          res,
          message: "You cannot approve budget request of this driver"
        });

      receiver.driverBudget += Number(request.amount);
      await receiver.save();

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
}

module.exports = new Service();
