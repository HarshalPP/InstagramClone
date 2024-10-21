const express = require("express")
const app = express()

const AuthRouter  = require("./routes/AuthRouter")
const PostRouter =require("./routes/PostRouter")
const ReelRouter = require("./routes/ReelsRouter")
const VideoRouter = require("./routes/AgoraVideoCall")
const MessageRouter = require("./routes/messageRouter")
const groupRouter = require("./routes/GroupRouter")



 //  Define the Middleware //
 app.use("/Auth" , AuthRouter)
 app.use("/postAuth" , PostRouter)
 app.use("/Reels" , ReelRouter)
 app.use("/video" , VideoRouter)
 app.use("/message" , MessageRouter)
 app.use("/group" , groupRouter)


module.exports=app;