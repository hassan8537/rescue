const handlers = require("../utilities/handlers");

const checkAdminAccess = async (req, res, next) => {
  try {
    if (req.user && req.user.role === "admin") {
      return next();
    }

    return handlers.response.unauthorized({
      res,
      message: "You are not authorized to access this resource."
    });
  } catch (error) {
    return handlers.response.error({ res, message: error });
  }
};

module.exports = checkAdminAccess;
