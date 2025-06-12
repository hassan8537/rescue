const Booking = require("../models/Booking");
const bookingSchema = require("../schemas/booking");
const handlers = require("../utilities/handlers");

class Service {
  constructor() {
    this.booking = Booking;
  }

  async createEmergencyServiceBooking(req, res) {
    try {
      const user = req.user;

      console.log("req.body:", req.body);
      console.log("req.files:", req.files);
      console.log("User role:", user.role);

      const issueImages = req.files?.["issueImages"];

      const appRoles = ["mechanic", "driver"];
      const webRoles = ["fleet-manager", "shop-owner"];

      const isAppRole = appRoles.includes(user.role);
      const isWebRole = webRoles.includes(user.role);

      console.log({ isAppRole, isWebRole });

      const appPayload = {
        ...(user._id && { userId: user._id }),
        ...(req.body.vehiclePlateNumber && {
          vehiclePlateNumber: req.body.vehiclePlateNumber
        }),
        ...(issueImages.length > 0 && {
          issueImages: issueImages.map((file) => file?.path)
        }),
        ...(req.body.location && { location: req.body.location }),
        ...(req.body.productsRequired && {
          productsRequired: req.body.productsRequired
        }),
        ...(req.body.issueDescription && {
          issueDescription: req.body.issueDescription
        })
      };

      const webPayload = {};

      console.log({ appPayload, webPayload });

      if (!isAppRole && !isWebRole) {
        return handlers.response.failed({
          res,
          message: "Invalid role to edit profile"
        });
      }

      const createPayload = {
        ...(isAppRole ? appPayload : {}),
        ...(isWebRole ? webPayload : {})
      };

      console.log("Final createPayload:", createPayload);

      if (Object.keys(createPayload).length === 0) {
        return handlers.response.failed({
          res,
          message: "No valid fields provided to create"
        });
      }

      const createdUser = await this.booking.create(createPayload);

      await createdUser.populate(bookingSchema.populate);

      return handlers.response.success({
        res,
        message: "Success",
        data: createdUser
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }
}

module.exports = new Service();
