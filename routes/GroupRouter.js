const express = require('express')
const router = express.Router()
const{isAuthenticated} = require("../middleware/AuthticationMiddleware")
const {createGroup}=require("../controller/GroupController")



// MAKE A ROUTER //

router.post("/create" , isAuthenticated , createGroup)


module.exports=router