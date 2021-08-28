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
