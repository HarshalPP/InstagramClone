const Conversation = require("../models/converstion")
const Message = require("../models/message")
const {getReceiverSocketId,io}= require("../Socket/socket")


exports.SendMessage = async(req, res) => {
    try {
        const senderId = req.user._id;
        const receiverId = req.params.id;
        const { message } = req.body;

        // find the conversation between sender and receiver
        let conversation = await Conversation.findOne({
            participants: {
                $all: [senderId, receiverId]
            }
        });

        // if no conversation exists, create one without the message
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                message: [] // Initialize with an empty array for message IDs
            });
        }

        // create the new message
        const newMessage = await Message.create({
            senderId,
            receiverId,
            message
        });

        // add the new message's ID to the conversation
        if (newMessage) {
            conversation.message.push(newMessage._id); // push the message's ObjectId
        }

        await Promise.all([
            conversation.save(),
            newMessage.save()
        ]);

        // Notify receiver via socket (if connected)
        const getReceiverSocketIds = getReceiverSocketId(receiverId);
        if (getReceiverSocketIds) {
            console.log("new data is " , getReceiverSocketIds)
            io.to(getReceiverSocketIds).emit('newMessage', newMessage);
        }

        // Send response
        return res.status(201).json({
            success: true,
            newMessage
        });

    } catch (error) {
        res.status(500).json({
            msg: 'internal Server Error',
            error: error.message
        });
    }
};



// Get Message //


exports.getMessage = async(req,res)=>{
    try {
        const senderId = req.user._id
        const receiverId=req.params.id;

        const converstion = await Conversation.findOne({
            participants:{
                $all:[
                    senderId,
                    receiverId
                ]   
            }
        })
        .populate('message')

        if(!converstion){
            return res.status(200).json({
                success:true,
                message:[]
            })
        }

        return res.status(200).json({
            success:true,
            message:converstion?.message
        })
        
    } catch (error) {
        return res.status(500).json('Internal Server Error')
    }
}