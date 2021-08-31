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
      if (!data) res.status(404).json({ message: "No Post Found!" });
      else res.status(200).json(data);
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
      if (!data) res.status(404).json({ message: "No Post Found!" });
      else res.status(200).json(data);
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

exports.postView = (req, res, next) => {
  const postId = req.params.postId;
  Post.findOne({ _id: postId })
    .then((post) => {
      post.viewCount++;
      return post.save();
    })
    .then((response) => {
      res.status(204).json({
        message: "View Added",
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.savePost = (req, res, next) => {
  const postId = req.params.postId;
  let postSaved = null;
  let message = null;
  User.findOne({ _id: req.userId })
    .then((user) => {
      const postIdIndex = user.savedPosts.findIndex(
        (id) => id.toString() === postId.toString()
      );
      if (postIdIndex >= 0) {
        user.savedPosts.splice(postIdIndex, 1);
        postSaved = false;
        message = "Post removed from Saved Items.";
      } else {
        user.savedPosts.push(postId);
        postSaved = true;
        message = "Post added to Saved Items.";
      }
      return user.save();
    })
    .then((user) => {
      res.status(202).json({
        postSaved: postSaved,
        message: message,
        postId: postId,
        userId: req.userId,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.getSavedPosts = (req, res, next) => {
  User.findOne({ _id: req.userId })
    .then((user) => {
      return [...user.savedPosts];
    })
    .then((savedPosts) => {
      Post.find({ _id: { $in: savedPosts } }).then((posts) => {
        res.status(200).json(posts);
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findOneAndDelete({ _id: postId, "creator._id": req.userId })
    .then((deletedPost) => {
      if (!deletedPost)
        res
          .status(403)
          .json({ message: "No Post Found or Unauthentic request." });
      else
        return User.find({
          $or: [
            { likes: { $in: [deletedPost._id] } },
            { savedPosts: { $in: [deletedPost._id] } },
          ],
        });
    })
    .then((users) => {
      if (!users || users?.length === 0) return;
      users.forEach((user) => {
        let postIdIndex = user.likes.findIndex(
          (p_id) => p_id.toString() === postId.toString()
        );
        if (postIdIndex !== -1) {
          user.likes.splice(postIdIndex, 1);
        }
        postIdIndex = user.savedPosts.findIndex(
          (p_id) => p_id.toString() === postId.toString()
        );
        if (postIdIndex !== -1) {
          user.savedPosts.splice(postIdIndex, 1);
        }
        user.save();
      });
    })
    .then(() => {
      res.status(204).json({
        status: 204,
        message: `Post: {${postId}} deleted successfully!`,
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.getLikedPosts = (req, res, next) => {
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
      return Post.find({ _id: { $in: user.likes }, isPrivate: false });
    })
    .then((posts) => {
      res.status(200).json(posts);
    })
    .catch((err) => {
      next(err);
    });
};

exports.getPublicPosts = (req, res, next) => {
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
      return Post.find({ "creator._id": user._id, isPrivate: false });
    })
    .then((posts) => {
      res.status(200).json(posts);
    })
    .catch((err) => {
      next(err);
    });
};
