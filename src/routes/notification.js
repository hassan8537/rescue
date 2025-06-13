const router = require("express").Router();

const controller = require("../controllers/notification");

router.post("/toggle", controller.toggleNotifications.bind(controller));

module.exports = router;
