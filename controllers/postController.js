const Post = require("../models/post");
const User = require("../models/user");

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

exports.editPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findOneAndUpdate({ _id: postId, "creator._id": req.userId }, req.body, {
    new: true,
  })
    .then((data) => {
      if (!data) {
        const error = new Error("403: Forbidden");
        error.status = 403;
        throw error;
      } else {
        res.status(204).json(data);
      }
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

exports.postLike = (req, res, next) => {
  const postId = req.params.postId;
  const userId = req.userId;
  let message = null;
  let likeStatus = null;
  Post.findOne({ _id: postId })
    .then((post) => {
      const userIdIndex = post.likes.findIndex(
        (id) => id.toString() === userId.toString()
      );
      if (userIdIndex >= 0) {
        post.likes.splice(userIdIndex, 1);
        likeStatus = false;
      } else {
        post.likes.push(userId);
        likeStatus = true;
      }
      post.save();
      return User.findOne({ _id: userId });
    })
    .then((user) => {
      const postIdIndex = user.likes.findIndex(
        (id) => id.toString() === postId.toString()
      );
      if (likeStatus) {
        message = "Post liked Successfully!";
        if (postIdIndex < 0) {
          user.likes.push(postId);
        }
      } else if (!likeStatus) {
        message = "Post like removed Successfully!";
        if (postIdIndex >= 0) {
          user.likes.splice(postIdIndex, 1);
        }
      }
      return user.save();
    })
    .then(() => {
      res.status(202).json({
        message: message,
        likeStatus: likeStatus,
        postId: postId,
        userId: userId,
      });
    })
    .catch((err) => {
      next(err);
    });
};
