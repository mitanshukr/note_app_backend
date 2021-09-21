const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: "String",
      required: true,
    },
    excerpt: {
      type: "String",
    },
    body: {
      type: "String",
      required: true,
    },
    tags: {
      type: ["String"],
    },
    isPrivate: {
      type: "Boolean",
      required: true,
    },
    likes: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    ],
    viewCount: { type: "Number", default: 0 },
    creator: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: { type: String, ref: "User" },
      firstName: { type: String, ref: "User" },
      lastName: { type: String, ref: "User" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
