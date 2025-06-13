const router = require("express").Router();

const controller = require("../controllers/account");

router.post("/", controller.addAccount.bind(controller));

router.post("/:stripeCardId", controller.removeAccount.bind(controller));

router.get("/", controller.getAccounts.bind(controller));

router.post("/:stripeCardId", controller.setDefaultAccount.bind(controller));

module.exports = router;
