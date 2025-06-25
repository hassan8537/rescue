const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    vehiclePlateNumber: {
      type: String,
      required: true,
      trim: true
    },
    issueImages: {
      type: [String],
      default: []
    },
    location: {
      name: { type: String, default: "" },
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        index: "2dsphere"
      }
    },
    productsRequired: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
        default: null
      }
    ],
    issueDescription: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: [
        "pending",
        "rejected",
        "accepted",
        "ongoing",
        "completed",
        "cancelled",
        "arriving"
      ],
      default: "pending"
    },
    mechanicId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
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

const Booking = model("Booking", schema);
module.exports = Booking;
