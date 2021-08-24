const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

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
      .custom((value) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject("Email already Exists!");
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
    body("firstName").trim().not().isEmpty().withMessage("Please provide First name."),
  ],
  authController.postSignup
);

module.exports = router;
