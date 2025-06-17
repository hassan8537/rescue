const router = require("express").Router();

const controller = require("../controllers/job");

router.get("/", controller.getJobs.bind(controller));

router.get("/:jobId", controller.getJobById.bind(controller));

module.exports = router;
