const express = require("express");
const router = express.Router();

const isAuth = require("../middleware/isAuth");
const postController = require("../controllers/postController");

router.post("/create", isAuth, postController.createPost);
// DELETE /delete/:postId

router.patch("/edit/:postId", isAuth, postController.editPost); // PATCH /edit/:postId

router.get("/feed/all", postController.getFeed); // GET /feed/all
router.get("/all/:userId", isAuth, postController.getUserPosts); // GET /all/:userId?private=true
router.get("/:postId", postController.getSinglePost); // GET /:postId
router.get("/private/:postId", isAuth, postController.getSinglePrivatePost); // GET /private/:postId

module.exports = router;