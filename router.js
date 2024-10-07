const express = require("express")
const app = express()

const AuthRouter  = require("./routes/AuthRouter")
const PostRouter =require("./routes/PostRouter")
const ReelRouter = require("./routes/ReelsRouter")



 //  Define the Middleware //
 app.use("/Auth" , AuthRouter)
 app.use("/postAuth" , PostRouter)
 app.use("/Reels" , ReelRouter)


module.exports=app;