const router = require("express").Router();
const controller = require("../controllers/order");
const authentication = require("../middlewares/authentication");

const middlewares = [authentication];

router.get("/", middlewares, controller.getOrders.bind(controller));

router.get("/:orderId", middlewares, controller.getOrderById.bind(controller));

module.exports = router;
