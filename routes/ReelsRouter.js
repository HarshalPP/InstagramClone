const express = require("express")
const router = express.Router()
const{CreateReels , LikedReels ,Comment_Reels,GetReel} = require("../controller/ReelController")
const multer = require('multer')
const storage = multer.memoryStorage();


const{isAuthenticated} = require("../middleware/AuthticationMiddleware")
const Upload = multer({
    storage: storage,  // Store file in memory
    limits: { fileSize: 50000000 },  // Optional: Limit file size (example: 50MB)
  })

router.post("/Create" ,  Upload.single('videoUrl') , isAuthenticated , CreateReels)
router.put("/LikeReels/:id" , isAuthenticated , LikedReels)
router.put("/Comment_Reels/:id" , isAuthenticated , Comment_Reels)
router.get("/GetReel" , GetReel)


module.exports = router;