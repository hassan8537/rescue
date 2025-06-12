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
    text: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

const Chat = model("Chat", schema);
module.exports = Chat;
