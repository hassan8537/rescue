const router = require("express").Router();

const controller = require("../controllers/booking");
const upload = require("../middlewares/multer");

const uploadFields = upload.fields([{ name: "issueImages" }]);

router.post(
  "/",
  uploadFields,
  controller.createEmergencyServiceBooking.bind(controller)
);

module.exports = router;
