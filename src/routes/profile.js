const router = require("express").Router();

const controller = require("../controllers/profile");
const upload = require("../middlewares/multer");

const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "drivingLicense", maxCount: 1 },
  { name: "businessLogo", maxCount: 1 },
  { name: "mechanicCertification", maxCount: 1 }
]);

router.post(
  "/me/setup",
  uploadFields,
  controller.setUpMyProfile.bind(controller)
);

router.post("/me", uploadFields, controller.editMyProfile.bind(controller));

router.get("/me", controller.getMyProfile.bind(controller));

router.get("/admin", controller.getAdmin.bind(controller));

router.post("/:me/changepassword", controller.changePassword.bind(controller));

router.post(
  "/:userId/deactivate",
  controller.deactivateAccount.bind(controller)
);

router.post("/:userId/activate", controller.activateAccount.bind(controller));

module.exports = router;
