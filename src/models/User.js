const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");

const saltRounds = process.env.SALT_ROUNDS;

const schema = new Schema(
  {
    businessLogo: { type: String, trim: true, default: "" },
    fleetName: { type: String, trim: true, default: "" },
    shopName: { type: String, trim: true, default: "" },
    businessEmail: { type: String, trim: true, default: "" },
    businessPhoneNumber: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "" },

    image: { type: String, trim: true, default: "" },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    phoneNumber: { type: String, trim: true, default: "" },
    rememberMe: { type: Boolean, trim: true, default: false },

    password: { type: String, trim: true, default: "" },
    role: {
      type: String,
      enum: ["admin", "driver", "mechanic", "fleet-manager", "shop-owner"],
      trim: true
    },
    provider: {
      type: String,
      enum: ["google", "apple", "phone", "email"],
      trim: true,
      default: "email"
    },
    socialToken: { type: String, trim: true, default: "" },
    deviceToken: { type: String, trim: true, default: "" },
    sessionToken: { type: String, trim: true, default: "" },

    location: {
      name: { type: String, default: "" },
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number],
        default: [0, 0],
        index: "2dsphere"
      }
    },

    termsAndConditions: { type: Boolean, default: false },
    privacyPolicy: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isProfileCompleted: { type: Boolean, default: false },
    isNotificationEnabled: { type: Boolean, default: false },
    isAccountConnected: { type: Boolean, default: false },
    isResetPasswordConfirmed: { type: Boolean, default: false },
    isMerchantSetup: { type: Boolean, default: false },
    stripeMerchantId: { type: String, default: null },
    stripeCustomerId: { type: String, default: null },

    avgRating: { type: Number, default: 0 },

    fleetManagerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    shopOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    vehiclePlateNumber: { type: String, trim: true, default: null },
    assignVin: { type: String, default: null },
    drivingLicense: { type: String, trim: true, default: null },
    budget: { type: Number, default: 0 },

    mechanicCertification: { type: String, trim: true, default: null },
    hourlyRates: { type: Number, default: 0 },

    socketId: { type: String, default: "" }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        return ret;
      }
    },
    toObject: {
      transform(doc, ret) {
        delete ret.password;
        return ret;
      }
    }
  }
);

// Password hashing middleware
schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(Number(saltRounds));
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

schema.index({ location: "2dsphere" });

const User = model("User", schema);
module.exports = User;
