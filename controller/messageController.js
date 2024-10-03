const Conversation = require("../models/converstion")
const Message = require("../models/message")
const {getReceiverSocketId}= require("../Socket/socket")


exports.SendMessage = async(req,res)=>{
    try {

        const senderId = req.user._id;
        const receiverId = req.params.id
        const {message} =  req.body;

        // find the ids from converstion

        let converstion = await Conversation.findOne({
            participants:{
            $all:[
                senderId,
                receiverId
            ]
            }
        })

        if(!converstion){
            converstion = await Conversation.create({
                senderId,
                receiverId,
                message
            })
        }

        // create the msg //

        const newMessage = await Message.create({
            senderId,
            receiverId,
            message
        })


        if(newMessage){
         converstion.message.push(newMessage._id)
        }

        await Promise.all([
            converstion.save(),
            newMessage.save()
        ])

        const getReceiverSocketIds = getReceiverSocketId(receiverId)
        if(getReceiverSocketIds){
            io.to(getReceiverSocketIds).emit('newMessage' , newMessage)
        }

        // Implement the Socket //

        return res.status(201).json({
            success:true,
            newMessage
        })



    } 
    catch (error) {
        res.status(500).json('internal Server Error')
    }
}


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