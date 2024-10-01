const express = require("express")
const app = express()

const AuthRouter  = require("./routes/AuthRouter")
const PostRouter =require("./routes/PostRouter")



 //  Define the Middleware //
 app.use("/Auth" , AuthRouter)
 app.use("/postAuth" , PostRouter)


module.exports=app;