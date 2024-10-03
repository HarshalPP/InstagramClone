const User = require("../models/User")
const Post = require("../models/Post")
const { sendToken } = require("../Utils/Token")
const jwt = require('jsonwebtoken')
const csv = require('csv-parser');  // Assuming you're using CSV data
const crypto = require('crypto');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { Readable } = require('stream');
const { sendPasswordSetupEmail } = require('../Utils/passwordUtils');
const pusher = require('../config/pusher');
const {getDataUri} = require("../Utils/datauri")
const ms = require('ms'); // Importing ms package


// Clouninary Config //

const cloudinary = require('cloudinary').v2; // Correct Cloudinary v2 import
const dotenv = require('dotenv');
dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});




//   Register the Users //
exports.Register = async (req, res) => {
    try {
        const { Username, email, password, bio , gender} = req.body;
        const profilePicture = req.file;

        let cloudResponse;
        if (profilePicture) {
          const fileUri = getDataUri(profilePicture)
          cloudResponse = await cloudinary.uploader.upload(fileUri); // Corrected Cloudinary upload
        }

        if(!cloudResponse){
         res.status(404).json('Please Upload the Profile Image')
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                error: 'User with this email already exists'
            });
        }



        // Create a new user instance
        const Signup = new User({
            Username,
            email,
            password,
            profilePicture:cloudResponse.secure_url,
            bio,
            gender
        });

        // Save user to the database
        const Result = await Signup.save();

        // calculte total Expiry time 

        const jwtExpireduration = process.env.JWT_EXPIRE || '1d'
        const expirationData = new Date(Date.now() + ms(jwtExpireduration))
         // Store token expiration date in the user object
         Result.tokenExpiry = expirationData;
          // Store token expiration date in the user object
          Result.tokenExpiry = expirationData;
          // Trigger notification via Pusher (optional: send to a specific admin or channel)
          // pusher.trigger('user-channel', 'user-registered', {
          //   message: `A new user named ${Result.firstName} ${Result.lastName} has registered with the role of ${Result.role}`,
        // });

        // Generate and send token (assuming sendToken sends the response)
        sendToken(Result, 201, res);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};


// create a User with Themp Password

exports.RegisterTemp_password = async(req,res)=>{
    try{

        const {firstName, lastName, email , role} = req.body

             // Check if user already exists
             const existingUser = await User.findOne({ email });
             if (existingUser) {
                 return res.status(400).json({
                     error: 'User with this email already exists'
                 });
             }


             const tempPassword = crypto.randomBytes(6).toString('hex')
             const hashedPassword = await bcrypt.hash(tempPassword, 10);

             const newUser= new User({
                  firstName,
                  lastName,
                  email ,
                  password: hashedPassword,
                  role: role || 'Investor',  // Default role
                  isPasswordSet: false  // A flag to check if the user has set their password
             })

             // Save the user
               const savedUser = await newUser.save();
               sendToken(savedUser, 201, res);

                 // Send the password setup email
            const setupLink = `${process.env.FRONTEND_URL}/setup-password?token=${token}`;
            await sendPasswordSetupEmail(email, setupLink);

            return res.status(201).json({
                message: 'User created successfully. An email has been sent for password setup.',
                user: savedUser
              });

    }catch(error){
        return res.status(500).json({ message: 'Error creating user', error: error.message });
    }
}



// Bulk User Creation Endpoint

