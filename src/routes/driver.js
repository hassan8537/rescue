const router = require("express").Router();

const controller = require("../controllers/driver");
const upload = require("../middlewares/multer");

const uploadFields = upload.fields([
  { name: "image" },
  { name: "drivingLicense" }
]);

router.get("/statistics", controller.getDriverStatistics.bind(controller));

router.post("/", uploadFields, controller.createDriver.bind(controller));

router.post(
  "/:driverId",
  uploadFields,
  controller.updateDriver.bind(controller)
);

router.get("/", controller.getDrivers.bind(controller));

router.get("/:driverId", controller.getDriverById.bind(controller));

router.delete("/:driverId", controller.deleteDriver.bind(controller));

router.post(
  "/:driverId/allocate-budget",
  controller.allocateBudget.bind(controller)
);

module.exports = router;
