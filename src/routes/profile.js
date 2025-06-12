const router = require("express").Router();

const controller = require("../controllers/profile");
const upload = require("../middlewares/multer");

const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "drivingLicense", maxCount: 1 },
  { name: "businessLogo", maxCount: 1 }
]);

router.post("/me", uploadFields, controller.editMyProfile.bind(controller));

router.get("/me", controller.getMyProfile.bind(controller));

module.exports = router;
