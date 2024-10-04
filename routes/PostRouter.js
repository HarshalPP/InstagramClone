const express = require("express")
const router = express.Router();
const multer = require('multer')
const storage = multer.memoryStorage();


const{AddNewPost ,getPost , postUser , LikePost , DisLike , AddComment , getCommentofPost ,deletePost , Bookmark , Liked_Comment} = require("../controller/postController")


const{isAuthenticated} = require("../middleware/AuthticationMiddleware")
const Upload = multer({
    storage: storage,  // Store file in memory
    limits: { fileSize: 5000000 },  // Optional: Limit file size (example: 5MB)
  })


router.post("/post" , Upload.single('image') , isAuthenticated , AddNewPost)
router.get("/get" , getPost)
router.get("/FindPost" , isAuthenticated , postUser)
router.post("/Like/:id" , isAuthenticated , LikePost)
router.post("/Dislike/:id" , isAuthenticated , DisLike)
router.post("/AddComment/:id" , isAuthenticated , AddComment)
router.get("/getCommentofPost/:id" , isAuthenticated , getCommentofPost)
router.delete("/deletePost/:id" , isAuthenticated ,  deletePost)
router.post("/BookMark/:id" , isAuthenticated ,  Bookmark)
// router.get("/LikedComment/:id" , Liked_Comment)


module.exports = router;
