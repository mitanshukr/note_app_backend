const Post = require("../models/post");

exports.createPost = (req, res, next) => {
  const newPost = new Post({
    ...req.body,
  });
  newPost
    .save()
    .then((response) => {
      res.status(201).json({
        message: "New Post Created Successfully!",
        data: response,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.getFeed = (req, res, next) => {
  Post.find({ isPrivate: false })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      next(err);
    });
};

exports.getUserPosts = (req, res, next) => {
  const userId = req.params.userId;
  const privateFlag = req.query.private === "true";
  let filter = {
    "creator._id": userId,
    isPrivate: false,
  };
  if (privateFlag) {
    if (userId !== req.userId) {
      const error = new Error("403: Forbidden");
      error.status = 403;
      throw error;
    }
    filter = {
      "creator._id": userId,
    };
  }

  Post.find(filter)
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      next(err);
    });
};

exports.getSinglePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findOne({ _id: postId, isPrivate: false })
    .then((data) => {
      res.status(200).json(data);
    })
    .catch((err) => {
      next(err);
    });
};

exports.getSinglePrivatePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findOne({ _id: postId, isPrivate: true })
    .then((data) => {
      if (data.creator._id.toString() !== req.userId.toString()) {
        const error = new Error("403 : Forbidden");
        error.status = 403;
        throw error;
      }
      res.status(200).json(data);
    })
    .catch((err) => {
      next(err);
    });
};
