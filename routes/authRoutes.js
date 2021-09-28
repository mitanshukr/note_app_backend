const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const mongoose = require("mongoose");

const User = require("../models/user");
const authController = require("../controllers/authController");

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().not().isEmpty(),
    body("password").not().isEmpty(),
  ],
  authController.postLogin
);

router.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Invalid Email.")
      .custom((value) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject("Email already Registered!");
          }
        });
      })
      .normalizeEmail(),
    body("password")
      .trim()
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 chars long.")
      .matches(/\d/)
      .withMessage("Password must contain a number."),
    body("firstName")
      .trim()
      .not()
      .isEmpty()
      .withMessage("Please provide First name."),
  ],
  authController.postSignup
);

router.post(
  "/forgot-password",
  body("email").isEmail().not().isEmpty().normalizeEmail(),
  authController.initForgotPassword
);

router.post("/reset-password", [
  body("userId").custom((value) => {
    return !mongoose.Types.ObjectId.isValid(value)
      ? Promise.reject("Invalid UserId! Make Sure the URL is Correct.")
      : Promise.resolve();
  }),
  body("resetToken")
    .trim()
    .not()
    .isEmpty()
    .withMessage("Please provide a Reset Token."),
  body("newPassword")
    .trim()
    .isLength({ min: 5 })
    .withMessage("Password must be at least 5 chars long.")
    .matches(/\d/)
    .withMessage("Password must contain a number."),
  authController.updatePassword,
]);

router.get(
  "/verify-email/:userId/:verificationToken",
  authController.getEmailVerified
);

module.exports = router;
