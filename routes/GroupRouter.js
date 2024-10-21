const express = require('express')
const router = express.Router()
const{isAuthenticated} = require("../middleware/AuthticationMiddleware")
const {createGroup , fetchAllChats}=require("../controller/GroupController")



// MAKE A ROUTER //

router.post("/create" , isAuthenticated , createGroup)
router.get("/GroupChats" , isAuthenticated  , fetchAllChats)


module.exports=router