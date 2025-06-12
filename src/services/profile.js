const User = require("../models/User");
const userSchema = require("../schemas/user");
const handlers = require("../utilities/handlers");

class UserService {
  constructor() {
    this.user = User;
  }

  async getMyProfile(req, res) {
    try {
      const user = req.user;

      await user.populate(userSchema.populate);
      await user.save();

      return handlers.response.success({
        res,
        message: "Success",
        data: user
      });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async setUpProfile(req, res) {
    try {
      const { body, user: currentUser } = req;

      const requiredFields = [
        "business_logo",
        "fleetName",
        "businessEmail",
        "business_phoneNumber",
        "website",
        "bio"
      ];

      const missingFields = requiredFields.filter((field) => !body[field]);

      if (missingFields.length) {
        const msg = `Missing required fields: ${missingFields.join(", ")}`;
        handlers.logger.failed({ message: msg });
        return handlers.response.failed({ res, message: msg });
      }

      const accountExists = await this.account.exists({
        user_id: currentUser._id
      });

      if (!currentUser.is_account_connected) {
        return handlers.response.success({
          res,
          message: "Account is not connected"
        });
      }

      const profileData = {
        business_logo: body.business_logo,
        fleetName: body.fleetName,
        businessEmail: body.businessEmail,
        business_phoneNumber: body.business_phoneNumber,
        location: body.location,
        website: body.website,
        bio: body.bio,
        is_profile_completed: true
      };

      const profile = await this.user
        .findByIdAndUpdate(currentUser._id, profileData, { new: true })
        .populate(userSchema.populate);

      handlers.logger.success({
        message: "Profile setup successful",
        data: profile
      });
      return handlers.response.success({
        res,
        message: "Profile setup successful",
        data: profile
      });
    } catch (error) {
      handlers.logger.error({ message: error.message });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async editMyProfile(req, res) {
    try {
      const user = req.user;

      console.log("req.body:", req.body);
      console.log("req.files:", req.files);
      console.log("User role:", user.role);

      const image = req.files?.["image"]?.[0];
      const drivingLicense = req.files?.["drivingLicense"]?.[0];
      const businessLogo = req.files?.["businessLogo"]?.[0];

      const appRoles = ["mechanic", "driver"];
      const webRoles = ["fleet-manager", "shop-owner"];

      const isAppRole = appRoles.includes(user.role);
      const isWebRole = webRoles.includes(user.role);

      console.log({ isAppRole, isWebRole });

      const appPayload = {
        ...(image && { image: image.path }),
        ...(req.body.firstName && { firstName: req.body.firstName }),
        ...(req.body.lastName && { lastName: req.body.lastName }),
        ...(req.body.phoneNumber && { phoneNumber: req.body.phoneNumber }),
        ...(drivingLicense && { drivingLicense: drivingLicense.path })
      };

      const webPayload = {
        ...(businessLogo && { businessLogo: businessLogo.path }),
        ...(req.body.fleetName && { fleetName: req.body.fleetName }),
        ...(req.body.website && { website: req.body.website }),
        ...(req.body.businessEmail && {
          businessEmail: req.body.businessEmail
        }),
        ...(req.body.bio && { bio: req.body.bio }),
        ...(req.body.location && { location: req.body.location })
      };

      console.log({ appPayload, webPayload });

      if (!isAppRole && !isWebRole) {
        return handlers.response.failed({
          res,
          message: "Invalid role to edit profile"
        });
      }

      const editPayload = {
        ...(isAppRole ? appPayload : {}),
        ...(isWebRole ? webPayload : {})
      };

      console.log("Final editPayload:", editPayload);

      if (Object.keys(editPayload).length === 0) {
        return handlers.response.failed({
          res,
          message: "No valid fields provided to edit"
        });
      }

      const editedUser = await this.user
        .findByIdAndUpdate(user._id, editPayload, { new: true })
        .populate(userSchema.populate);

      return handlers.response.success({
        res,
        message: "Success",
        data: editedUser
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async deleteAccount(req, res) {
    try {
      const { user: currentUser, params } = req;
      const query =
        currentUser.role === "admin" && params._id
          ? { _id: params._id }
          : { _id: currentUser._id };

      const user = await this.user.findOne(query);
      if (!user) {
        const msg = "User not found or already deleted";
        handlers.logger.unavailable({ message: msg });
        return handlers.response.unavailable({ res, message: msg });
      }

      await Promise.all([
        this.account.deleteMany({ user_id: user._id }),
        this.file.deleteMany({ user_id: user._id }),
        this.otp.deleteMany({ user_id: user._id }),
        this.notification.deleteMany({ user_id: user._id })
      ]);

      await this.user.findByIdAndDelete(user._id);

      const msg = "User and all associated data deleted successfully";
      handlers.logger.success({ message: msg });
      return handlers.response.success({ res, message: msg });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({
        res,
        message: "Failed to delete this account"
      });
    }
  }

  async deactivateAccount(req, res) {
    try {
      const { user: currentUser, params } = req;
      const query =
        currentUser.role === "admin" && params._id
          ? { _id: params._id }
          : { _id: currentUser._id };

      const user = await this.user.findOne(query);
      if (!user) {
        const msg = "User not found or already deleted";
        handlers.logger.unavailable({ message: msg });
        return handlers.response.unavailable({ res, message: msg });
      }

      user.is_active = false;
      await user.save();

      handlers.logger.success({ message: "Deactivated" });
      return handlers.response.success({ res, message: "Deactivated" });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({
        res,
        message: "Failed to deactivate this account"
      });
    }
  }
}

module.exports = new UserService();
