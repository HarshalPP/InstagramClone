const Conversation = require("../models/converstion")
const Message = require("../models/message")
const User = require("../models/User")
const Group = require("../models/group")
const { getReceiverSocketId, io } = require("../Socket/socket")
const cloudinary = require('cloudinary').v2;
const sharp = require("sharp");
const fs = require('fs');
const path = require('path');
const os = require('os'); // To create a temporary directory

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

// exports.SendMessage = async (req, res) => {
//     try {
//         const senderId = req.user._id;
//         const receiverId = req.params.id;
//         const { message } = req.body;
//         const images  = req.files; // Check if the image file exists

//          /// Optimize the image using sharp
//          let imageUrls = [];

//          // Loop through each image and optimize/upload to Cloudinary
//          for (const image of images) {
//              const optimizedImageBuffer = await sharp(image.buffer)
//                  .resize({ width: 800, height: 800, fit: 'inside' })
//                  .toFormat('jpeg', { quality: 80 })
//                  .toBuffer();

//              const fileURI = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
//              const cloudResponse = await cloudinary.uploader.upload(fileURI);

//              // Store each image URL
//              imageUrls.push(cloudResponse.secure_url);
//          }


//         // find the conversation between sender and receiver
//         let conversation = await Conversation.findOne({
//             participants: {
//                 $all: [senderId, receiverId]
//             }
//         });

//         // if no conversation exists, create one without the message
//         if (!conversation) {
//             conversation = await Conversation.create({
//                 participants: [senderId, receiverId],
//                 message: [] // Initialize with an empty array for message IDs
//             });
//         }

//         // create the new message
//         const newMessage = await Message.create({
//             senderId,
//             receiverId,
//             message,
//             image:imageUrls  // Save the array of image URLs
//         });

//         // add the new message's ID to the conversation
//         if (newMessage) {
//             conversation.message.push(newMessage._id); // push the message's ObjectId
//         }

//         await Promise.all([
//             conversation.save(),
//             newMessage.save()
//         ]);

//         // Notify receiver via socket (if connected)
//         const getReceiverSocketIds = getReceiverSocketId(receiverId);
//         if (getReceiverSocketIds) {
//             console.log("new data is ", getReceiverSocketIds)
//             io.to(getReceiverSocketIds).emit('newMessage', newMessage);
//         }

//         // Make  a Notification to show the Msg from User1 to User2

//         const sender = await User.findById(senderId).select('Username profilePicture ')
//         if (getReceiverSocketIds) {

//             const notification = {
//                 type: 'message',
//                 senderId,
//                 senderDetails: sender,
//                 message,
//                 messageId: newMessage._id,
//                 notificationMessage: 'You have a new message',

//             }

//             // Emit Notification to Reciver (user2)

//             console.log(`Sending message notification to socket ID: ${getReceiverSocketIds}`);
//             io.to(getReceiverSocketIds).emit('messageNotification', notification)
//         }
//         else {
//             console.log('Receiver is not connected, no notification sent');
//           }

//         // Send response
//         return res.status(201).json({
//             success: true,
//             newMessage
//         });

//     } catch (error) {
//         res.status(500).json({
//             msg: 'internal Server Error',
//             error: error.message
//         });
//     }
// };



// Get Message //

// exports.SendMessage = async (req, res) => {
//     try {
//         const senderId = req.user._id;
//         const receiverId = req.params.id;
//         const { message , GIF_URL } = req.body;
//         const mediaFiles = req.files;


//         let imageUrls = [];
//         let videoUrls = [];

//         // Check if image and video fields exist in req.files
//         const images = mediaFiles['image'] || [];
//         const videos = mediaFiles['video'] || [];

//         // Loop through image files and process
//         for (const image of images) {
//             const optimizedImageBuffer = await sharp(image.buffer)
//                 .resize({ width: 800, height: 800, fit: 'inside' })
//                 .toFormat('jpeg', { quality: 80 })
//                 .toBuffer();

//             const fileURI = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
//             const cloudResponse = await cloudinary.uploader.upload(fileURI);

//             // Store image URL
//             imageUrls.push(cloudResponse.secure_url);
//         }

//         // Loop through video files and process
//         for (const video of videos) {

//             // Generate a temporary file path
//             const tempFilePath = path.join(os.tmpdir(), video.originalname);

//             // Write the buffer to the temporary file
//             fs.writeFileSync(tempFilePath, video.buffer);

//             // Upload the video file to Cloudinary
//             const cloudResponse = await cloudinary.uploader.upload(tempFilePath, {
//                 resource_type: "video",   // Specify video resource type
//                 format: "mp4"             // Force conversion to .mp4 format
//             });

