const router = require("express").Router();

const controller = require("../controllers/product");
const upload = require("../middlewares/multer");

const uploadFields = upload.fields([{ name: "media" }]);

router.post("/", uploadFields, controller.createProduct.bind(controller));

router.post(
  "/:productId",
  uploadFields,
  controller.updateProduct.bind(controller)
);

router.get("/", controller.getProducts.bind(controller));

router.get("/:productId", controller.getProductById.bind(controller));

router.delete("/:productId", controller.deleteProduct.bind(controller));

router.post(
  "/:productId/deactivate",
  controller.deactivateProduct.bind(controller)
);

router.post(
  "/:productId/activate",
  controller.activateProduct.bind(controller)
);

module.exports = router;
