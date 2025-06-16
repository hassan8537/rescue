const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      trim: true,
      required: true
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      trim: true,
      required: true
    },
    type: {
      type: String,
      enum: ["budget", "product"]
    },
    reason: {
      type: String,
      trim: true,
      default: ""
    },
    amount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

const Request = model("Request", schema);
module.exports = Request;
