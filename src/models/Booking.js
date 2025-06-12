const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      trim: true
    },
    vehiclePlateNumber: {
      type: String,
      required: true,
      trim: true
    },
    issueImages: {
      type: Array,
      default: []
    },
    location: {
      name: { type: String, default: "" },
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number],
        default: [0, 0],
        index: "2dsphere"
      }
    },
    productsRequired: {
      type: Array,
      default: []
    },
    issueDescription: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const Booking = model("Booking", schema);
module.exports = Booking;
