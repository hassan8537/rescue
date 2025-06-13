const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true
    },
    mechanicId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    totalTime: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Quote = model("Quote", schema);
module.exports = Quote;
