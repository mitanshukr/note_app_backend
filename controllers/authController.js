const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const transport = require("../middleware/mailer-sendgrid");
const mongoose = require("mongoose");

const User = require("../models/user");
const { getRandomInt } = require("../utils/randomNumGenerator");
const { capitalize } = require("../utils/getStringCapitalized");

exports.postLogin = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Invalid Input!");
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
        const error = new Error("No User found with this Email.");
        error.status = 404;
        throw error;
      }
      requestedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isPwdValid) => {
      if (!isPwdValid) {
        const error = new Error("The password is incorrect.");
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
    errors.array().forEach((error) => {
      if (error.param === "email") {
        const err = new Error(error.msg);
        err.status = 409;
        err.data = errors.array();
        throw err;
      }
    });
    const error = new Error("Input Validation Failed!");
    error.status = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  const firstName = capitalize(req.body.firstName);
  const lastName = capitalize(req.body.lastName);
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
        verificationTokenExpiry: Date.now() + 21600 * 1000, // expiryIn: 6hrs (21600*1000 ms)
      });
      return newUser.save().then((user) => {
        return transport.sendMail({
          to: user.email,
          from: process.env.SENDGRID_EMAIL,
          subject: "Welcome to Immune Ink :)",
          html: `<p>Hi ${user.firstName},<br><br>
                We are delighted to see you join us.</p>
                  <p><a href="${
                    process.env.FRONTEND_ROOT_URL
                  }/verify-email/${user._id.toString()}/${
            user.verificationToken
          }">Please click here to verify your email.</a></p>
                  <p>We wish you a great journey ahead!</p>
                  <small>Confidential. Please do not share.</small>`,
        });
      });
    })
    .then((mailStatus) => {
      res.status(201).json({
        message: "Signup Successful!",
        emailStatus: mailStatus?.message,
        verification: `Please follow the link sent to your inbox to verify your Email.`,
        data: {
          userName: userName,
          email: email,
          firstName: firstName,
          lastName: lastName,
          isEmailVerified: false,
        },
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.sendPasswordResetLink = (req, res, next) => {
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
        const error = new Error("No User found with this Email.");
        error.status = 404;
        throw error;
      }
      user.resetToken = crypto.randomBytes(32).toString("hex");
      user.resetTokenExpiry = Date.now() + 3600 * 1000; // expiryIn: 1hr (3600*1000 ms)
      return user.save().then((user) => {
        return transport.sendMail({
          to: user.email,
          from: process.env.SENDGRID_EMAIL,
          subject: "Password Reset Link - Immune Ink",
          html: `<p>Hi ${user.firstName},<br><br>
              We have received a Password Reset request for your Account
              registered with us. Please find the Password Reset link below. Click on the link to reset your password.</p>
                  <p><a href="${
                    process.env.FRONTEND_ROOT_URL
                  }/reset-password/${user._id.toString()}/${
            user.resetToken
          }?email=${
            user.email
          }">Please click here to set a new Password.</a></p>
          <p>Please note that the above link is valid for one use only and expires after 1 hour. Make sure to use the latest link.</p>
          <small><i>If you did not send the request then Please ignore this mail, and immediately change your Password.</i></small>
              <br>
              <p>Regards,<br>Team Immune Ink</p><br>
          <hr>
          <small>Confidential. Please do not share. This email is sent to ${
            user.email
          }</small><br><br>
          <small>If you are not the intended recipient of this message, you are not authorized to read, print, retain, copy or disseminate any part of this message. If you have received this message in error, please destroy and delete all copies and notify the sender by return e-mail. Regardless of content, this e-mail shall not operate to bind Immune Ink Company or any of its affiliates to any order or other contract unless pursuant to explicit written agreement or government initiative expressly permitting the use of e-mail for such purpose.</small>`,
        });
      });
    })
    .then((mailStatus) => {
      res.status(200).json(mailStatus);
    })
    .catch((err) => {
      next(err);
    });
};

exports.resetPassword = (req, res, next) => {
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

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid URL! Make sure the URL is correct.");
    error.status = 400;
    throw error;
  }

  User.findOne({ _id: userId })
    .then((user) => {
      if (!user || user?.resetToken !== resetToken) {
        const error = new Error(
          "Invalid URL! Make sure to use the latest link."
        );
        error.status = 400;
        throw error;
      }
      if (user.resetTokenExpiry <= Date.now()) {
        const error = new Error("URL Expired.");
        error.status = 410;
        throw error;
      }
      return bcrypt
        .hash(newPassword, 12)
        .then((hashedPwd) => {
          user.password = hashedPwd;
          user.resetToken = null;
          user.resetTokenExpiry = null;
          return user.save();
        })
        .catch((err) => {
          next(err);
        });
    })
    .then((updatedUser) => {
      res.status(200).json({
        message: "Password Updated Successfully!",
        status: "SUCCESS",
        userId: updatedUser._id,
        email: updatedUser.email,
      });
      return transport.sendMail({
        to: updatedUser.email,
        from: process.env.SENDGRID_EMAIL,
        subject: "Password updated Successfully!",
        html: `<h3>Hi ${updatedUser.firstName},</h3>
              <p>Your Password is successfully updated/changed.</p><br>
              <p>Thank you,<br>Team Immune Ink.</p>
              <hr>
              <small>If you did not change your password, then immediately report to us.</small>`,
      });
    })
    .catch((err) => {
      next(err);
    });
};
