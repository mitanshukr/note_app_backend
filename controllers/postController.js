const Post = require("../models/post");
const User = require("../models/user");
const mongoose = require("mongoose");

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
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const error = new Error("Invalid Post Id.");
    error.status = 400;
    throw error;
  }

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

exports.getFeed = (req, res, next) => {
  let leftOffId = req.query.leftOffId;
  const limit = +req.query.limit || 2;
  if (!mongoose.Types.ObjectId.isValid(leftOffId)) {
    leftOffId = "999999999999999999999999";
  }

  Post.find({ isPrivate: false })
    .sort({ createdAt: -1 })
    .where("_id")
    .lt(leftOffId)
    .limit(limit)
    .then((data) => {
      Post.countDocuments({ _id: { $lt: leftOffId }, isPrivate: false }).then(
        (count) => {
          res.status(200).json({
            posts: data,
            remaining: count - limit,
            leftOffId: data.slice(-1)[0]?._id,
          });
        }
      );
    })
    .catch((err) => {
      next(err);
    });
};

exports.getUserPosts = (req, res, next) => {
  let leftOffId = req.query.leftOffId;
  const limit = +req.query.limit || 2;
  const userId = req.params.userId;
  const privateFlag = req.query.private === "true";

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error("Invalid User Id.");
    error.status = 400;
    throw error;
  }
  if (!mongoose.Types.ObjectId.isValid(leftOffId)) {
    leftOffId = "999999999999999999999999";
  }
  let filter = {
    isPrivate: false,
    "creator._id": userId,
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
    .sort({ createdAt: -1 })
    .where("_id")
    .lt(leftOffId)
    .limit(limit)
    .then((data) => {
      filter["_id"] = { $lt: leftOffId };
      Post.countDocuments(filter).then((count) => {
        res.status(200).json({
          posts: data,
          remaining: count - limit,
          leftOffId: data.slice(-1)[0]?._id,
        });
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.getSinglePost = (req, res, next) => {
  const postId = req.params.postId;
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const error = new Error("Invalid Post Id.");
    error.status = 400;
    throw error;
  }
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
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    const error = new Error("Invalid Post Id.");
    error.status = 400;
    throw error;
  }
  Post.findOne({ _id: postId, isPrivate: true })
    .then((post) => {
      if (!post) {
        return res.status(404).json({ message: "No Post Found!" });
      }
      if (post.creator?._id.toString() !== req.userId.toString()) {
        const error = new Error("403 : Forbidden");
        error.status = 403;
        throw error;
      } else res.status(200).json(post);
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
      } else {
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

exports.getLikedPosts = (req, res, next) => {
  if (req.params.username[0] !== "@") {
    const error = new Error("Invalid Username. Please add prefix @");
    error.status = 422;
    throw error;
  }
  let leftOffId = req.query.leftOffId;
  const limit = +req.query.limit || 2;
  const username = req.params.username.slice(1);
  let filter = null;

  if (!mongoose.Types.ObjectId.isValid(leftOffId)) {
    leftOffId = "999999999999999999999999";
  }

  User.findOne({ userName: username })
    .then((user) => {
      if (!user) {
        const error = new Error("User not Found");
        error.status = 404;
        throw error;
      }
      filter = { _id: { $in: user.likes }, isPrivate: false };
      return Post.find(filter)
        .sort({ createdAt: -1 })
        .where("_id")
        .lt(leftOffId)
        .limit(limit);
    })
    .then((data) => {
      filter["_id"] = { ...filter["_id"], $lt: leftOffId };
      Post.countDocuments(filter).then((count) => {
        res.status(200).json({
          posts: data,
          remaining: count - limit,
          leftOffId: data.slice(-1)[0]?._id,
        });
      });
    })
    .catch((err) => {
      next(err);
    });
};

exports.getPublicPostsByUsername = (req, res, next) => {
  if (req.params.username[0] !== "@") {
    const error = new Error("Invalid Username. Please add prefix @");
    error.status = 422;
    throw error;
  }
  const username = req.params.username.slice(1);
  let leftOffId = req.query.leftOffId;
  const limit = +req.query.limit || 2;
  let filter = null;
  if (!mongoose.Types.ObjectId.isValid(leftOffId)) {
    leftOffId = "999999999999999999999999";
  }

  User.findOne({ userName: username })
    .then((user) => {
      if (!user) {
        const error = new Error("User not Found");
        error.status = 404;
        throw error;
      }
      filter = { "creator._id": user._id, isPrivate: false };
      return Post.find(filter)
        .sort({ createdAt: -1 })
        .where("_id")
        .lt(leftOffId)
        .limit(limit);
    })
    .then((data) => {
      filter["_id"] = { $lt: leftOffId };
      Post.countDocuments(filter).then((count) => {
        res.status(200).json({
          posts: data,
          remaining: count - limit,
          leftOffId: data.slice(-1)[0]?._id,
        });
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
      user.save();
      return Post.findOne({ _id: postId });
    })
    .then((post) => {
      const userIdIndex = post.savedby.findIndex((userId) => {
        return req.userId.toString() === userId.toString();
      });
      if (postSaved && userIdIndex < 0) {
        post.savedby.push(req.userId);
      } else if (!postSaved && userIdIndex >= 0) {
        post.savedby.splice(userIdIndex, 1);
      }
      return post.save();
    })
    .then((post) => {
      res.status(202).json({
        postSaved: postSaved,
        message: message,
        postId: postId,
        userId: req.userId,
      });
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
};

exports.getSavedPosts = (req, res, next) => {
  let leftOffId = req.query.leftOffId;
  const limit = +req.query.limit || 2;
  let filter = null;
  if (!mongoose.Types.ObjectId.isValid(leftOffId)) {
    leftOffId = "999999999999999999999999";
  }
  // let savedPostsIds = [];
  User.findOne({ _id: req.userId })
    .then((user) => {
      // savedPostsIds = [...user.savedPosts];
      return [...user.savedPosts];
    })
    .then((savedPosts) => {
      filter = { _id: { $in: savedPosts } };
      return Post.find(filter)
        .sort({ createdAt: -1 })
        .where("_id")
        .lt(leftOffId)
        .limit(limit);
    })
    .then((data) => {
      // data.sort((a, b) => {
      //   return savedPostsIds.indexOf(a._id.toString()) - savedPostsIds.indexOf(b._id.toString());
      // });
      filter["_id"] = { ...filter["_id"], $lt: leftOffId };
      Post.countDocuments(filter).then((count) => {
        res.status(200).json({
          posts: data,
          remaining: count - limit,
          leftOffId: data.slice(-1)[0]?._id,
        });
      });
    })
    .catch((err) => {
      console.log(err);
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
