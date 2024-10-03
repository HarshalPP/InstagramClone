const express = require("express")
const router = express.Router()
const {SendMessage, getMessage} = require("../controller/messageController")
const {isAuthenticated} =  require("../middleware/AuthticationMiddleware")

router.post("/send/:id", isAuthenticated , SendMessage)
router.get("/all/:id" , isAuthenticated , getMessage )


module.exports = router;