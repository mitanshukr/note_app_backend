const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
  },
  about: {
    type: String,
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null }],
  savedPosts: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
  ],
  resetToken: {
    type: String,
    default: null,
  },
  resetTokenExpiry: { type: Date },
  isEmailVerified: Boolean,
  verificationToken: { type: String },
});

module.exports = mongoose.model("User", userSchema);
