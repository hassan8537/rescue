const { Schema, model } = require("mongoose");

const otpExpirationSeconds = process.env.OTP_EXPIRATION_SECONDS;

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["email-verification", "reset-password"],
      default: "email-verification"
    },
    code: {
      type: Number,
      required: true,
      default: 123456
    },
    expiresIn: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + otpExpirationSeconds * 1000)
    },
    isUsed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Otp = model("Otp", schema);
module.exports = Otp;
