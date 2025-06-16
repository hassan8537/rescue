const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      trim: true,
      default: null
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      trim: true,
      default: null
    },
    message: {
      type: String,
      trim: true,
      default: ""
    },
    type: {
      type: String,
      enum: ["Booking", "Chat", "Request"],
      trim: true,
      required: true
    },
    modelId: {
      type: Schema.Types.ObjectId,
      refPath: "type",
      required: true
    },
    status: {
      type: String,
      enum: ["read", "unread"],
      default: "unread"
    },
    modelAction: {
      type: String,
      enum: ["accepted", "rejected"]
    }
  },
  { timestamps: true }
);

const Notification = model("Notification", schema);
module.exports = Notification;
