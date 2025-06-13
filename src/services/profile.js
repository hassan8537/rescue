const User = require("../models/User");
const userSchema = require("../schemas/user");
const handlers = require("../utilities/handlers");
const bcrypt = require("bcrypt");

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

  async setUpMyProfile(req, res) {
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
        ...(req.body.location && { location: req.body.location }),
        isProfileCompleted: true
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
      const { userId } = req.params;

      const user = await this.user.findById(userId);
      if (!user) {
        const msg = "User not found or already deleted";
        return handlers.response.unavailable({ res, message: msg });
      }

      user.isActive = false;
      await user.save();

      return handlers.response.success({ res, message: "Deactivated" });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({
        res,
        message: error
      });
    }
  }

  async activateAccount(req, res) {
    try {
      const { userId } = req;

      const user = await this.user.findById(userId);

      if (!user) {
        const msg = "User not found or already deleted";
        return handlers.response.unavailable({ res, message: msg });
      }

      user.isActive = true;
      await user.save();

      return handlers.response.success({ res, message: "Activated" });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({
        res,
        message: error
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return handlers.response.failed({
          res,
          message: "Both old and new passwords are required"
        });
      }

      const user = await this.user.findById(req.user._id);

      if (!user) {
        return handlers.response.failed({
          res,
          message: "User not found"
        });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return handlers.response.failed({
          res,
          message: "Old password is incorrect"
        });
      }

      user.password = newPassword;
      await user.save();

      return handlers.response.success({
        res,
        message: "Success"
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async getAdmin(req, res) {
    try {
      const admin = await this.user.findOne({ role: "admin" });

      return handlers.response.success({
        res,
        message: "Success",
        data: admin
      });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new UserService();
