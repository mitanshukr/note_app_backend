const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const isAuth = require("../middleware/isAuth");

router.get("/:userId", isAuth, userController.getUser);
router.get("/public/:username", userController.getUserByUsername);
router.patch("/update/:userId", isAuth, userController.updateUserInfo);

// router.get("/info/:userId", userController.getBasicInfo);
module.exports = router;
