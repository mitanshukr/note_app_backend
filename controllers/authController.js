const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const User = require("../models/user");
const { getRandomInt } = require("../utils/randomNumGenerator");

exports.postLogin = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Input Validation Failed!");
    error.status = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  let requestedUser = null;

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("A user with this email could not be found!");
        error.status = 401;
        throw error;
      }
      requestedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isPwdValid) => {
      if (!isPwdValid) {
        const error = new Error("The password is not valid!");
        error.status = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: requestedUser.email,
          userId: requestedUser._id.toString(),
          message:
            "Do not share the Token with anyone. Token is valid for 2 hours.",
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );
      res.status(200).json({
        authToken: token,
        expiresIn: 7200, //value in Seconds.
        userId: requestedUser._id,
        email: requestedUser.email,
        userName: requestedUser.userName,
        firstName: requestedUser.firstName,
        lastName: requestedUser.lastName,
        isEmailVerified: requestedUser.isEmailVerified,
        message:
          "Do not share the Token with anyone. Token is valid for 2 hours.",
      });
    })
    .catch((err) => {
      if (!err.status) {
        err.status = 500;
      }
      next(err);
    });
};

exports.postSignup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Input Validation Failed!");
    error.status = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const userName = email.split("@")[0] + getRandomInt(999, 99999);

  bcrypt
    .hash(password, 12)
    .then((hashedPwd) => {
      const newUser = new User({
        userName: userName,
        email: email,
        password: hashedPwd,
        firstName: firstName,
        lastName: lastName,
        isEmailVerified: false,
        verificationToken: crypto.randomBytes(32).toString("hex"),
      });
      return newUser.save();
    })
    .then((user) => {
      res.status(201).json({
        message: "Signup Successful!",
        verification: `Please follow the link sent to your inbox to verify your Email.`,
        data: {
          _id: user._id,
          userName: user.userName,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
        },
      });
      return user;
    })
    .then((user) => {
      console.log(user);
    })
    .catch((err) => {
      if (!err.status) {
        err.status = 500;
      }
      next(err);
    });
};
