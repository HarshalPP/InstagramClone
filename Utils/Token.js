const User = require("../models/User")

// Genertate the Token 
exports.sendToken = async(user , statusCode , res)=>{
    try{

        const token = user.getSignedToken();
        const data = await User.findByIdAndUpdate(user._id , {activeToken:token}, {new:true})

          // Set the token in a cookie
          res.cookie('token', token, {
            httpOnly: true, // Helps prevent XSS attacks
            secure: true,
            maxAge: 24 * 60 * 60 * 1000  // 1 day in milliseconds (you can adjust the expiration time)
        });

        return res.status(statusCode).json({
            success:true,
            user
        })

        

    }
    catch(error){
        return res.status(500).json({
            success: false,
            error: 'An error occurred while sending the token.',
          });
    }
}