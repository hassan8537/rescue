const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const Quote = require("../models/Quote");
const User = require("../models/User");
const bookingSchema = require("../schemas/booking");
const handlers = require("../utilities/handlers");
const pagination = require("../utilities/pagination");

class Service {
  constructor(io) {
    this.io = io;
    this.user = User;
    this.booking = Booking;
    this.notification = Notification;
    this.quote = Quote;
  }

  async getJobs(req, res) {
    try {
      const user = req.user;

      const filters = {};

      if (user.role === "shop-owner") {
        filters.mechanicId = user._id;
      } else if (user.role === "mechanic") {
        filters.driverId = user._id;
      }

      return await pagination({
        res,
        table: "Jobs",
        model: this.booking,
        filters: filters,
        page: req.query.page,
        limit: req.query.limit,
        populate: bookingSchema.populate
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async getJobById(req, res) {
    try {
      const booking = await this.booking
        .findById(req.params.bookingId)
        .populate(bookingSchema.populate);

      if (!booking) {
        return handlers.response.failed({ res, message: "Invalid booking ID" });
      }

      return handlers.response.success({
        res,
        message: "Success",
        data: booking
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
