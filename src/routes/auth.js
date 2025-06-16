const router = require("express").Router();

const controller = require("../controllers/auth");

router.post("/signup", controller.signUp.bind(controller));

router.post("/signin", controller.signIn.bind(controller));

router.post("/forgotpassword", controller.forgotPassword.bind(controller));

router.post("/resetpassword", controller.resetPassword.bind(controller));

module.exports = router;
