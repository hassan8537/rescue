const router = require("express").Router();

const controller = require("../controllers/upload");
const upload = require("../middlewares/multer");

const uploadFields = upload.fields([{ name: "files" }]);

router.post("/", uploadFields, controller.uploadFile.bind(controller));

module.exports = router;
