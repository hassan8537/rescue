const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    media: {
      type: Array,
      default: []
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      default: 0
    },
    quantity: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Product = model("Product", schema);
module.exports = Product;