//             // Store video URL
//             videoUrls.push(cloudResponse.secure_url);

//             // Delete the temporary file after upload
//             fs.unlinkSync(tempFilePath);
//         }


//         // Find or create conversation between sender and receiver
//         let conversation = await Conversation.findOne({
//             participants: { $all: [senderId, receiverId] }
//         });

//         if (!conversation) {
//             conversation = await Conversation.create({
//                 participants: [senderId, receiverId],
//                 message: [] // Initialize with an empty array for message IDs
//             });
//         }

//         // Create the new message with both image and video URLs
//         const newMessage = await Message.create({
//             senderId,
//             receiverId,
//             message,
//             GIF_URL,
//             image: imageUrls,  // Save array of image URLs
//             videos: videoUrls   // Save array of video URLs
//         });

//         // Add the new message's ID to the conversation
//         conversation.message.push(newMessage._id);

//         await Promise.all([
//             conversation.save(),
//             newMessage.save()
//         ]);

//         // Notify receiver via socket (if connected)
//         const getReceiverSocketIds = getReceiverSocketId(receiverId);
//         if (getReceiverSocketIds) {
//             io.to(getReceiverSocketIds).emit('newMessage', newMessage);
//         }

//         // Make a notification to show the message
//         const sender = await User.findById(senderId).select('Username profilePicture');
//         const notification = {
//             type: 'message',
//             senderId,
//             senderDetails: sender,
//             message,
//             messageId: newMessage._id,
//             notificationMessage: 'You have a new message',
//         };

//         if (getReceiverSocketIds) {
//             io.to(getReceiverSocketIds).emit('messageNotification', notification);
//         } else {
//             console.log('Receiver is not connected, no notification sent');
//         }

//         // Send response
//         return res.status(201).json({
//             success: true,
//             newMessage
//         });

//     } catch (error) {
//         res.status(500).json({
//             msg: 'Internal Server Error',
//             error: error.message
//         });
//     }
// };



exports.SendMessage = async (req, res) => {
    try {
        const senderId = req.user._id;
        const { message, GIF_URL } = req.body;
        const mediaFiles = req.files;
        const groupId = req.params.groupId || null; // Get groupId if provided
        const receiverId = req.params.receiverId; // Use receiverId for direct messages

        let imageUrls = [];
        let videoUrls = [];

        // Check if image and video fields exist in req.files
        const images = mediaFiles['image'] || [];
        const videos = mediaFiles['video'] || [];

        // Process and upload images
        for (const image of images) {
            const optimizedImageBuffer = await sharp(image.buffer)
                .resize({ width: 800, height: 800, fit: 'inside' })
                .toFormat('jpeg', { quality: 80 })
                .toBuffer();

            const fileURI = `data:image/jpeg;base64,${optimizedImageBuffer.toString('base64')}`;
            const cloudResponse = await cloudinary.uploader.upload(fileURI);

            // Store image URL
            imageUrls.push(cloudResponse.secure_url);
        }

        // Process and upload videos
        for (const video of videos) {
            const tempFilePath = path.join(os.tmpdir(), video.originalname);
            fs.writeFileSync(tempFilePath, video.buffer);

            const cloudResponse = await cloudinary.uploader.upload(tempFilePath, {
                resource_type: "video", // Specify video resource type
                format: "mp4"           // Force conversion to .mp4 format
            });

            videoUrls.push(cloudResponse.secure_url);
            fs.unlinkSync(tempFilePath); // Delete temp file after upload
        }

        let newMessage;

        if (groupId) {
            // Group chat message
            newMessage = await Message.create({
                senderId,
                message,
                GIF_URL,
                GroupId: groupId,
                image: imageUrls,
                videos: videoUrls,
            });

            // Add new message to group
            await Group.findByIdAndUpdate(groupId, {
                $push: { messages: newMessage._id }
            });

            // Emit message to all group participants
            const group = await Group.findById(groupId).populate('participants');
            group.participants.forEach((participant) => {
                const socketId = getReceiverSocketId(participant._id);
                if (socketId) {
                    io.to(socketId).emit('newMessage', newMessage);
                }
            });

        } else {
            // Direct message logic
            let conversation = await Conversation.findOne({
                participants: { $all: [senderId, receiverId] }
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    participants: [senderId, receiverId],
                    messages: []
                });
            }

            newMessage = await Message.create({
                senderId,
                receiverId,
                message,
                GIF_URL,
                image: imageUrls,
                videos: videoUrls
            });

            // Add new message to conversation
            conversation.messages.push(newMessage._id);
            await conversation.save();

            // Notify receiver via socket
            const socketId = getReceiverSocketId(receiverId);
            if (socketId) {
                io.to(socketId).emit('newMessage', newMessage);
            }
        }

        // Notify receiver (or group) of new message
        const sender = await User.findById(senderId).select('Username profilePicture');
        const notification = {
            type: 'message',
            senderId,
            senderDetails: sender,
            message,
            messageId: newMessage._id,
            notificationMessage: 'You have a new message',
        };

        const socketId = groupId ? getReceiverSocketId(groupId) : getReceiverSocketId(receiverId);
        if (socketId) {
            io.to(socketId).emit('messageNotification', notification);
        } else {
            console.log('Receiver is not connected, no notification sent');
        }

        // Send response
        return res.status(201).json({
            success: true,
            newMessage
        });

    } catch (error) {
        console.error('Error sending message:', error.message);
        return res.status(500).json({
            msg: 'Internal Server Error',
            error: error.message
        });
    }
};