exports.bulkCreateUsers = async (req, res) => {
    try {
      const fileBuffer = req.file.buffer; // Access the file buffer from memory
  
      if (!fileBuffer) {
        return res.status(400).json({ message: 'Please upload a file' });
      }
  
      // Create a readable stream from the buffer to parse the CSV data
      const readableFileStream = new Readable();
      readableFileStream.push(fileBuffer);
      readableFileStream.push(null);
  
      // Parse CSV data
      let usersData = [];
      readableFileStream
        .pipe(csv())
        .on('data', (row) => {
          usersData.push(row);
        })
        .on('end', async () => {
          try {
            // Check for existing emails
            const existingEmails = await User.find({ email: { $in: usersData.map(user => user.email) } }).select('email');
            const existingEmailSet = new Set(existingEmails.map(user => user.email));
  
            // Filter out users with existing emails
            const usersToCreate = await Promise.all(usersData.filter(user => !existingEmailSet.has(user.email)).map(async (user) => {
              const hashedPassword = await bcrypt.hash(user.password, 10);
              return {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                password: hashedPassword,
                role: user.role || 'Investor',  // Default role to 'Investor'
                investments: user.investments || []  // Handle investments if provided
              };
            }));
  
            if (usersToCreate.length === 0) {
              return res.status(400).json({ message: 'No new users created. All emails already exist.' });
            }
  
            // Bulk insert new users
            const createdUsers = await User.insertMany(usersToCreate);
  
            res.status(201).json({
              message: 'Users created successfully',
              data: createdUsers
            });
          } catch (error) {
            res.status(500).json({ message: 'Error creating users', error: error.message });
          }
        });
    } catch (error) {
      res.status(500).json({ message: 'Error processing the file', error: error.message });
    }
  };




// Login Controller //

// exports.Login = async (req, res) => {
//     const { email, password } = req.body;

//     // Check if both email and password are provided
//     if (!email || !password) {
//         return res.status(400).json({ message: 'Please provide both email and password.' });
//     }

//     try {
//         // Find the user by email
//         const user = await User.findOne({ email: email });

//         if (!user) {
//             return res.status(400).json({ message: 'Email not found.' });
//         }

//         // If the user has no password set (e.g., OAuth login)
//         if (!user.password) {
//             // Check if the active token exists and is valid
//             if (user.activeToken && user.isTokenExpired()) {
//                 return res.status(200).json({
//                     success: true,
//                     user: {
//                         _id: user._id,
//                         firstname: user.firstName,
//                         lastname: user.lastName,
//                         email: user.email,
//                     },
//                     token: user.activeToken,
//                 });
//             } else {
//                 // If no valid token exists, generate a new one
//                 const token = user.getSignedToken();  // Use getSignedToken to generate token

//                 // Update user with the new active token
//                 await User.findByIdAndUpdate(
//                     user._id.toString(),
//                     { activeToken: token },
//                     { new: true }
//                 );

//                 return res.status(200).json({
//                     success: true,
//                     user: {
//                         _id: user._id,
//                         firstname: user.firstName,
//                         lastname: user.lastName,
//                         email: user.email,
//                     },
//                     token: token,
//                 });
//             }
//         }

//         // Check if the password matches
//         const isMatch = await user.matchPasswords(password);
//         if (isMatch) {
//             // Check if the active token exists and is valid
//             if (user.activeToken && user.isTokenExpired()) {
//                 return res.status(200).json({
//                     success: true,
//                     user: {
//                         _id: user._id,
//                         firstname: user.firstName,
//                         lastname: user.lastName,
//                         email: user.email,
//                     },
//                     token: user.activeToken,
//                 });
//             } else {
//                 // Generate a new token if no valid active token exists
//                 const token = user.getSignedToken();

//                 // Update user with the new active token
//                 await User.findByIdAndUpdate(
//                     user._id.toString(),
//                     { activeToken: token },
//                     { new: true }
//                 );

//                 return res.status(200).json({
//                     success: true,
//                     user: {
//                         _id: user._id,
//                         firstname: user.firstName,
//                         lastname: user.lastName,
//                         email: user.email,
//                     },
//                     token: token,
//                 });
//             }
//         } else {
//             // If password is incorrect
//             return res.status(401).json({ message: 'Invalid credentials.' });
//         }
//     } catch (error) {
//         console.error('Error during login:', error);
//         return res.status(500).json({ message: 'An internal server error occurred.', error: error.message });
//     }
// };

