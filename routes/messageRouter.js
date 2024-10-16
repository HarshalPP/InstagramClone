const express = require("express")
const router = express.Router()
const {SendMessage, getMessage} = require("../controller/messageController")
const {isAuthenticated} =  require("../middleware/AuthticationMiddleware")
const multer = require('multer')
const storage = multer.memoryStorage();

const Upload = multer({
    storage: storage,  // Store file in memory
    limits: { fileSize: 5000000 },  // Optional: Limit file size (example: 5MB)
  })

router.post("/send/:id", Upload.array('image', 10) , isAuthenticated , SendMessage)
router.get("/all/:id" , isAuthenticated , getMessage )


module.exports = router;