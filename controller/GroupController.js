const Group = require("../models/group")
const{getReceiverSocketId} = require("../Socket/socket")


// Create the Group //

exports.createGroup = async (req, res) => {
    try {
        const senderId = req.user._id; 
        const { name, participants } = req.body; 

        // Validate the required fields
        if (!name || !participants) {
            return res.status(400).json({ message: 'Please fill in all the fields' });
        }

        // Parse participants if it's sent as a JSON string, otherwise use it directly
        const users = Array.isArray(participants) ? participants : JSON.parse(participants);

        // Check if there are at least 2 participants
        if (users.length < 2) {
            return res.status(400).json({ message: 'A group should have more than 2 users.' });
        }

        // Add the sender to the participants list
        users.push(senderId);

        // Create the group
        const group = await Group.create({
            name: name,
            participants: users,
            isGroup: true,
            groupAdmin: senderId
        });

        // Populate the created group with participants' details
        const createdChat = await Group.findOne({ _id: group._id })
            .populate({
                path: 'participants',
                select: 'Username'
            });


            // Emit the Group to all participants //

          users.forEach((userId)=>{
            const socketId = getReceiverSocketId[userId];
            if(socketId){
                io.to(socketId).emit('groupCreated',{
                    groupId: createdChat._id,
                    groupName: createdChat.name,
                    participants: createdChat.participants
                })
            }
          })

        // Send the response with the newly created group chat
        return res.status(200).json({
            success: true,
            data: createdChat
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: error.message
        });
    }
};



exports.fetchAllChats = async (req, res) => {
    try {
      const chats = await Group.find({
        participants: {
          $elemMatch: {
            $eq: req.user.id,
          },
        },
      })
        .populate('participants')
        .populate('messages')
        .populate('groupAdmin')
        .sort({ updatedAt: -1 });
  
      return res.status(200).json({
        success: true,
        data: chats,
      });
    } catch (error) {
      console.error('Error fetching chats:', error.message);  // Log the error for debugging
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
      });
    }
  };
  