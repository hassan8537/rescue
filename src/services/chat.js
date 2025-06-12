const Chat = require("../models/Chat");
const User = require("../models/User");
const chatSchema = require("../schemas/chat");
const handlers = require("../utilities/handlers");

class Service {
  constructor() {
    this.chat = Chat;
    this.user = User;
  }

  async getInbox(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;

      const userId = req.user._id;

      const user = await this.user.findById(userId);
      if (!user) {
        handlers.logger.unavailable({ message: "User not found" });
        return handlers.response.unavailable({
          res,
          message: "User not found"
        });
      }

      const inbox = await this.chat.aggregate([
        {
          $match: {
            $or: [{ senderId: user._id }, { receiverId: user._id }]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: {
              sender: "$senderId",
              receiver: "$receiverId"
            },
            latestMessage: { $first: "$$ROOT" }
          }
        },
        {
          $project: {
            _id: "$latestMessage._id",
            senderId: "$latestMessage.senderId",
            receiverId: "$latestMessage.receiverId",
            text: "$latestMessage.text",
            createdAt: "$latestMessage.createdAt"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "senderId",
            foreignField: "_id",
            as: "sender"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "receiverId",
            foreignField: "_id",
            as: "receiver"
          }
        },
        { $unwind: "$sender" },
        { $unwind: "$receiver" },
        {
          $facet: {
            metadata: [{ $count: "total" }],
            data: [{ $skip: (page - 1) * limit }, { $limit: parseInt(limit) }]
          }
        }
      ]);

      const totalRecords = inbox[0]?.metadata[0]?.total || 0;
      const totalPages = Math.ceil(totalRecords / limit);
      const currentPage = parseInt(page);
      const pageSize = parseInt(limit);

      handlers.logger.success({
        message: "Inbox retrieved successfully",
        data: inbox[0].data
      });

      return handlers.response.success({
        res,
        message: "Inbox retrieved successfully",
        data: {
          results: inbox[0].data,
          totalRecords,
          totalPages,
          currentPage,
          pageSize
        }
      });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async newChat(data) {
    try {
      const { senderId, receiverId, text } = data;

      const [sender, receiver] = await Promise.all([
        this.user.findById(senderId),
        this.user.findById(receiverId)
      ]);

      if (!sender) {
        return handlers.event.unavailable({
          objectType: "newChat",
          message: "No sender found"
        });
      }

      if (!receiver) {
        return handlers.event.unavailable({
          objectType: "newChat",
          message: "No receiver found"
        });
      }

      const newChat = new this.chat({
        senderId: sender._id,
        receiverId: receiver._id,
        text
      });

      await newChat.save();
      await newChat.populate(chatSchema.populate);

      return handlers.event.success({
        objectType: "newChat",
        message: "New chat created successfully",
        data: newChat
      });
    } catch (error) {
      return handlers.event.error({
        objectType: "newChat",
        message: error.message
      });
    }
  }

  async getChats(data) {
    try {
      const { senderId, receiverId } = data;

      const [sender, receiver] = await Promise.all([
        this.user.findById(senderId),
        this.user.findById(receiverId)
      ]);

      if (!sender) {
        return handlers.event.unavailable({
          objectType: "chats",
          message: "No sender found"
        });
      }

      if (!receiver) {
        return handlers.event.unavailable({
          objectType: "chats",
          message: "No receiver found"
        });
      }

      const chats = await this.chat
        .find({
          $or: [
            { senderId: sender._id, receiverId: receiver._id },
            { senderId: receiver._id, receiverId: sender._id }
          ]
        })
        .populate(chatSchema.populate);

      return handlers.event.success({
        objectType: "chats",
        message: "Chats retrieved successfully",
        data: chats
      });
    } catch (error) {
      return handlers.event.error({
        objectType: "chats",
        message: error.message
      });
    }
  }
}

module.exports = new Service();
