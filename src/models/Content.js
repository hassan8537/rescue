const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    type: {
      type: String,
      enum: ["terms-and-conditions", "privacy-policy"]
    },
    url: {
      type: String,
      trim: true,
      default: null
    },
    description: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

const Content = model("Content", schema);
module.exports = Content;
