const router = require("express").Router();

const controller = require("../controllers/booking");
const upload = require("../middlewares/multer");

const uploadFields = upload.fields([{ name: "issueImages" }]);

router.post("/", uploadFields, controller.createBooking.bind(controller));

router.post("/:bookingId/cancel", controller.cancelBooking.bind(controller));

router.get("/", controller.getBookings.bind(controller));

router.get("/:bookingId", controller.getBookingById.bind(controller));

module.exports = router;
