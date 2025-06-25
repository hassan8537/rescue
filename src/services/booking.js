const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const Quote = require("../models/Quote");
const User = require("../models/User");
const bookingSchema = require("../schemas/booking");
const quoteSchema = require("../schemas/quote");
const notificationSchema = require("../schemas/notification");
const handlers = require("../utilities/handlers");
const pagination = require("../utilities/pagination");
const sendPushNotification = require("../utilities/send-push-notification");
const userSchema = require("../schemas/user");

class Service {
  constructor(io) {
    this.io = io;
    this.user = User;
    this.booking = Booking;
    this.notification = Notification;
    this.quote = Quote;
    this.bookingTimeouts = new Map();
  }

  async joinRoom(socket, data) {
    const objectType = "join-room";
    try {
      socket.join(data.userId);
      const user = await this.user.findById(data.userId);
      user.socketId = socket.id;
      await user.save();
      socket.emit(
        "response",
        handlers.event.success({
          objectType,
          message: "Hello! I am in",
          data: user._id
        })
      );
    } catch (error) {
      return socket.emit(
        "error",
        handlers.event.error({ objectType, message: error })
      );
    }
  }

  async createBooking(req, res) {
    try {
      const user = req.user;
      const issueImages = req.files?.["issueImages"];
      const appRoles = ["mechanic", "driver"];
      const webRoles = ["fleet-manager", "shop-owner"];
      const isAppRole = appRoles.includes(user.role);
      const isWebRole = webRoles.includes(user.role);

      if (!isAppRole && !isWebRole) {
        return handlers.response.failed({
          res,
          message: "Invalid role to create booking"
        });
      }

      const body = req.body;

      const createPayload = {
        ...(user._id && { driverId: user._id }),
        ...(body.vehiclePlateNumber && {
          vehiclePlateNumber: body.vehiclePlateNumber
        }),
        ...(issueImages?.length > 0 && {
          issueImages: issueImages.map((file) => file?.path)
        }),
        ...(body.location && {
          location: body.location
        }),
        ...(body.productsRequired && {
          productsRequired: Array.isArray(body.productsRequired)
            ? body.productsRequired
            : [body.productsRequired]
        }),
        ...(body.issueDescription && {
          issueDescription: body.issueDescription
        })
      };

      if (Object.keys(createPayload).length === 0) {
        return handlers.response.failed({
          res,
          message: "No valid fields provided to create"
        });
      }

      // 🔒 Check for existing pending booking by this driver
      const existingPendingBooking = await this.booking.findOne({
        driverId: user._id,
        status: "pending"
      });

      if (existingPendingBooking) {
        return handlers.response.failed({
          res,
          message: "You already have a pending booking"
        });
      }

      const createdBooking = await this.booking.create(createPayload);
      await createdBooking.populate(bookingSchema.populate);

      return handlers.response.success({
        res,
        message: "Booking created successfully",
        data: createdBooking
      });
    } catch (error) {
      console.error("[createBooking] Error:", error.message);
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async sendBookingRequestToMechanics(socket, data) {
    try {
      const { bookingId, driverId } = data;
      const radius = Number(process.env.RADIUS);
      const objectType = "booking-request";
      const maxDistance = radius * 1609.34;

      console.log("[sendBookingRequestToMechanics] Data received:", data);

      if (!bookingId || !driverId) {
        socket.join(driverId.toString());
        return this.io.to(driverId.toString()).emit(
          "error",
          handlers.event.success({
            objectType,
            message: "Missing bookingId or driverId"
          })
        );
      }

      const booking = await this.booking
        .findById(bookingId)
        .populate(bookingSchema.populate);

      if (!booking) {
        socket.join(driverId.toString());
        return this.io.to(driverId.toString()).emit(
          "response",
          handlers.event.failed({
            objectType,
            message: "Booking not found"
          })
        );
      }

      const driver = await this.user.findById(driverId);
      if (!driver) {
        socket.join(driverId.toString());
        return this.io.to(driverId.toString()).emit(
          "response",
          handlers.event.failed({
            objectType,
            message: "Driver not found"
          })
        );
      }

      const mechanics = await this.user.find({
        role: "mechanic",
        isActive: true
        // optional location filtering
      });

      if (!mechanics.length) {
        socket.join(driverId.toString());
        return this.io.to(driverId.toString()).emit(
          "response",
          handlers.event.failed({
            objectType,
            message: "No nearby mechanics found"
          })
        );
      }

      for (const mechanic of mechanics) {
        socket.join(mechanic._id.toString());
        this.io.to(mechanic._id.toString()).emit(
          "response",
          handlers.event.success({
            objectType,
            message: "A driver has requested a booking",
            data: booking
          })
        );

        if (mechanic.deviceToken) {
          const driverName = `${driver.firstName} ${driver.lastName}`;
          await this.notification.create({
            senderId: driver._id,
            receiverId: mechanic._id,
            message: `${driverName} has requested an emergency booking`,
            type: "Booking",
            modelId: booking._id
          });
        }
      }

      const timeout = setTimeout(async () => {
        try {
          const current = await this.booking.findById(bookingId);
          if (current?.status === "pending") {
            await this.booking.findByIdAndDelete(bookingId);
            console.log(
              "[sendBookingRequestToMechanics] Booking expired:",
              bookingId
            );

            socket.join(driver._id.toString());
            this.io.to(driver._id.toString()).emit(
              "response",
              handlers.event.failed({
                objectType,
                message: "No mechanic responded. Booking expired."
              })
            );
          }
        } catch (err) {
          console.error(
            "[sendBookingRequestToMechanics] Timeout error:",
            err.message
          );
          socket.join(driverId.toString());
          return this.io.to(driverId.toString()).emit(
            "response",
            handlers.event.error({
              message: `Timeout error: ${err.message}`
            })
          );
        }
      }, process.env.BOOKING_REQUEST_TIMEOUT);

      this.bookingTimeouts.set(bookingId.toString(), timeout);
      console.log(
        "[sendBookingRequestToMechanics] Timeout set for booking:",
        bookingId
      );
    } catch (err) {
      console.error("[sendBookingRequestToMechanics] Error:", err.message);
      socket.join(data?.driverId?.toString());
      return this.io.to(data?.driverId?.toString()).emit(
        "error",
        handlers.event.error({
          objectType: "booking-request",
          message: `Unexpected error: ${err.message}`
        })
      );
    }
  }

  async sendQuoteToDriver(socket, data) {
    const objectType = "send-quote-to-driver";
    try {
      console.log("[sendQuoteToDriver] Invoked with:", data);

      const { bookingId, mechanicId, estimatedTimeInHours } = data;

      const booking = await this.booking.findOne({
        _id: bookingId,
        status: "pending"
      });
      if (!booking) {
        socket.join(mechanicId.toString());
        return this.io
          .to(mechanicId.toString())
          .emit(
            "response",
            handlers.event.failed({ objectType, message: "Invalid booking ID" })
          );
      }

      const mechanic = await this.user.findOne({
        _id: mechanicId,
        isActive: true
      });
      if (!mechanic) {
        socket.join(mechanicId.toString());
        return this.io.to(mechanicId.toString()).emit(
          "response",
          handlers.event.failed({
            objectType,
            message: "Invalid mechanic ID"
          })
        );
      }

      const driverId = booking.driverId;
      const driver = await this.user.findOne({ _id: driverId, isActive: true });

      if (!driver) {
        socket.join(mechanicId.toString());
        return this.io
          .to(mechanicId.toString())
          .emit(
            "response",
            handlers.event.failed({ objectType, message: "Invalid driver ID" })
          );
      }

      const payload = {
        bookingId: booking._id,
        mechanicId: mechanic._id,
        totalTime: estimatedTimeInHours,
        totalAmount: Number(estimatedTimeInHours) * Number(mechanic.hourlyRates)
      };

      const quote = await this.quote.findOne({
        mechanicId: mechanic._id
      });

      if (quote) {
        socket.join(mechanic._id.toString());
        return this.io.to(mechanic._id.toString()).emit(
          "response",
          handlers.event.failed({
            objectType,
            message: "You have already sent quote to this booking"
          })
        );
      }

      const newQuote = await this.quote.create(payload);

      await newQuote.populate(quoteSchema.populate);

      const { firstName, lastName } = mechanic;
      const fullSenderName = `${firstName} ${lastName}`;

      await this.notification.create({
        senderId: mechanic._id,
        receiverId: driver._id,
        message: `${fullSenderName} has sent a quote`,
        type: "Quote",
        modelId: newQuote._id
      });

      const notificationPayload = {
        deviceToken: driver.deviceToken,
        title: "New notification",
        body: `${fullSenderName} has sent a quote`,
        data: JSON.stringify(newQuote)
      };

      await sendPushNotification(notificationPayload);

      socket.join(driver._id.toString());
      this.io.to(driver._id.toString()).emit(
        "response",
        handlers.event.success({
          objectType,
          message: "Quote sent to driver",
          data: newQuote
        })
      );
    } catch (error) {
      console.error("[sendQuoteToDriver] Error:", error.message);
      const roomId = data?.mechanicId?.toString() || "unknown-room";
      socket.join(roomId);
      return this.io.to(roomId).emit(
        "error",
        handlers.event.error({
          objectType,
          message: `Unexpected error: ${error.message}`
        })
      );
    }
  }

  async acceptMechanicQuote(socket, data) {
    const objectType = "accept-mechanic-quote";
    try {
      const { quoteId, driverId } = data;

      const quote = await this.quote.findById(quoteId);

      if (!quote) {
        socket.join(driverId.toString());
        return this.io
          .to(driverId.toString())
          .emit(
            "response",
            handlers.event.failed({ objectType, message: "Invalid quote ID" })
          );
      }

      const booking = await this.booking.findOne({
        _id: quote.bookingId,
        status: "pending"
      });
      if (!booking) {
        socket.join(driverId.toString());
        return this.io
          .to(driverId.toString())
          .emit(
            "response",
            handlers.event.failed({ objectType, message: "Invalid booking ID" })
          );
      }

      const driver = await this.user.findOne({
        _id: driverId,
        isActive: true
      });
      if (!driver) {
        socket.join(driverId.toString());
        return this.io
          .to(driverId.toString())
          .emit(
            "response",
            handlers.event.failed({ objectType, message: "Invalid driver ID" })
          );
      }

      const mechanic = await this.user.findOne({
        _id: quote.mechanicId,
        isActive: true
      });
      if (!mechanic) {
        socket.join(driverId.toString());
        return this.io.to(driverId.toString()).emit(
          "response",
          handlers.event.failed({
            objectType,
            message: "Invalid mechanic ID"
          })
        );
      }

      booking.mechanicId = quote.mechanicId;
      booking.totalTime = quote.totalTime;
      booking.totalAmount = quote.totalAmount;
      booking.status = "accepted";
      await booking.save();
      await this.quote.deleteOne({ _id: quote._id });

      socket.join(driverId.toString());
      this.io
        .to(driverId.toString())
        .emit(
          "response",
          handlers.event.success({ objectType, message: "Quote accepted" })
        );

      socket.join(mechanic._id.toString());
      return this.io.to(mechanic._id.toString()).emit(
        "response",
        handlers.event.success({
          objectType,
          message: "The driver has accepted your quote"
        })
      );
    } catch (error) {
      console.error("[acceptQuote] Error:", error.message);
      const roomId = data?.driverId?.toString() || "unknown-room";
      socket.join(roomId);
      return this.io.to(roomId).emit(
        "error",
        handlers.event.error({
          objectType,
          message: `Unexpected error: ${error.message}`
        })
      );
    }
  }

  async rejectMechanicQuote(socket, data) {
    const objectType = "reject-mechanic-quote";
    try {
      const { quoteId, driverId } = data;

      const quote = await this.quote.findById(quoteId);
      if (!quote) {
        socket.join(driverId.toString());
        return this.io
          .to(driverId.toString())
          .emit(
            "response",
            handlers.event.failed({ objectType, message: "Invalid quote ID" })
          );
      }

      const booking = await this.booking.findOne({
        _id: quote.bookingId,
        status: "pending"
      });
      if (!booking) {
        socket.join(driverId.toString());
        return this.io
          .to(driverId.toString())
          .emit(
            "response",
            handlers.event.failed({ objectType, message: "Invalid booking ID" })
          );
      }

      const driver = await this.user.findOne({
        _id: driverId,
        isActive: true
      });
      if (!driver) {
        socket.join(driverId.toString());
        return this.io
          .to(driverId.toString())
          .emit(
            "response",
            handlers.event.failed({ objectType, message: "Invalid driver ID" })
          );
      }

      const mechanic = await this.user.findOne({
        _id: quote.mechanicId,
        isActive: true
      });
      if (!mechanic) {
        socket.join(driverId.toString());
        return this.io.to(driverId.toString()).emit(
          "response",
          handlers.event.failed({
            objectType,
            message: "Invalid mechanic ID"
          })
        );
      }

      await this.quote.deleteOne({ _id: quote._id });

      socket.join(driverId.toString());
      this.io
        .to(driverId.toString())
        .emit(
          "response",
          handlers.event.success({ objectType, message: "Quote rejected" })
        );
    } catch (error) {
      console.error("[rejectQuote] Error:", error.message);
      const roomId = data?.driverId?.toString() || "unknown-room";
      socket.join(roomId);
      return this.io.to(roomId).emit(
        "error",
        handlers.event.error({
          objectType,
          message: `Unexpected error: ${error.message}`
        })
      );
    }
  }

  async getBookings(req, res) {
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
        table: "Bookings",
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

  async getBookingById(req, res) {
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

  async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;

      const booking = await this.booking
        .findById(bookingId)
        .populate(bookingSchema.populate);

      if (!booking)
        return handlers.response.failed({ res, message: "Invalid booking ID" });

      booking.status = "cancelled";
      await booking.save();

      return handlers.response.success({
        res,
        message: "Success",
        data: booking
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async updateMechanicCurrentLocation(socket, data) {
    const objectType = "update-mechanic-current-location";
    try {
      console.log("[updateMechanicCurrentLocation] Invoked with:", data);

      const { userId, mechanicCurrentLocation } = data;

      const mechanic = await this.user.findById(userId);
      if (!mechanic) {
        socket.join(userId.toString());
        return this.io.to(userId.toString()).emit(
          "response",
          handlers.event.failed({
            objectType,
            message: "Invalid mechanic ID"
          })
        );
      }

      // Update mechanic's location
      mechanic.location = mechanicCurrentLocation;
      await mechanic.save();

      socket.join(userId.toString());
      return this.io.to(userId.toString()).emit(
        "response",
        handlers.event.success({
          objectType,
          message: "Mechanic's location updated",
          data: mechanicCurrentLocation
        })
      );
    } catch (error) {
      console.error("[updateMechanicCurrentLocation] Error:", error.message);
      const roomId = data?.userId?.toString() || "unknown-room";
      socket.join(roomId);
      return this.io.to(roomId).emit(
        "error",
        handlers.event.error({
          objectType,
          message: `Unexpected error: ${error.message}`
        })
      );
    }
  }

  async trackMechanic(socket, data) {
    try {
      const { userId, jobId } = data;

      const job = await this.booking.findById(jobId);

      const data = handlers.event.success({
        objectType: "track-mechanic",
        message: "Mechanic's location"
      });
    } catch (error) {
      console.error("[trackMechanic] Error:", err.message);
      socket.join(data?.driverId?.toString());
      return this.io.to(data?.driverId?.toString()).emit(
        "error",
        handlers.event.error({
          objectType: "track-mechanic",
          message: `Unexpected error: ${err.message}`
        })
      );
    }
  }

  async getNearbyMechanics(socket, data) {
    const { currentLocation, userId } = data;
    const objectType = "nearby-mechanics";

    try {
      const mechanics = await this.user
        .find({
          role: "mechanic",
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: currentLocation.coordinates
              },
              $maxDistance: parseInt(process.env.MAX_DISTANCE) || 10000
            }
          },
          isActive: true
        })
        .populate(userSchema.populate);

      if (!mechanics.length) {
        socket.join(userId?.toString());
        this.io.to(userId?.toString()).emit(
          "response",
          handlers.event.success({
            objectType,
            message: "No nearby mechanics yet"
          })
        );
      }

      socket.join(userId?.toString());
      this.io.to(userId?.toString()).emit(
        "response",
        handlers.event.success({
          objectType,
          message: "Mechanic's location updated",
          data: mechanics
        })
      );
    } catch (err) {
      console.error("[getNearbyMechanics] Error:", err.message);
      socket.join(userId?.toString());
      this.io.to(userId?.toString()).emit(
        "error",
        handlers.event.error({
          objectType,
          message: `Unexpected error: ${err.message}`
        })
      );
    }
  }

  async getServiceRequests(socket, data) {
    const { userId, currentLocation } = data;
    const objectType = "service-requests";

    try {
      const requests = await this.booking
        .find({
          status: "pending",
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: currentLocation.coordinates
              },
              $maxDistance: parseInt(process.env.MAX_DISTANCE) || 10000 // fallback 10km
            }
          }
        })
        .populate(bookingSchema.populate);

      socket.join(userId?.toString());
      this.io.to(userId?.toString()).emit(
        "response",
        handlers.event.success({
          objectType,
          message: "Service requests",
          data: requests
        })
      );
    } catch (err) {
      console.error("[getServiceRequests] Error:", err.message);
      socket.join(userId?.toString());
      this.io.to(userId?.toString()).emit(
        "error",
        handlers.event.error({
          objectType,
          message: `Unexpected error: ${err.message}`
        })
      );
    }
  }
}

module.exports = new Service();
