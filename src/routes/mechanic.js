const router = require("express").Router();

const controller = require("../controllers/mechanic");
const upload = require("../middlewares/multer");

const uploadFields = upload.fields([
  { name: "image" },
  { name: "mechanicCertification" }
]);

router.get("/statistics", controller.getMechanicStatistics.bind(controller));

router.post("/", uploadFields, controller.createMechanic.bind(controller));

router.post(
  "/:mechanicId",
  uploadFields,
  controller.updateMechanic.bind(controller)
);

router.get("/", controller.getMechanics.bind(controller));

router.get("/:mechanicId", controller.getMechanicById.bind(controller));

router.delete("/:mechanicId", controller.deleteMechanic.bind(controller));

router.post(
  "/:mechanicId/allocate-hourly-rate",
  controller.allocateHourlyRates.bind(controller)
);

module.exports = router;
