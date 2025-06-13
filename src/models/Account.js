const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    stripeCardId: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const Account = model("Account", schema);
module.exports = Account;
