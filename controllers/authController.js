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
        savedPosts: requestedUser.savedPosts,
        message:
          "Do not share the Token with anyone. Token is valid for 2 hours.",
      });
    })
    .catch((err) => {
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
      //TO-DO: send mail to registered email id with elcome message and veritification URL.
    })
    .catch((err) => {
      next(err);
    });
};

exports.initForgotPassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Input Validation Failed!");
    error.status = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("No User found with the provided Email.");
        error.status = 404;
        throw error;
      }
      user.resetToken = crypto.randomBytes(32).toString("hex");
      user.resetTokenExpiry = Date.now() + 3600 * 1000; // expiryIn: 1hr (3600*1000 ms)
      return user.save();
    })
    .then((user) => {
      // res.status(200).json(user);
      //TO-DO: send mail to registered email with reset URL.
      res.status(200).json({
        email: user.email,
        message: "Reset Link is sent to your Inbox. Valid for an Hour.",
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.updatePassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Input Validation Failed!");
    error.status = 422;
    error.data = errors.array();
    throw error;
  }

  const userId = req.body.userId;
  const resetToken = req.body.resetToken;
  const newPassword = req.body.newPassword;

  User.findOne({ _id: userId })
    .then((user) => {
      if (!user || user?.resetToken !== resetToken) {
        const error = new Error("Invalid URL! Make sure the URL is correct.");
        error.status = 400;
        throw error;
      }
      if (user.resetTokenExpiry <= Date.now()) {
        const error = new Error("Reset URL Expired.");
        error.status = 410;
        throw error;
      }
      return bcrypt
        .hash(newPassword, 12)
        .then((hashedPwd) => {
          user.password = hashedPwd;
          return user.save();
        })
        .catch((err) => {
          next(err);
        });
    })
    .then((updatedUser) => {
      //TO-DO: send mail to registered email with password change notification.
      res.status(200).json({
        message: "Password Updated Successfully!",
        userId: updatedUser._id,
        email: updatedUser.email,
      });
    })
    .catch((err) => {
      next(err);
    });
};
