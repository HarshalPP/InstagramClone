const Post = require("../models/Post");
const User = require("../models/User")
const Comment = require("../models/comment")
const sharp = require("sharp");
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
dotenv.config();


const { getReceiverSocketId, io } = require("../Socket/socket")
// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Add the Post //

exports.AddNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const author = req.user.id;
    const image = req.file;

    // Check if image file exists
    if (!image) {
      return res.status(400).json({
        message: 'Please upload an image.',
      });
    }

    // Optimize the image using sharp
    const optimizedImageBuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: 'inside' })
      .toFormat('jpeg', { quality: 80 })
      .toBuffer();

    // Convert optimized image buffer to base64 URI format
    const fileURI = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;

    // Upload the image to Cloudinary
    const cloudResponse = await cloudinary.uploader.upload(fileURI);

    // Create a new post with the uploaded image URL
    const postData = new Post({
      caption,
      author,
      image: cloudResponse.secure_url,
    });


    // Save the post data in the database
    const result = await postData.save();

    // Update the user by adding the post ID to their posts array
    const updateUser = await User.findByIdAndUpdate(
      author,
      { $push: { posts: result._id } }, // Push the new post ID into the user's posts array
      { new: true } // Return the updated user document
    );

    if (!updateUser) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error in AddNewPost:', error);
    return res.status(500).json({
      message: 'Internal server error.',
      error: error.message,
    });
  }
};

// Get the Post //


exports.getPost = async (req, res) => {
  try {
    const findPost = await Post.find({})
      .sort({ createdAt: -1 })

      .populate({
        path: 'author',
        select: 'profilePicture Username'
      })

      .populate({
        path: 'comments',
        select: 'text liked Count ',
        sort: { createdAt: -1 },
        populate: {
          path: 'author',
          select: 'profilePicture'
        }
      })

    return res.status(200).json({
      success: true,
      data: findPost
    })
  }
  catch (error) {
    return res.status(500).json({
      error: error.message
    })
  }
}

// Get Users Post //

exports.postUser = async (req, res) => {
  try {

    const UserId = req.user._id
    if (!UserId) {
      return res.status(404).json({ Message: 'User is not Found' })
    }
    // find  the Post of Specfic Fields //
    const findPost = await Post.find({ author: UserId })

      .populate({
        path: 'author',
        select: 'Username email'
      })

    if (!findPost) {
      return res.status(404).json({
        message: 'Post is not Found of this User',
      })
    }

    res.status(200).json({
      message: 'Get Post Data',
      data: findPost
    })

  } catch (error) {
    return res.status(500).json({
      error: error.message
    })
  }
}