exports.Login = async (req, res) => {
  const { email, password } = req.body;

  // Check if both email and password are provided
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide both email and password.' });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: 'Email not found.' });
    }



    const populatedPost = await Promise.all(
   
        user.posts.map(async(postId)=>{
         const Posts = await Post.findById(postId)
         if(Posts.author.equals(user._id)){
          return Posts;
         }
         return null
        })

    )

    // Function to generate and update active token
    const generateAndUpdateToken = async () => {
      const token = user.getSignedToken(); // Generate new token
      user.activeToken = token; // Set the active token on the user instance
      user.tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days in milliseconds
      await user.save(); // Save the user instance to update the token fields
      return token;
    };

    // If the user has no password set (e.g., OAuth login)
    if (!user.password) {
      if (user.activeToken && !user.isTokenExpired()) {
        // Return the existing active token if it is valid
        return res.status(200).json({
          success: true,
          user: {
            _id: user._id,
            Username: user.Username,
            email: user.email,
            profilePicture:user.profilePicture,
            Post:populatedPost
          },
          token: user.activeToken,
        });
      } else {
        // Generate a new token if no valid token exists
        const token = await generateAndUpdateToken();
        return res.status(200).json({
          success: true,
          user: {
            _id: user._id,
            Username: user.Username,
            email: user.email,
            profilePicture:user.profilePicture,
            Post:populatedPost
          },
          token: token,
        });
      }
    }

    // Check if the password matches
    const isMatch = await user.matchPasswords(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Handle token for users with passwords
    if (user.activeToken && !user.isTokenExpired()) {
      // If the existing token is active and valid, return it without updating
      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          Username: user.Username,
          email: user.email,
          profilePicture:user.profilePicture,
          Post:populatedPost
        },
        token: user.activeToken,  
      });
    } else {
      // Generate a new token if no valid active token exists
      const token = await generateAndUpdateToken();
      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          Username: user.Username,
          email: user.email,
          profilePicture:user.profilePicture,
          Post:populatedPost
        },
        token: token,
      });
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'An internal server error occurred.' });
  }
};





// Logout Controller //


