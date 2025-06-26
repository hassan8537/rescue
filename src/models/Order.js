const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
      }
    ],
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "ready", "delivered"],
      default: "pending"
    }
  },
  { timestamps: true }
);

const Order = model("Order", schema);
module.exports = Order;