// exports.getMessage = async (req, res) => {
//     try {
//         const senderId = req.user._id
//         const receiverId = req.params.id;

//         const converstion = await Conversation.findOne({
//             participants: {
//                 $all: [
//                     senderId,
//                     receiverId
//                 ]
//             }
//         })
//             .populate('message')

//         if (!converstion) {
//             return res.status(200).json({
//                 success: true,
//                 message: []
//             })
//         }

//         return res.status(200).json({
//             success: true,
//             message: converstion?.message
//         })

//     } catch (error) {
//         return res.status(500).json('Internal Server Error')
//     }
// }


exports.getMessage = async (req, res) => {
    try {
        const senderId = req.user._id;
        const receiverOrGroupId = req.params.id; // This could be a user ID or a group ID.

        // Check if the ID is for a group
        const isGroup = await Group.findById(receiverOrGroupId);

        if (isGroup) {
            // If it's a group, fetch group messages
            const group = await Group.findById(receiverOrGroupId)
                .populate({
                    path: 'messages',
                    populate: {
                        path: 'senderId', // Populate sender details
                        select: 'Username profilePicture'
                    }
                })
                .populate('participants', 'Username profilePicture') // Populate participants
                .populate('groupAdmin', 'Username profilePicture');   // Populate group admin

            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: 'Group not found'
                });
            }

            // Return group messages
            return res.status(200).json({
                success: true,
                data: group.messages
            });
        } else {
            // If it's not a group, treat it as a conversation between two users
            const conversation = await Conversation.findOne({
                participants: {
                    $all: [senderId, receiverOrGroupId] // Find conversation between two users
                }
            })
                .populate('message');

            if (!conversation) {
                return res.status(200).json({
                    success: true,
                    message: []
                });
            }

            // Return direct messages between the two users
            return res.status(200).json({
                success: true,
                message: conversation.message
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error',
            error: error.message
        });
    }
};




exports.DeleteMessage = async (req, res) => {
    try {
        // Extract the list of message IDs from the request body
        const messageIds = req.body.messageIds; // Assuming messageIds is an array of IDs
        const UserId = req.user._id

        // Check if messageIds is an array and not empty
        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            return res.status(400).json({ msg: 'Invalid input: messageIds should be a non-empty array.' });
        }

        // Delete the messages using the IDs provided
        const deleteResult = await Message.deleteMany({ _id: { $in: messageIds } });

        // Check if any messages were deleted
        if (deleteResult.deletedCount > 0) {

            messageIds.forEach(messageId => {
                const getReceiverSocketId = getReceiverSocketId(UserId)
                if (getReceiverSocketId) {
                    io.to(getReceiverSocketId).emit('messageDeleted', { messageId })
                }
            })

            return res.status(200).json({ msg: 'Messages deleted successfully.', deletedCount: deleteResult.deletedCount });
        } else {
            return res.status(404).json({ msg: 'No messages found for the provided IDs.' });
        }
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({ msg: 'Internal server error', error: error.message });
    }
};



// Get msg by Id //


exports.getMessageById = async (req, res) => {
    try {

        const MessageId = req.params.id

        if (!MessageId) {
            return res.status(400).json('MessageId is not Provided')
        }

        const FindMessage = await Message.findById(MessageId)
        if (!FindMessage) {
            return res.status(404).json('Message is not find')
        }

        return res.status(200).json({
            success: true,
            msg: FindMessage
        })

    } catch (error) {
        return res.status(500).json('Internal Server error')
    }
}
