const User = require("../models/User");
const userSchema = require("../schemas/user");
const handlers = require("../utilities/handlers");

class Service {
  constructor() {
    this.user = User;
  }

  async getMechanicStatistics(req, res) {
    try {
      const user = req.user;

      const [totalMechanics, totalActiveMechanics, totalInActiveMechanics] =
        await Promise.all([
          this.user.countDocuments({
            role: "mechanic",
            shopOwnerId: user._id
          }),
          this.user.countDocuments({
            role: "mechanic",
            shopOwnerId: user._id,
            isActive: true
          }),
          this.user.countDocuments({
            role: "mechanic",
            shopOwnerId: user._id,
            isActive: false
          })
        ]);

      const statistics = {
        totalMechanics,
        totalActiveMechanics,
        totalInActiveMechanics
      };

      return handlers.response.success({
        res,
        message: "Mechanic statistics fetched successfully",
        data: statistics
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async createMechanic(req, res) {
    try {
      if (req.user.role !== "shop-owner") {
        return handlers.response.unauthorized({
          res,
          message: "Only shop owners can create mechanics"
        });
      }

      const { firstName, lastName, email, password, hourlyRates } = req.body;

      const image = req.files?.["image"]?.[0]?.path;
      const mechanicCertification =
        req.files?.["mechanicCertification"]?.[0]?.path;

      const existingMechanic = await this.user.findOne({
        email,
        role: "mechanic"
      });
      if (existingMechanic) {
        return handlers.response.failed({
          res,
          message: "Email already in use"
        });
      }

      const newMechanic = new this.user({
        image,
        firstName,
        lastName,
        email,
        password,
        mechanicCertification,
        hourlyRates,
        role: "mechanic",
        shopOwnerId: req.user._id
      });

      await newMechanic.save();
      await newMechanic.populate(userSchema.populate);

      return handlers.response.success({
        res,
        message: "Mechanic created successfully",
        data: newMechanic
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async updateMechanic(req, res) {
    try {
      if (req.user.role !== "shop-owner") {
        return handlers.response.unauthorized({
          res,
          message: "Only shop owners can update mechanics"
        });
      }

      const fileImage = req.files?.["image"]?.[0]?.path;
      const fileCertification = req.files?.["mechanicCertification"]?.[0]?.path;

      const { firstName, lastName, email, password, hourlyRates } = req.body;

      const mechanicId = req.params.mechanicId;

      const mechanic = await this.user.findOne({
        _id: mechanicId,
        shopOwnerId: req.user._id,
        role: "mechanic"
      });

      if (!mechanic) {
        return handlers.response.failed({
          res,
          message: "Mechanic not found or does not belong to your shop"
        });
      }

      if (fileImage) mechanic.image = fileImage;
      if (fileCertification) mechanic.mechanicCertification = fileCertification;
      if (firstName) mechanic.firstName = firstName;
      if (lastName) mechanic.lastName = lastName;
      if (email) mechanic.email = email;
      if (password) mechanic.password = password;
      if (hourlyRates) mechanic.hourlyRates = hourlyRates;

      await mechanic.save();

      return handlers.response.success({
        res,
        message: "Mechanic updated successfully",
        data: mechanic
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async deleteMechanic(req, res) {
    try {
      const mechanicId = req.params.mechanicId;

      if (req.user.role !== "shop-owner") {
        return handlers.response.unauthorized({
          res,
          message: "Only shop owners can delete mechanics"
        });
      }

      const mechanic = await this.user.findOne({
        _id: mechanicId,
        shopOwnerId: req.user._id,
        role: "mechanic"
      });

      if (!mechanic) {
        return handlers.response.failed({
          res,
          message: "Mechanic not found or does not belong to your shop"
        });
      }

      await this.user.deleteOne({ _id: mechanic._id });

      return handlers.response.success({
        res,
        message: "Mechanic deleted successfully"
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }

  async getMechanics(req, res) {
    try {
      if (req.user.role !== "shop-owner") {
        return handlers.response.unauthorized({
          res,
          message: "Only shop owners can view mechanics"
        });
      }

      const { page = 1, limit = 10, search = "", ...filters } = req.query;

      const searchFilter = search
        ? {
            $or: [
              { firstName: { $regex: search, $options: "i" } },
              { lastName: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } }
            ]
          }
        : {};

      const filterConditions = {
        role: "mechanic",
        shopOwnerId: req.user._id,
        ...filters,
        ...searchFilter
      };

      const mechanics = await this.user
        .find(filterConditions)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate(userSchema.populate);

      const totalMechanics = await this.user.countDocuments(filterConditions);

      return handlers.response.success({
        res,
        message: "Mechanics retrieved successfully",
        data: {
          results: mechanics,
          totalRecords: totalMechanics,
          totalPages: Math.ceil(totalMechanics / limit),
          currentPage: Number(page),
          pageSize: Number(limit)
        }
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: "Failed to retrieve mechanics"
      });
    }
  }

  async getMechanicById(req, res) {
    try {
      const mechanicId = req.params.mechanicId;

      if (req.user.role !== "shop-owner") {
        return handlers.response.unauthorized({
          res,
          message: "Only shop owner accounts can view mechanics"
        });
      }

      const mechanic = await this.user.findOne({
        _id: mechanicId,
        shopOwnerId: req.user._id,
        role: "mechanic"
      });

      if (!mechanic) {
        return handlers.response.failed({
          res,
          message: "Mechanic not found or does not belong to your shop"
        });
      }

      return handlers.response.success({
        res,
        message: "Mechanic fetched successfully",
        data: mechanic
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error
      });
    }
  }

  async allocateHourlyRates(req, res) {
    try {
      const { hourlyRates } = req.body;
      const mechanicId = req.params.mechanicId;

      if (req.user.role !== "shop-owner") {
        return handlers.response.unauthorized({
          res,
          message: "Only shop owners can allocate hourly rates to mechanics"
        });
      }

      const mechanic = await this.user.findOne({
        _id: mechanicId,
        shopOwnerId: req.user._id,
        role: "mechanic"
      });

      if (!mechanic) {
        return handlers.response.failed({
          res,
          message: "Mechanic not found or does not belong to your shop"
        });
      }

      mechanic.hourlyRates += Number(hourlyRates);
      await mechanic.save();

      return handlers.response.success({
        res,
        message: "Hourly rate allocated successfully",
        data: mechanic
      });
    } catch (error) {
      return handlers.response.error({ res, message: error });
    }
  }
}

module.exports = new Service();