exports.logout = async (req, res) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'Please login to access this resource' });
        }

        // const token = authHeader.split(' ')[1]
        // if (!token) {
        //     return res.status(401).json({ message: 'Authorization token not provided' });
        // }

        const token = authHeader

        const decodedData = jwt.verify(token, process.env.JWT_SECRET); // Verify token
        if (!decodedData) {
            return res.status(400).json({ message: 'Token is not verify' })
        }

        const userData = await User.findOne({ _id: decodedData.id })

        // Check if user exists and token matches the activeToken
        if (!userData || userData.activeToken !== token) {
            return res
                .status(401)
                .json({ message: 'Invalid session or token, please login again' });
        }

        // Clear the active token (logout)
        await User.findByIdAndUpdate(userData._id, { $unset: { activeToken: "" } }, { new: true })
        return res.status(200).json({
            message: `${userData._id} has logged out successfully`,
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired, please login again' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token, please login again' });
        } else {
            console.error('Server error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

// Verify token api//
exports.verifytoken = async(req,res)=>{
    try{
    const token = req.headers.authorization

    if(!token){
        res.status(400).json({message:'Please Login to Access this resources'})
    }

    const decodedData = jwt.verify(token, process.env.JWT_SECRET); // Verify token
    const NewUser = await User.findOne({_id:decodedData.id}).select('-password -activeToken')
    return res.status(200).json({
        message:'success',
        data:NewUser
    })

    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired, please login again' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token, please login again' });
        } else {
            console.error('Server error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

// Get Users data //
exports.GetUsers = async (req, res) => {
    try {
      // Fetch users and populate investments and company details within investments
      const findUsers = await User.find({})

      // Check if users were found
      if (!findUsers || findUsers.length === 0) {
        return res.status(404).json({
          message: 'No users found'
        });
      }
  
      // Return the populated user data
      return res.status(200).json({
        message: 'Data retrieved successfully',
        data: findUsers
      });
  
    } catch (error) {
      // Log and handle server errors
      console.error('Error retrieving users:', error);
      return res.status(500).json({
        msg: 'Internal server error',
        error: error.message
      });
    }
  };
  
             // Password setup //

exports.passwordSetup = async (req, res) => {
    try {
      const { newpassword } = req.body;
      const token = req.headers.authorization;
  
      if (!token) {
        return res.status(400).json({ message: 'Authorization token is required' });
      }
  
      // Verify JWT token
      const decodedData = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedData._id;
  
      // Find the user by ID
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newpassword, 10);
  
      // Update the user's password
      user.password = hashedPassword;
      await user.save();
  
      res.status(200).json({ message: 'Password reset successfully' });
  
    } catch (error) {
      res.status(500).json({
        message: 'Error setting password',
        error: error.message
      });
    }
  };


  // Edit the Profile //

  exports.editProfile = async (req, res) => {
    try {
      const UserId = req.params.id;
      const { bio, gender } = req.body;
      const profilePicture = req.file;
      let cloudResponse;
  
      if (profilePicture) {
        const fileUri = getDataUri(profilePicture)
        cloudResponse = await cloudinary.uploader.upload(fileUri); // Corrected Cloudinary upload
      }
  
      const user = await User.findById(UserId);
      if (!user) {
        return res.status(404).json({
          message: 'User not found',
          success: false,
        });
      }
  
      // Update bio, gender, and profile picture if provided
      if (bio) user.bio = bio;
      if (gender) user.gender = gender;
      if (cloudResponse && cloudResponse.secure_url) {
        user.profilePicture = cloudResponse.secure_url; // Use the secure URL from Cloudinary
      }
  
      await user.save();
  
      return res.status(200).json({
        message: 'Profile updated successfully',
        success: true,
        user,
      });
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({
        message: 'Internal server error',
        success: false,
        error: error.message,
      });
    }
  };


  exports.getsuggestedUsers = async(req,res)=>{
    try{
       const findUser = await User.find({_id:{
        $ne:req.user.id
       }})
       .sort({createdAt:-1})
       .limit(5)
       .select("-password")

       if(!findUser){
        return res.status(400).json('No User is Found')
       }

       return res.status(200).json({
        success:true,
        Users:findUser

       })
    }
    catch(error){
    return res.status(500).json('Internal Server Error')
    }
  }



  exports.followersOrUnfollow = async (req, res) => {
    try {
      const followingId = req.user.id; // The ID of the user making the request
      const targetUserId = req.params.id; // The ID of the user to follow/unfollow
  
      // Prevent a user from following/unfollowing themselves
      if (followingId === targetUserId) {
        return res.status(400).json({
          message: 'You cannot follow or unfollow yourself.',
          success: false,
        });
      }
  
      // Fetch the users from the database
      const user = await User.findById(followingId);
      const targetUser = await User.findById(targetUserId);
  
      // Check if both users exist
      if (!user || !targetUser) {
        return res.status(404).json({
          message: 'User not found.',
          success: false,
        });
      }
  
      // Check if the user is already following the target user
      const isFollowing = user.following.includes(targetUserId);
      
      if (isFollowing) {
        // Unfollow the target user
        await Promise.all([
          User.updateOne({ _id: followingId }, { $pull: { following: targetUserId } }),
          User.updateOne({ _id: targetUserId }, { $pull: { followers: followingId } }),
        ]);
        return res.status(200).json({
          message: 'Unfollowed successfully.',
          success: true,
        });
      } else {
        // Follow the target user
        await Promise.all([
          User.updateOne({ _id: followingId }, { $push: { following: targetUserId } }),
          User.updateOne({ _id: targetUserId }, { $push: { followers: followingId } }),
        ]);
        return res.status(200).json({
          message: 'Followed successfully.',
          success: true,
        });
      }
    } catch (error) {
      console.error('Error in followersOrUnfollow:', error);
      return res.status(500).json({
        message: 'Internal server error.',
        success: false,
      });
    }
  };
  

  
  













