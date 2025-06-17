const Otp = require("../models/Otp");
const User = require("../models/User");
const userSchema = require("../schemas/user");
const generateBearerToken = require("../utilities/bearer-token-generator");
const bcrypt = require("bcrypt");
const handlers = require("../utilities/handlers");

class Service {
  constructor() {
    this.user = User;
    this.otp = Otp;
  }

  async signUp(req, res) {
    try {
      const { email, password, termsAndConditions, role, deviceToken } =
        req.body;

      if (await this.user.exists({ email })) {
        return handlers.response.failed({
          res,
          message: "Email is already in use"
        });
      }

      const newUser = await this.user.create({
        role,
        email,
        password,
        deviceToken,
        termsAndConditions
      });

      await newUser.populate(userSchema.populate);

      return handlers.response.success({
        res,
        message: "Signed Up!",
        data: newUser
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async signIn(req, res) {
    try {
      const { email, password, rememberMe, deviceToken } = req.body;

      const existingUser = await this.user.findOne({
        email
      });

      if (!existingUser) {
        return handlers.response.failed({
          res,
          message: "Invalid credentials"
        });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        existingUser.password
      );

      if (!isPasswordValid) {
        return handlers.response.failed({
          res,
          message: "Invalid credentials"
        });
      }

      const token = generateBearerToken({ _id: existingUser._id, res });

      existingUser.sessionToken = token;
      existingUser.rememberMe = rememberMe;
      existingUser.deviceToken = deviceToken;
      await existingUser.save();
      await existingUser.populate(userSchema.populate);

      return handlers.response.success({
        res,
        message: "Signed in!",
        data: existingUser
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const existingUser = await this.user.findOne({
        email
      });

      if (!existingUser) {
        return handlers.response.failed({
          res,
          message: "Invalid email address"
        });
      }

      const otpExpirationMinutes = process.env.OTP_EXPIRATION_MINUTES;
      const otpCode = 123456;
      const expiresIn = new Date(Date.now() + otpExpirationMinutes * 60 * 1000);

      existingUser.isResetPasswordConfirmed = false;
      await existingUser.save();

      await this.otp.deleteOne({
        type: "reset-password",
        userId: existingUser._id
      });

      await this.otp.create({
        type: "reset-password",
        userId: existingUser._id,
        code: otpCode,
        expires_in: expiresIn
      });

      // await sendEmail({
      //   to: existingUser.email_address,
      //   subject: "Verify Email Address",
      //   text: `Your verification code is ${otpCode}`
      // });

      return handlers.response.success({
        res,
        message: "A verification code has been sent to your email",
        data: existingUser
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, newPassword } = req.body;

      if (!email) {
        return handlers.response.failed({
          res,
          message: "Email address is required"
        });
      }

      if (!newPassword) {
        return handlers.response.failed({
          res,
          message: "New password is required"
        });
      }

      const existingUser = await this.user.findOne({ email });
      if (!existingUser) {
        return handlers.response.failed({
          res,
          message: "Invalid email address"
        });
      }

      if (!existingUser.isResetPasswordConfirmed) {
        return handlers.response.failed({
          res,
          message: "Email address is not verified"
        });
      }

      const isPasswordSame = await bcrypt.compare(
        newPassword,
        existingUser.password
      );
      if (isPasswordSame) {
        return handlers.response.success({
          res,
          message: "New password cannot be as the old password"
        });
      }

      existingUser.password = newPassword;
      await existingUser.save();

      return handlers.response.success({
        res,
        message: "Password changed successfully",
        data: existingUser
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