// Like of the Post //
exports.LikePost = async (req, res) => {
  try {
    // Get the User Id
    const UserId = req.user._id;
    const PostId = req.params.id;

    // Find the Post
    const FindPost = await Post.findById(PostId);
    if (!FindPost) {
      return res.status(404).json({ message: 'POST IS NOT FOUND' });
    }

    // Like the Post
    const LikedPost = await Post.updateOne(
      { _id: PostId }, // Filter by PostId
      { $addToSet: { likes: UserId } } // Add the UserId to likes array
    );

    // Implement the socket connection //

    const user = await User.findById(UserId).select('Username profilePicture')
    const PostownerId = FindPost.author.toString()
    console.log("PostownerId is not defined" , PostownerId)
    if (PostownerId !== UserId) {

      const notification = {
        type: 'like',
        userId: UserId,
        userDetails: user,
        PostId,
        message: 'Your post was Liked'

      }

      // get UserSocketId //

      const postOwnerSocketId = getReceiverSocketId(PostownerId)
      console.log(postOwnerSocketId , "postOwnerSocketId")
      if (postOwnerSocketId) {
        const socket = io.sockets.sockets.get(postOwnerSocketId); // Get the socket instance
        if (socket) {
          // Emit the notification directly using the socket instance
          socket.emit('notification', notification);
          console.log(`Notification emitted directly to socket ID: ${postOwnerSocketId}`);
        } else {
          console.log("Socket instance not found for the post owner. Unable to emit notification.");
        }
      } else {
        console.log("No socket ID found for the post owner. Unable to emit notification.");
      }
    }




    return res.status(200).json({
      success: true,
      message: 'Liked on Post',
      data: LikedPost
    });

  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Dislike the Post // 
exports.DisLike = async (req, res) => {
  try {
    const UserId = req.user._id;
    const PostId = req.params.id;

    // Find the post by ID
    const FindPost = await Post.findById(PostId);
    if (!FindPost) {
      return res.status(404).json({ message: 'Post not Found' });
    }

    // Dislike (remove the like) from the post
    const Dislike_Post = await Post.updateOne(
      { _id: PostId }, // Filter by PostId
      { $pull: { likes: UserId } } // Remove UserId from likes array
    );

        // Implement the socket connection //

        const user = await User.findById(UserId).select('Username profilePicture')
        const PostownerId = FindPost.author.toString()
        if (PostownerId !== UserId) {
    
          const notification = {
            type: 'Dislike',
            userId: UserId,
            userDetails: user,
            PostId,
            message: 'Your post was Disliked'
    
          }
    
          // // get UserSocketId //
          const postOwnerSocketId = getReceiverSocketId(PostownerId)
          io.to(postOwnerSocketId).emit('notification', notification)
    
        }

        return res.status(200).json({
        success: true,
        message: 'Disliked the Post',
        data: Dislike_Post
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};


//  Add the Comment //

exports.AddComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(404).json({ message: 'Please Provide the text' })
    }
    const authorId = req.user._id
    const PostId = req.params.id;
    const addComment = new Comment({
      text,
      author: authorId,
      post: PostId
    })

    const PostComment = await addComment.save();
    // Update Post comment //

    const findpost = await Post.findById(PostId)

    if (!findpost) {
      return res.status(404).json({
        message: 'Post not found'
      })

    }

    findpost.comments.push(PostComment._id)
    await findpost.save();

    // Send the response back with the saved comment
    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: PostComment
    });

  }
  catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

// GET THE POSTED Comment //

exports.getCommentofPost = async (req, res) => {
  try {
    const PostId = req.params.id
    const comments = await Comment.find({ post: PostId })
      .populate('author', 'email  profilePicture Username')
      .populate('liked' , 'Username')
    if (!comments) {
      return res.status(404).json({
        message: 'Comment not found oh this post'
      })
    }
    return res.status(200).json({
      success: true,
      message: 'Comment retrived successfully',
      data: comments
    })
  }
  catch (error) {
    return res.status(500).json('Internal server error')
  }
}


// I want to delete my post //

exports.deletePost = async (req, res) => {
  const PostId = req.params.id;
  const UserId = req.user._id;

  try {
    // Find the post by ID
    const findPost = await Post.findById(PostId);
    if (!findPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Delete the post by its ID
    await Post.findByIdAndDelete(PostId);

    // Remove the post reference from the user's posts array
    const findUser = await User.findById(UserId);
    if (!findUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter out the deleted post from the user's posts array
    findUser.posts = findUser.posts.filter(id => id.toString() !== PostId);
    await findUser.save();

    // Delete all comments associated with the post
    await Comment.deleteMany({ post: PostId });

    // Return success response // 
    return res.status(200).json({
      success: true,
      message: 'Post and associated comments deleted successfully'
    });

  } catch (error) {
    // Handle internal server errors
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Bookmark the Post //

exports.Bookmark = async (req, res) => {
  try {
    const PostId = req.params.id;
    const UserId = req.user._id;

    // Find the post
    const FindPost = await Post.findById(PostId);
    if (!FindPost) {
      return res.status(404).json({ msg: 'Post Not Found' });
    }

    // Find the user
    const Userdata = await User.findById(UserId);

    // Check if the post is already bookmarked
    if (Userdata.bookmarks.includes(PostId)) {
      // Remove bookmark
      await User.updateOne(
        { _id: UserId },
        { $pull: { bookmarks: PostId } }
      );
      return res.status(200).json({ message: 'Post removed from bookmarks' });
    } else {
      // Add bookmark
      await User.updateOne(
        { _id: UserId },
        { $addToSet: { bookmarks: PostId } }
      );
      return res.status(200).json({ message: 'Post added to bookmarks' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};




// Make a api to Liked the Comment //

exports.Liked_Comment = async (req, res) => {
  try {
    const UserId = req.user._id;        // Authenticated user ID
    const PostId = req.params.PostId;   // Post ID from URL parameters
    const CommentId = req.params.CommentId; // Comment ID from URL parameters

    // Step 1: Find the post by ID and populate the 'comments' field
    const FindPost = await Post.findById(PostId).populate({
      path: 'comments',
      select: 'text liked author'        // Selecting necessary fields from comments
    });

    if (!FindPost) {
      return res.status(404).json({ msg: 'No Post found to comment on' }); // 404 for post not found
    }

    // Step 2: Find the comment by CommentId
    const findComment = await Comment.findById(CommentId);

    if (!findComment) {
      return res.status(404).json({ msg: 'Comment not found' }); // 404 for comment not found
    }

    // Step 3: Check if the comment is already liked by the user
    if (findComment.liked.includes(UserId)) {
      // If the user has already liked the comment, remove the like (unlike)
      await Comment.updateOne(
        { _id: CommentId },
        { $pull: { liked: UserId } } // Use $pull to remove the user's like
      );

      // Update Count if likes are now empty
      const updatedComment = await Comment.findById(CommentId);
      const newCount = updatedComment.liked.length === 0 ? 'False' : 'True';

      await Comment.updateOne(
        { _id: CommentId },
        { $set: { Count: newCount } }
      );

      return res.status(200).json({
        msg: 'Unliked the comment',
        Count: newCount,
        likeCount: updatedComment.liked.length, // Total number of likes
        likedUsers: updatedComment.liked        // List of users who liked the comment
      });
    } else {
      // If the user hasn't liked the comment yet, add the like
      await Comment.updateOne(
        { _id: CommentId },
        { $addToSet: { liked: UserId } } // Use $addToSet to add the user's like
      );

      // Update Count to 'True' since there is at least one like now
      await Comment.updateOne(
        { _id: CommentId },
        { $set: { Count: 'True' } }
      );

      const updatedComment = await Comment.findById(CommentId);

      return res.status(200).json({
        msg: 'Liked the comment',
        Count: 'True',
        likeCount: updatedComment.liked.length, // Total number of likes
        likedUsers: updatedComment.liked        // List of users who liked the comment
      });
    }

  } catch (error) {
    // Return a detailed error message
    return res.status(500).json({ msg: 'Internal Server Error', error: error.message });
  }
};

