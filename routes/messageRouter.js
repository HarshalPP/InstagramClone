const express = require("express")
const router = express.Router()
const {SendMessage, getMessage,DeleteMessage,getMessageById} = require("../controller/messageController")
const {isAuthenticated} =  require("../middleware/AuthticationMiddleware")
const multer = require('multer')
const storage = multer.memoryStorage();

const Upload = multer({
    storage: storage,  // Store file in memory
    limits: { fileSize: 5000000 },  // Optional: Limit file size (example: 5MB)
  })

  router.post("/send/:id", Upload.fields([
    { name: 'image', maxCount: 10 },
    { name: 'video', maxCount: 5 }
]), isAuthenticated, SendMessage);

router.post("/send/group/:groupId" ,isAuthenticated, SendMessage )

router.get("/all/:id" , isAuthenticated , getMessage )

router.delete("/deleteall" , isAuthenticated , DeleteMessage)
router.get("/getMessageById/:id"  , isAuthenticated ,  getMessageById)



module.exports = router;