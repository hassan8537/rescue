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
    rating: {
      type: Number,
      max: 5,
      min: 0,
      default: 0
    },
    review: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

const Review = model("Review", schema);
module.exports = Review;
