const Reels = require("../models/ReelModel");
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
const {getDataUri}= require("../Utils/datauri")
const {getReceiverSocketId} = require("../Socket/socket")

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});



// Make a Reel
exports.CreateReels = async (req, res) => {
  try {
    const user = req.user._id;
    const { caption } = req.body;
    const videoUrl = req.file;

    if (!videoUrl) {
      return res.status(404).json({
        msg: 'Video is not provided',
      });
    }

    // Upload video to Cloudinary
    let cloudResponse;
    if (videoUrl) {
      const fileUri = getDataUri(videoUrl);
      cloudResponse = await cloudinary.uploader.upload(fileUri, {
        resource_type: "video" // Ensure you're uploading as a video
      });
    }

    if (!cloudResponse) {
      return res.status(404).json({
        msg: 'Failed to upload video',
      });
    }

    // Function to check video file type
    function checkFileType(file) {
      const filetypes = /mp4|mov|avi|MKV|wmv/;
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = filetypes.test(file.mimetype);

      if (mimetype && extname) {
        return true; // Valid file
      } else {
        return false; // Invalid file
      }
    }

    // Assuming the file is available in `req.file`
    if (!checkFileType(req.file)) {
      return res.status(400).json({
        msg: 'Error: Only video files are allowed!',
      });
    }

    // Create new Reel in database
    const newReel = await Reels.create({
      user: user,
      videoUrl: cloudResponse.secure_url,
      caption: caption,
    });

    // Emit the Event //

    const SocketId = getReceiverSocketId(user)
    if(SocketId){
      io.to(SocketId).emit('Reels' , newReel)
    }
    else{
      console.log('Receiver is not connected , no notification sent')
    }



    return res.status(201).json({
      msg: 'Reel created successfully',
      reel: newReel,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: 'Server error',
    });
  }
};


                    // Like the Reels //

exports.LikedReels = async(req,res)=>{
    try{

        const ReelId = req.params.id;
        const UserId = req.user._id
        const findReel = await Reels.findById(ReelId)

        if(!findReel){
            return res.status(400).json('Id is not Provided')
        }

        if(findReel.likes.includes(UserId)){
            findReel.likes= findReel.likes.filter(userId => userId.toString() !== req.user.id.toString())
        }
        else{
            findReel.likes.push(UserId)
        }
         await findReel.save()
         res.status(200).json({
            success:true,
            data:findReel
         })

    }catch(error){
        return res.status(500).json({
            msg:'Internal server error',
            error:error.message
        })
    }
}


// Comment on the Reels //


exports.Comment_Reels = async(req,res)=>{
    try {
        const ReelId = req.params.id
        const UserId = req.user._id

        const FindReelId = await Reels.findById(ReelId)
        if(!FindReelId){
       return res.status(404).json('FindReelId is not found')
        }
        
        const data = {
            user:UserId,
            text:req.body.text
        }

        FindReelId.comments.push(data)
        await FindReelId.save()
        return res.status(200).json({
            success:true,
            data:FindReelId
        })
        
    }
    catch (error) {
        return res.status(500).json({
            message:'Internal server error',
            error:error.message
        })
    }
}


// Get Reel Api /// 

exports.GetReel = async(req,res)=>{
    try {

        const findReels = await Reels.find({})
        .populate({
            path:'likes',
            select:'Username profilePicture'
        })

        .populate({
            path:'comments.user',
            select:'Username profilePicture'
        })

        return res.status(200).json({
            message:'Data Reterive Successfully',
            data:findReels
        })
        
    } catch (error) {
        return res.status(500).json('Internal Server Error')
    }
}