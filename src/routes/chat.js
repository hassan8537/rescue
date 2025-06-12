const router = require("express").Router();

const controller = require("../controllers/chat");

router.get("/inbox", controller.getInbox.bind(controller));

module.exports = router;
