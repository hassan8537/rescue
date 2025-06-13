const User = require("../models/User");
const userSchema = require("../schemas/user");
const handlers = require("../utilities/handlers");
const moment = require("moment");

class Service {
  constructor() {
    this.user = User;
  }

  async getDriverStatistics(req, res) {
    try {
      const user = req.user;
      const now = moment();

      const month = req.query.month || now.format("MM"); // default: current month
      const year = req.query.year || now.format("YYYY"); // default: current year

      const currentMonth = moment(`${year}-${month}-01`);
      const previousMonth = currentMonth.clone().subtract(1, "month");

      const startOfCurrentMonth = currentMonth.startOf("month").toDate();
      const endOfCurrentMonth = currentMonth.endOf("month").toDate();

      const startOfPreviousMonth = previousMonth.startOf("month").toDate();
      const endOfPreviousMonth = previousMonth.endOf("month").toDate();

      const [currentTotal, currentActive, currentInactive] = await Promise.all([
        this.user.countDocuments({
          role: "driver",
          fleetManagerId: user._id,
          createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth }
        }),
        this.user.countDocuments({
          role: "driver",
          fleetManagerId: user._id,
          isActive: true,
          createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth }
        }),
        this.user.countDocuments({
          role: "driver",
          fleetManagerId: user._id,
          isActive: false,
          createdAt: { $gte: startOfCurrentMonth, $lte: endOfCurrentMonth }
        })
      ]);

      const [lastTotal, lastActive, lastInactive] = await Promise.all([
        this.user.countDocuments({
          role: "driver",
          fleetManagerId: user._id,
          createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
        }),
        this.user.countDocuments({
          role: "driver",
          fleetManagerId: user._id,
          isActive: true,
          createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
        }),
        this.user.countDocuments({
          role: "driver",
          fleetManagerId: user._id,
          isActive: false,
          createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
        })
      ]);

      const getPercentageChange = (current, previous) => {
        if (previous === 0) return current === 0 ? 0 : 100;
        return Number(((current - previous) / previous) * 100).toFixed(2);
      };

      const statistics = {
        current: {
          totalDrivers: currentTotal,
          totalActiveDrivers: currentActive,
          totalInActiveDrivers: currentInactive
        },
        monthlyChangeFromLastMonth: {
          totalDrivers: getPercentageChange(currentTotal, lastTotal),
          totalActiveDrivers: getPercentageChange(currentActive, lastActive),
          totalInActiveDrivers: getPercentageChange(
            currentInactive,
            lastInactive
          )
        }
      };

      return handlers.response.success({
        res,
        message: "Driver statistics fetched successfully",
        data: statistics
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error.message || "Failed to fetch statistics"
      });
    }
  }

  async createDriver(req, res) {
    try {
      const user = req.user;

      const image = req.files?.["image"]?.[0]?.path;
      const drivingLicense = req.files?.["drivingLicense"]?.[0]?.path;

      const {
        firstName,
        lastName,
        email,
        vehiclePlateNumber,
        assignVin,
        password
      } = req.body;

      const fleetId = req.user._id;

      if (req.user.role !== "fleet-manager") {
        return handlers.response.unauthorized({
          res,
          message: "Only fleet accounts can create drivers"
        });
      }

      const existingDriver = await this.user.findOne({ email, role: "driver" });

      if (existingDriver) {
        return handlers.response.failed({
          res,
          message: "Email already in use"
        });
      }

      const newDriver = new this.user({
        image,
        firstName,
        lastName,
        email,
        vehiclePlateNumber,
        assignVin: assignVin, // convert if schema expects a Number
        password,
        drivingLicense,
        role: "driver",
        fleetManagerId: fleetId,
        driverBudget: 150
      });

      await newDriver.save();
      await newDriver.populate(userSchema.populate);

      return handlers.response.success({
        res,
        message: "Success",
        data: newDriver
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error
      });
    }
  }

  async updateDriver(req, res) {
    try {
      const fileImage = req.files?.["image"]?.[0]?.path;
      const fileDrivingLicense = req.files?.["drivingLicense"]?.[0]?.path;

      const {
        firstName,
        lastName,
        email,
        vehiclePlateNumber,
        assignVin,
        password
      } = req.body;

      const driverId = req.params.driverId;

      if (req.user.role !== "fleet-manager") {
        return handlers.response.unauthorized({
          res,
          message: "Only fleet accounts can update drivers"
        });
      }

      const driver = await this.user.findOne({
        _id: driverId,
        fleetManagerId: req.user._id,
        role: "driver"
      });

      if (!driver) {
        return handlers.response.failed({
          res,
          message: "Driver not found or does not belong to your fleet"
        });
      }

      if (fileImage) driver.image = fileImage;
      if (firstName) driver.firstName = firstName;
      if (lastName) driver.lastName = lastName;
      if (email) driver.email = email;
      if (vehiclePlateNumber) driver.vehiclePlateNumber = vehiclePlateNumber;
      if (assignVin) driver.assignVin = assignVin;
      if (password) driver.password = password;
      if (fileDrivingLicense) driver.drivingLicense = fileDrivingLicense;

      await driver.save();

      return handlers.response.success({
        res,
        message: "Driver updated successfully",
        data: driver
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error
      });
    }
  }

  async deleteDriver(req, res) {
    try {
      const driverId = req.params.driverId;

      if (req.user.role !== "fleet-manager") {
        return handlers.response.unauthorized({
          res,
          message: "Only fleet accounts can delete drivers"
        });
      }

      const driver = await this.user.findOne({
        _id: driverId,
        fleetManagerId: req.user._id,
        role: "driver"
      });

      if (!driver) {
        return handlers.response.failed({
          res,
          message: "Driver not found or does not belong to your fleet"
        });
      }

      await this.user.deleteOne({ _id: driver._id });

      return handlers.response.success({
        res,
        message: "Driver deleted successfully"
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: error
      });
    }
  }

  async getDrivers(req, res) {
    try {
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
        role: "driver",
        fleetManagerId: req.user._id,
        ...filters,
        ...searchFilter
      };

      const users = await this.user
        .find(filterConditions)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate(userSchema.populate);

      const totalUsers = await this.user.countDocuments(filterConditions);

      return handlers.response.success({
        res,
        message: "Users retrieved successfully",
        data: {
          results: users,
          totalRecords: totalUsers,
          totalPages: Math.ceil(totalUsers / limit),
          currentPage: Number(page),
          pageSize: Number(limit)
        }
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: "Failed to retrieve users"
      });
    }
  }

  async allocateBudget(req, res) {
    try {
      const { budget } = req.body;
      const driverId = req.params.driverId;

      if (req.user.role !== "fleet-manager") {
        return handlers.response.unauthorized({
          res,
          message: "Only fleet accounts can allocate budget to drivers"
        });
      }

      const driver = await this.user.findOne({
        _id: driverId,
        fleetManagerId: req.user._id,
        role: "driver"
      });

      if (!driver) {
        return handlers.response.failed({
          res,
          message: "Driver not found or does not belong to your fleet"
        });
      }

      driver.driverBudget = Number(budget) + driver.driverBudget;

      await driver.save();

      return handlers.response.success({
        res,
        message: "Budget allocated successfully",
        data: driver
      });
    } catch (error) {
      return handlers.response.error({
        res,
        message: "Failed to allocate budget to driver"
      });
    }
  }
}

module.exports = new Service();
