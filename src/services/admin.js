const User = require("../models/User");
const Account = require("../models/Account");
const Booking = require("../models/Booking");
const Chat = require("../models/Chat");
const Content = require("../models/Content");
const Otp = require("../models/Otp");
const Notification = require("../models/Notification");
const Product = require("../models/Product");
const Quote = require("../models/Quote");
const Request = require("../models/Request");
const Review = require("../models/Review");

const handlers = require("../utilities/handlers");
const pagination = require("../utilities/pagination");
const generateBearerToken = require("../utilities/bearer-token-generator");
const userSchema = require("../schemas/user");

const bcrypt = require("bcrypt");

class AdminService {
  constructor() {
    this.user = User;
    this.account = Account;
    this.booking = Booking;
    this.chat = Chat;
    this.content = Content;
    this.otp = Otp;
    this.notification = Notification;
    this.product = Product;
    this.quote = Quote;
    this.request = Request;
    this.review = Review;
  }

  async signIn(req, res) {
    try {
      const { email, password, rememberMe, deviceToken } = req.body;

      const existingUser = await this.user.findOne({
        email,
        role: "admin"
      });

      if (!existingUser) {
        return handlers.response.failed({
          res,
          message: "Invalid credentials"
        });
      }

      const isPasswordValid = bcrypt.compare(password, existingUser.password);

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
      return handlers.response.error({ res, message: error });
    }
  }

  async fetchPaginated(model, table, req, res) {
    try {
      const { page, limit } = req.query;
      return await pagination({
        res,
        table,
        model,
        filters: {},
        page,
        limit,
        sort: { createdAt: -1 }
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  getUsers(req, res) {
    return this.fetchPaginated(this.user, "Users", req, res);
  }

  getAccounts(req, res) {
    return this.fetchPaginated(this.account, "Accounts", req, res);
  }

  getBookings(req, res) {
    return this.fetchPaginated(this.booking, "Bookings", req, res);
  }

  getChats(req, res) {
    return this.fetchPaginated(this.chat, "Chats", req, res);
  }

  getContents(req, res) {
    return this.fetchPaginated(this.content, "Contents", req, res);
  }

  getOtps(req, res) {
    return this.fetchPaginated(this.otp, "Otps", req, res);
  }

  getNotifications(req, res) {
    return this.fetchPaginated(this.notification, "Notifications", req, res);
  }

  getProducts(req, res) {
    return this.fetchPaginated(this.product, "Products", req, res);
  }

  getQuotes(req, res) {
    return this.fetchPaginated(this.quote, "Quotes", req, res);
  }

  getRequests(req, res) {
    return this.fetchPaginated(this.request, "Requests", req, res);
  }

  getReviews(req, res) {
    return this.fetchPaginated(this.review, "Reviews", req, res);
  }
}

module.exports = new AdminService();
