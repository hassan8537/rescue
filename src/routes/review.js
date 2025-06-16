const router = require("express").Router();

const controller = require("../controllers/review");

router.get("/:userId", controller.getReviews.bind(controller));

router.post("/", controller.createReview.bind(controller));

module.exports = router;
