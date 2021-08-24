const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: "String",
      required: true,
    },
    excerpt: {
      type: "String",
      required: true,
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
    creator: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      email: { type: String, ref: "User" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
