const User = require("../models/User");
const bcrypt = require("bcrypt");
const handlers = require("../utilities/handlers");

const adminSeeder = async (req, res, next) => {
  try {
    if (await User.findOne({ role: "admin" })) {
      handlers.logger.failed({ message: "Admin user already exists" });
      return next();
    }

    const adminUser = new User({
      firstName: "Super",
      lastName: "Admin",
      email: "admin@rigrescue.com",
      phoneNumber: "+(1)555-555-5555",
      password: await bcrypt.hash("Admin@123", 10),
      role: "admin",
      isVerified: true,
      isProfileCompleted: true
    });

    await adminUser.save();

    handlers.logger.failed({ message: "Admin user created successfully" });
    return next();
  } catch (error) {
    return handlers.response.failed({
      res,
      message: error
    });
  }
};

module.exports = adminSeeder;
