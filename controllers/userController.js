const User = require("../models/user");
// const mongoose = require("mongoose");

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
  if (req.params.username[0] !== "@") {
    const error = new Error("Invalid Username. Please add prefix @");
    error.status = 422;
    throw error;
  }
  const username = req.params.username.slice(1);
  User.findOne({ userName: username })
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
