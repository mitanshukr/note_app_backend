const crypto = require("crypto");
const mongoose = require("mongoose");
const transport = require("../middleware/mailer-sendgrid");
const User = require("../models/user");

exports.getUser = (req, res, next) => {
  const userId = req.params.userId;
  const detailedInfo = req.query.detailedInfo === "true";

  if (userId !== req.userId) {
    const error = new Error("403 : Forbidden");
    error.status = 403;
    throw error;
  }

  User.findOne({ _id: userId })
    .then((user) => {
      if (!user) {
        const error = new Error("User not Found");
        error.status = 404;
        throw error;
      }
      const userData = {
        userId: user._id,
        userName: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
      };
      if (detailedInfo) {
        res.status(200).json({
          ...userData,
          profession: user.profession,
          about: user.about,
          contact: user.contact,
          birthdate: user.birthdate,
          address: user.address,
          city: user.city,
          state: user.state,
          pinCode: user.pinCode,
          country: user.country,
        });
      } else {
        res.status(200).json(userData);
      }
    })
    .catch((err) => {
      next(err);
    });
};

exports.getUserByUsername = (req, res, next) => {
  let userName = req.params.username;
  if (userName[0] === "@") {
    userName = userName.substring(1);
  }

  User.findOne({ userName: userName })
    .then((user) => {
      if (!user) {
        const error = new Error("User not Found");
        error.status = 404;
        throw error;
      }
      res.status(200).json({
        userId: user._id,
        userName: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        about: user.about,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.updateUserInfo = (req, res, next) => {
  const userId = req.params.userId;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid User Id.");
    error.status = 400;
    throw error;
  }
  if (userId !== req.userId) {
    const error = new Error("403 : Forbidden");
    error.status = 403;
    throw error;
  }

  User.findOneAndUpdate({ _id: userId }, req.body, {
    new: true,
  })
    .then((data) => {
      if (!data) {
        const error = new Error("User Not Found");
        error.status = 404;
        throw error;
      } else {
        res.status(204).json(data);
      }
    })
    .catch((err) => {
      next(err);
    });
};

exports.getUsernameAvailStatus = (req, res, next) => {
  let userName = req.params.username.toLowerCase();
  if (userName[0] === "@") {
    userName = userName.substring(1);
  }

  User.findOne({ userName: userName })
    .then((user) => {
      if (user) {
        res.status(200).json({
          userName: userName,
          status: false,
          message: "Username not available!",
        });
      } else {
        res.status(200).json({
          userName: userName,
          status: true,
          message: "Username Available!",
        });
      }
    })
    .catch((err) => {
      next(err);
    });
};

exports.sendEmailVerificationLink = (req, res, next) => {
  const userId = req.params.userId;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid User Id.");
    error.status = 400;
    throw error;
  }

  User.findOne({ _id: userId })
    .then((user) => {
      if (!user) {
        const error = new Error("No User Found!");
        error.status = 404;
        throw error;
      }
      if (user?.isEmailVerified) {
        return "already_verified";
      }
      user.isEmailVerified = false;
      user.verificationToken = crypto.randomBytes(32).toString("hex");
      user.verificationTokenExpiry = Date.now() + 21600 * 1000; // expiryIn: 6hrs (21600*1000 ms)
      return user.save();
    })
    .then((user) => {
      if (user === "already_verified") return { message: "already_verified" };
      else
        return transport.sendMail({
          to: user.email,
          from: process.env.SENDGRID_EMAIL,
          subject: "Email Verification Link - Immune Ink",
          html: `<p>Hi ${user.firstName},<br><br>
              We have received an Email Verification request for your Account
              registered with us. <a href="${
                process.env.FRONTEND_ROOT_URL
              }/verify-email/${user._id.toString()}/${
            user.verificationToken
          }">Please click here to verify your email.</a></p>
              <p>Please note that the above link is valid for one use only and expires after 6 hours. Make sure to use the latest link.</p>
              <br>
              <p>Regards,<br>Team Immune Ink</p><br>
              <hr>
          <small>Confidential. Please do not share. This email is sent to ${
            user.email
          }</small><br><br>
          <small>If you are not the intended recipient of this message, you are not authorized to read, print, retain, copy or disseminate any part of this message. If you have received this message in error, please destroy and delete all copies and notify the sender by return e-mail. Regardless of content, this e-mail shall not operate to bind Immune Ink Company or any of its affiliates to any order or other contract unless pursuant to explicit written agreement or government initiative expressly permitting the use of e-mail for such purpose.</small>`,
        });
    })
    .then((mailStatus) => {
      res.status(200).json(mailStatus);
    })
    .catch((err) => {
      next(err);
    });
};

exports.getEmailVerified = (req, res, next) => {
  const userId = req.params.userId;
  const verificationToken = req.params.verificationToken;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid User Id.");
    error.status = 400;
    throw error;
  }

  User.findOne({ _id: userId })
    .then((user) => {
      if (user?.isEmailVerified) {
        return {
          message: "already_verified",
          email: user?.email,
        };
      }
      if (!user || user?.verificationToken !== verificationToken) {
        const error = new Error("Invalid URL");
        error.status = 400;
        throw error;
      }
      if (user?.verificationTokenExpiry <= Date.now()) {
        const error = new Error("URL Expired.");
        error.status = 410;
        throw error;
      }
      user.isEmailVerified = true;
      user.verificationToken = null;
      user.verificationTokenExpiry = null;
      return user.save();
    })
    .then((data) => {
      res.status(200).json({
        status: 200,
        message: data?.isEmailVerified ? "success" : data?.message,
        email: data?.email,
      });
    })
    .catch((err) => {
      next(err);
    });
};

// exports.getBasicInfo = (req, res, next) => {
//   const userId = req.params.userId;
//   if (!mongoose.Types.ObjectId.isValid(userId)) {
//     const error = new Error("Invalid URL.");
//     error.status = 400;
//     throw error;
//   }

//   User.findOne({ _id: userId })
//     .then((user) => {
//       if (!user) {
//         const error = new Error("No User Found!");
//         error.status = 404;
//         throw error;
//       }
//       res.status(200).json({
//         userId: user._id,
//         userName: user.userName,
//         email: user.email,
//       });
//     })
//     .catch((err) => {
//       next(err);
//     });
// };
