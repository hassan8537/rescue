const Order = require("../models/Order");
const Notification = require("../models/Notification");
const User = require("../models/User");
const orderSchema = require("../schemas/order");
const handlers = require("../utilities/handlers");
const pagination = require("../utilities/pagination");
const sendPushNotification = require("../utilities/send-push-notification");

class Service {
  constructor(io) {
    this.io = io;
    this.user = User;
    this.order = Order;
    this.notification = Notification;
  }

  async getOrders(req, res) {
    try {
      const user = req.user;
      const { page, limit, status } = req.query;
      const filters = {};

      if (status) filters.status = status;

      if (user.role === "shop-owner") {
        const mechanics = await this.user.find(
          { role: "mechanic", shopOwnerId: user._id },
          "_id"
        );

        const mechanicIds = mechanics.map((m) => m._id);

        if (mechanicIds.length === 0) {
          return handlers.response.success({
            res,
            message: "No mechanic orders found",
            data: []
          });
        }

        filters.customerId = { $in: mechanicIds };
      } else {
        return handlers.response.failed({
          res,
          message: "Only shop owners can view mechanic orders"
        });
      }

      return await pagination({
        res,
        table: "Orders",
        model: this.order,
        filters,
        page,
        limit,
        populate: orderSchema?.populate || []
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async getOrderById(req, res) {
    try {
      const user = req.user;
      const order = await this.order
        .findById(req.params.orderId)
        .populate(orderSchema?.populate || []);

      if (!order) {
        return handlers.response.failed({ res, message: "Invalid order ID" });
      }

      if (user.role === "shop-owner") {
        const mechanic = await this.user.findOne({
          _id: order.customerId,
          role: "mechanic",
          shopOwnerId: user._id
        });

        if (!mechanic) {
          return handlers.response.failed({
            res,
            message: "You are not authorized to view this order"
          });
        }
      } else {
        return handlers.response.failed({
          res,
          message: "Only shop owners can view mechanic orders"
        });
      }

      return handlers.response.success({
        res,
        message: "Success",
        data: order
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async markOrderReady(socket, data) {
    const objectType = "ready-order";
    const { orderId, userId } = data;

    try {
      const order = await this.order
        .findById(orderId)
        .populate(orderSchema.populate || []);
      if (!order) {
        throw new Error("Order not found");
      }

      // Update the order status to 'ready'
      order.status = "ready";
      await order.save();

      // Get both mechanic (customerId) and shop owner (via mechanic's record)
      const mechanic = await this.user.findById(order.customerId);
      if (!mechanic || !mechanic.shopOwnerId) {
        throw new Error("Associated mechanic or shop owner not found");
      }

      const shopOwner = await this.user.findById(mechanic.shopOwnerId);

      // Emit update to both users via socket
      const targetIds = [mechanic._id.toString(), shopOwner._id.toString()];

      targetIds.forEach((id) => {
        socket.join(id);
        this.io.to(id).emit(
          "response",
          handlers.event.success({
            objectType,
            message: "Order marked as ready",
            data: order
          })
        );
      });

      // Send notifications
      const notifications = await this.notification.insertMany([
        {
          senderId: userId,
          receiverId: mechanic._id,
          message: "Your order has been marked as ready",
          type: "Order",
          modelId: order._id
        },
        {
          senderId: userId,
          receiverId: shopOwner._id,
          message: `Order for ${mechanic.firstName} ${mechanic.lastName} is ready`,
          type: "Order",
          modelId: order._id
        }
      ]);

      // Optionally send push notifications if deviceTokens exist
      for (const receiver of [mechanic, shopOwner]) {
        if (receiver.deviceToken) {
          const notificationPayload = {
            deviceToken: receiver.deviceToken,
            title: "Order Ready",
            body: "Your order is now marked as ready",
            data: {
              orderId: order._id.toString(),
              type: "Order"
            }
          };

          await sendPushNotification(notificationPayload);
        }
      }
    } catch (err) {
      console.error("[markOrderReady] Error:", err.message);
      socket.join(userId?.toString());
      this.io.to(userId?.toString()).emit(
        "error",
        handlers.event.error({
          objectType,
          message: `Unexpected error: ${err.message}`
        })
      );
    }
  }
}

module.exports = new Service();
