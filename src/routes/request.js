const router = require("express").Router();

const controller = require("../controllers/request");

router.post("/budgets/send", controller.sendBudgetRequest.bind(controller));

router.post("/products/send", controller.sendProductRequest.bind(controller));

router.get("/budgets", controller.getBudgetRequests.bind(controller));

router.get("/products", controller.getProductRequests.bind(controller));

router.post(
  "/:requestId/budgets/approve",
  controller.approveBudgetRequest.bind(controller)
);

router.post(
  "/:requestId/budgets/reject",
  controller.rejectBudgetRequest.bind(controller)
);

module.exports = router;
