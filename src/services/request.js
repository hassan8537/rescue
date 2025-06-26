const Notification = require("../models/Notification");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Request = require("../models/Request");
const User = require("../models/User");
const notificationSchema = require("../schemas/notification");
const requestSchema = require("../schemas/request");
const handlers = require("../utilities/handlers");
const pagination = require("../utilities/pagination");
const sendPushNotification = require("../utilities/send-push-notification");

class Service {
  constructor() {
    this.user = User;
    this.request = Request;
    this.notification = Notification;
    this.order = Order;
    this.product = Product;
  }

  async sendBudgetRequest(req, res) {
    try {
      const user = req.user;
      const { firstName, lastName, role, fleetManagerId, _id: userId } = user;
      const { reason, amount } = req.body;

      // Only drivers can send budget requests
      if (role !== "driver") {
        return handlers.response.failed({
          res,
          message: "Only drivers can send budget request"
        });
      }

      // Driver must belong to a fleet
      if (!fleetManagerId) {
        return handlers.response.failed({
          res,
          message: "You do not belong to any fleet"
        });
      }

      // Check for existing pending budget request
      const pendingBudgetRequest = await this.request.findOne({
        senderId: userId,
        receiverId: fleetManagerId,
        type: "budget",
        status: "pending"
      });

      if (pendingBudgetRequest) {
        return handlers.response.failed({
          res,
          message: "A budget request is already pending"
        });
      }

      // Create new budget request
      const newBudgetRequest = await this.request.create({
        senderId: userId,
        receiverId: fleetManagerId,
        type: "budget",
        reason,
        amount
      });

      // Create new notification
      const newNotification = await this.notification.create({
        senderId: userId,
        receiverId: fleetManagerId,
        message: `${firstName} ${lastName} has requested a budget`,
        type: "Request",
        modelId: newBudgetRequest._id
      });

      // Populate necessary fields
      await newNotification.populate(notificationSchema.populate);
      const {
        senderId,
        receiverId,
        message,
        type,
        _id: modelId
      } = newNotification;

      // Send push notification if deviceToken exists
      if (receiverId.deviceToken) {
        const notificationPayload = {
          deviceToken: receiverId.deviceToken,
          title: "New notification",
          body: message,
          data: {
            senderImage: senderId.image?.toString() || "",
            senderName: `${senderId.firstName} ${senderId.lastName}`,
            receiverImage: receiverId.image?.toString() || "",
            receiverName: `${receiverId.firstName} ${receiverId.lastName}`,
            modelId: modelId.toString(),
            type: type || "",
            message: message || ""
          }
        };

        await sendPushNotification(notificationPayload);
      }

      // Respond with success
      return handlers.response.success({
        res,
        message: "Success",
        data: newBudgetRequest
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
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

      if (request.status === "approved")
        return handlers.response.failed({
          res,
          message: "Budget request already approved"
        });

      if (request.status === "rejected")
        return handlers.response.failed({
          res,
          message: "Budget request already rejected"
        });

      const driver = await this.user.findById(request.senderId);

      if (!driver)
        return handlers.response.failed({
          res,
          message: "You cannot approve budget request of this driver"
        });

      // Approve and update driver's budget
      driver.budget += Number(request.amount);
      await driver.save();

      request.status = "approved";
      await request.save();

      // Create notification
      const newNotification = await this.notification.create({
        senderId: user._id,
        receiverId: driver._id,
        message: `Your budget request has been approved by ${user.firstName} ${user.lastName}`,
        type: "Request",
        modelId: request._id
      });

      await newNotification.populate(notificationSchema.populate);
      const {
        senderId,
        receiverId,
        message,
        type,
        _id: modelId
      } = newNotification;

      if (receiverId.deviceToken) {
        const notificationPayload = {
          deviceToken: receiverId.deviceToken,
          title: "Budget Approved",
          body: message,
          data: {
            senderImage: senderId.image?.toString() || "",
            senderName: `${senderId.firstName} ${senderId.lastName}`,
            receiverImage: receiverId.image?.toString() || "",
            receiverName: `${receiverId.firstName} ${receiverId.lastName}`,
            modelId: modelId.toString(),
            type: type || "",
            message: message || ""
          }
        };

        await sendPushNotification(notificationPayload);
      }

      return handlers.response.success({ res, message: "Success" });
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

      if (request.status === "approved")
        return handlers.response.failed({
          res,
          message: "Budget request already approved"
        });

      if (request.status === "rejected")
        return handlers.response.failed({
          res,
          message: "Budget request already rejected"
        });

      request.status = "rejected";
      await request.save();

      const driver = await this.user.findById(request.senderId);

      if (driver) {
        const newNotification = await this.notification.create({
          senderId: user._id,
          receiverId: driver._id,
          message: `Your budget request has been rejected by ${user.firstName} ${user.lastName}`,
          type: "BudgetRejection",
          modelId: request._id
        });

        await newNotification.populate(notificationSchema.populate);
        const {
          senderId,
          receiverId,
          message,
          type,
          _id: modelId
        } = newNotification;

        if (receiverId.deviceToken) {
          const notificationPayload = {
            deviceToken: receiverId.deviceToken,
            title: "Budget Rejected",
            body: message,
            data: {
              senderImage: senderId.image?.toString() || "",
              senderName: `${senderId.firstName} ${senderId.lastName}`,
              receiverImage: receiverId.image?.toString() || "",
              receiverName: `${receiverId.firstName} ${receiverId.lastName}`,
              modelId: modelId.toString(),
              type: type || "",
              message: message || ""
            }
          };

          await sendPushNotification(notificationPayload);
        }
      }

      return handlers.response.success({ res, message: "Success" });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async sendProductRequest(req, res) {
    try {
      const user = req.user;
      const { firstName, lastName, role, shopOwnerId, _id: userId } = user;
      const { products, quantityNeeded, justification } = req.body;

      // Only mechanics can send product requests
      if (role !== "mechanic") {
        return handlers.response.failed({
          res,
          message: "Only mechanics can send product request"
        });
      }

      // Mechanic must belong to a shop owner
      if (!shopOwnerId) {
        return handlers.response.failed({
          res,
          message: "You do not belong to any shop owner"
        });
      }

      // Check for existing pending product request
      const pendingProductRequest = await this.request.findOne({
        senderId: userId,
        receiverId: shopOwnerId,
        type: "product",
        status: "pending"
      });

      if (pendingProductRequest) {
        return handlers.response.failed({
          res,
          message: "A product request is already pending"
        });
      }

      // Create new product request
      const newProductRequest = await this.request.create({
        senderId: userId,
        receiverId: shopOwnerId,
        type: "product",
        products: products,
        quantityNeeded,
        justification
      });

      let totalAmount = 0;

      for (const item of products) {
        const product = await this.product.findById(item);
        if (!product) continue;
        totalAmount += product.price * quantityNeeded;
      }

      // Create new order
      const newOrder = await this.order.create({
        customerId: user._id,
        products: products,
        totalAmount: totalAmount
      });

      // Create new notification
      const newNotification = await this.notification.create({
        senderId: userId,
        receiverId: shopOwnerId,
        message: `${firstName} ${lastName} has requested a product`,
        type: "Request",
        modelId: newProductRequest._id
      });

      await newNotification.populate(notificationSchema.populate);
      const {
        senderId,
        receiverId,
        message,
        type,
        _id: modelId
      } = newNotification;

      // Send push notification if deviceToken exists
      if (receiverId.deviceToken) {
        const notificationPayload = {
          deviceToken: receiverId.deviceToken,
          title: "New notification",
          body: message,
          data: {
            senderImage: senderId.image?.toString() || "",
            senderName: `${senderId.firstName} ${senderId.lastName}`,
            receiverImage: receiverId.image?.toString() || "",
            receiverName: `${receiverId.firstName} ${receiverId.lastName}`,
            modelId: modelId.toString(),
            type: type || "",
            message: message || ""
          }
        };

        await sendPushNotification(notificationPayload);
      }

      // Respond with success
      return handlers.response.success({
        res,
        message: "Success",
        data: newProductRequest
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async getBudgetRequests(req, res) {
    try {
      const user = req.user;
      const { page, limit, status } = req.query;

      const filters = { type: "budget" };

      if (status) filters.status = status;

      if (user.role === "fleet-manager") {
        filters.receiverId = user._id;
      } else if (user.role === "driver") {
        filters.senderId = user._id;
      } else {
        return handlers.response.failed({
          res,
          message: `Only fleet managers or drivers can view budget requests`
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

  async getProductRequests(req, res) {
    try {
      const user = req.user;
      const { page, limit, status } = req.query;

      const filters = { type: "product" };

      if (status) filters.status = status;

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
