const router = require("express").Router();

const controller = require("../controllers/content");

router.post("/", controller.createContent.bind(controller));

router.post("/:contentId", controller.updateContent.bind(controller));

router.get("/", controller.getContents.bind(controller));

router.delete("/:contentId", controller.deleteContent.bind(controller));

module.exports = router;
