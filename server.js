const express = require('express')
const dotenv = require("dotenv")
const cors = require('cors')
const cookieParser = require('cookie-parser');
const {ConnectDb}=require("./config/dbconfig")
const Router = require("./router")
// const app = express();
const {app,server}= require("./Socket/socket")


dotenv.config();


// To handle CORS //
// Update CORS options to allow specific origin
// app.use(cors({
//     origin: 'http://3.110.28.248', // Your frontend origin
//     methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed methods
//     credentials: true, // To allow sending cookies or authentication tokens
// }));

app.use(cors())
// Use the cookie-parser middleware
app.use(cookieParser());

// To have parse json data //
app.use(express.json())
app.use(express.urlencoded({extended:true}));

// Set Middleware //

app.use("/api/v1" , Router)

// Define the PORT //
const PORT=process.env.PORT

//  DB Config //
ConnectDb()
.then(()=>{

    server.listen(PORT,()=>{
        console.log(`Server is Running On ${PORT}`)
    })
})

.catch((error)=>{
    console.error('Database connection failed:', error);
        process.exit(1); // Exit the process with failure
})
