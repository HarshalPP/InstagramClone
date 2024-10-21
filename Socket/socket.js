const { Server } = require("socket.io");
const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            // List of allowed origins
            const allowedOrigins = [
                'http://13.202.189.87', // Frontend URL

            ];
            
            // Check if the incoming origin is in the allowed origins list
            if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
                callback(null, true); // Allow the request
            } else {
                callback(new Error('Not allowed by CORS')); // Reject the request
            }
        },
        methods: ['GET', 'POST']
    }
});


const userSocketMap = {}; 
console.log("Initial UserSocketMap:", userSocketMap);





// Handle socket connection
io.on('connection', async(socket) => {
    try{
    const userId = socket.handshake.query.userId;
if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
} else {
    console.error('User ID not provided in the connection query.');
}

    if (userId) {
        // Add the user to the userSocketMap
        userSocketMap[userId] = socket.id;
        console.log(`User connected: ${userId} with socket ID: ${socket.id}`);
        console.log("Updated UserSocketMap:", userSocketMap);
    }

    // Emit the list of online users
    io.emit('getOnlineUsers', Object.keys(userSocketMap));


    // When Group is created , client will join the group's room //

    socket.on('groupCreated' , ({groupId , groupName})=>{
        console.log(`Group created: ${groupName} (${groupId})`)


        // join the newly created group room //

        socket.join(groupId)

        // Notify Participantes they are part of this Group //

        socket.emit('joinedGroup',{
            groupId,
            groupName
        })
    })

    // Join the chat room for group messages //

    socket.on('joinGroup' , (groupId)=>{
        console.log(`User ${userId} joined group: ${groupId}`);
        socket.join(groupId);
    })
     
      // Handle sending a message to a group
      socket.on('sendGroupMessage', ({ groupId, message }) => {
        console.log(`New message in group ${groupId}: ${message}`);
        io.in(groupId).emit('newGroupMessage', { groupId, message });
    });


    // // Handle incoming video call from User1 to User2
    // socket.on('callUser', ({ fromUserId, toUserId, roomId }) => {
    //     const receiverSocketId = userSocketMap[toUserId];
    //     if (receiverSocketId) {
    //         console.log(`Calling user: ${toUserId} from: ${fromUserId} in room: ${roomId}`);
    //         io.to(receiverSocketId).emit('incomingCall', {
    //             fromUserId,
    //             roomId
    //         });
    //     } else {
    //         console.log(`Receiver ${toUserId} not found in userSocketMap.`);
    //     }
    // });

    // // Handle the event when User2 accepts the call
    // socket.on('acceptCall', ({ fromUserId, toUserId, roomId }) => {
    //     const callerSocketId = userSocketMap[fromUserId];
    //     if (callerSocketId) {
    //         console.log(`User ${toUserId} accepted call from ${fromUserId}`);
    //         io.to(callerSocketId).emit('callAccepted', {
    //             fromUserId,
    //             toUserId,
    //             roomId,
    //         });
    //     }
    // });

    // Handle socket disconnection
    socket.on('disconnect', () => {
        if (userId) {
            console.log(`User disconnected: ${userId} with socket ID: ${socket.id}`);
            delete userSocketMap[userId]; // Remove the user from the map
            console.log("Updated UserSocketMap after disconnect:", userSocketMap);
        }
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    });


    }
    catch(error){
        res.status(500).json('Socket Connection failed..')
    }
});


// Function to get receiver's socket ID
const getReceiverSocketId = (receiverId) => {
    console.log(receiverId, "receiverId");
    console.log(userSocketMap, "userSocketMap");

    const socketId = Object.keys(userSocketMap).find((key) => key === receiverId) ? userSocketMap[receiverId] : undefined;
    
    if (!socketId) {
        console.error(`Socket ID for receiver ${receiverId} not found in userSocketMap.`);
    } else {
        console.log(`Found Socket ID for receiver ${receiverId}: ${socketId}`);
    }

    return socketId;
};



module.exports = { app, server, io , getReceiverSocketId};
