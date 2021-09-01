const User = require("../models/user");

exports.getUser = (req, res, next) => {
  const userId = req.params.userId;
  User.findOne({ _id: userId })
    .then((user) => {
      res.status(200).json({
        userId: user._id,
        userName: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        savedPosts: user.savedPosts,
        isEmailVerified: user.isEmailVerified,
      });
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
