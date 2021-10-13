const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const isAuth = require("../middleware/isAuth");

router.get("/public/:username", userController.getUserByUsername);
router.patch("/update/:userId", isAuth, userController.updateUserInfo);
router.get("/:userId", isAuth, userController.getUser);
router.get(
  "/usernameavailabilitystatus/:username",
  isAuth,
  userController.getUsernameAvailStatus
);

router.get(
  "/send-email-verification/:userId",
  isAuth,
  userController.sendEmailVerificationLink
);
router.get(
  "/verify-email/:userId/:verificationToken",
  userController.getEmailVerified
);

// router.get("/info/:userId", userController.getBasicInfo);
module.exports = router;
