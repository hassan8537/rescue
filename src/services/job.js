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
      const filters = { ...req.query };

      if (user.role === "driver") {
        filters.driverId = user._id;
      } else if (user.role === "mechanic") {
        filters.mechanicId = user._id;
      } else if (user.role === "shop-owner") {
        const mechanics = await this.user.find(
          {
            role: "mechanic",
            shopOwnerId: user._id
          },
          "_id"
        );

        const mechanicIds = mechanics.map((m) => m._id);
        filters.mechanicId = { $in: mechanicIds };
      } else if (user.role === "fleet-manager") {
        const drivers = await this.user.find(
          {
            role: "driver",
            fleetManagerId: user._id
          },
          "_id"
        );

        const driverIds = drivers.map((d) => d._id);
        filters.driverId = { $in: driverIds };
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
      return handlers.response.error({ res, message: error });
    }
  }

  async getJobById(req, res) {
    try {
      // Note: Booking is Job here, don't be confused
      const job = await this.booking
        .findById(req.params.jobId)
        .populate(bookingSchema.populate);

      if (!job) {
        return handlers.response.failed({ res, message: "Invalid job ID" });
      }

      return handlers.response.success({
        res,
        message: "Success",
        data: job
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }
}

module.exports = new Service();
