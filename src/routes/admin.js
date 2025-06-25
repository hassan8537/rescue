const router = require("express").Router();
const controller = require("../controllers/admin");
const authentication = require("../middlewares/authentication");
const checkAdminAccess = require("../middlewares/check-admin-access");

router.post("/auth/signin", controller.signIn.bind(controller));

const middlewares = [authentication, checkAdminAccess];

// Users
router.get("/users", middlewares, controller.getUsers.bind(controller));

// Accounts
router.get("/accounts", middlewares, controller.getAccounts.bind(controller));

// Bookings
router.get("/bookings", middlewares, controller.getBookings.bind(controller));

// Chats
router.get("/chats", middlewares, controller.getChats.bind(controller));

// Contents
router.get("/contents", middlewares, controller.getContents.bind(controller));

// OTPs
router.get("/otps", middlewares, controller.getOtps.bind(controller));

// Notifications
router.get(
  "/notifications",
  middlewares,
  controller.getNotifications.bind(controller)
);

// Products
router.get("/products", middlewares, controller.getProducts.bind(controller));

// Quotes
router.get("/quotes", middlewares, controller.getQuotes.bind(controller));

// Requests
router.get("/requests", middlewares, controller.getRequests.bind(controller));

// Reviews
router.get("/reviews", middlewares, controller.getReviews.bind(controller));

module.exports = router;
