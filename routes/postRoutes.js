const express = require("express");
const router = express.Router();

const isAuth = require("../middleware/isAuth");
const postController = require("../controllers/postController");

router.post("/create", isAuth, postController.createPost);
router.delete("/delete/:postId", isAuth, postController.deletePost); // DELETE /delete/:postId

router.patch("/edit/:postId", isAuth, postController.editPost); // PATCH /edit/:postId

router.get("/feed/all", postController.getFeed); // GET /feed/all
router.get("/all/:userId", isAuth, postController.getUserPosts); // GET /all/:userId?private=true
router.get("/private/:postId", isAuth, postController.getSinglePrivatePost); // GET /private/:postId
router.get("/public/:postId", postController.getSinglePost); // GET /public/:postId

router.get("/togglelike/:postId", isAuth, postController.postLike);
router.get("/addview/:postId", postController.postView);
router.get("/togglesave/:postId", isAuth, postController.savePost);
router.get("/saveditems", isAuth, postController.getSavedPosts);

module.exports = router;
