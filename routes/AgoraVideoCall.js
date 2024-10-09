const express = require("express")
const router = express.Router()
const {joinRoom} = require("../controller/videoCallController")
const {isAuthenticated} = require("../middleware/AuthticationMiddleware")


// Make a Post method to join the Video call //

router.post("/Join-room" , isAuthenticated , joinRoom)



module.exports = router;