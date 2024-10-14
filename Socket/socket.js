const { Server } = require("socket.io");
const express = require("express");
const http = require("http");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'https://zippy-cascaron-626fb8.netlify.app/',
        methods: ['GET', 'POST']
    }
});

const userSocketMap = {}; 
console.log("Initial UserSocketMap:", userSocketMap);





// Handle socket connection
io.on('connection', (socket) => {
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

    // Handle incoming video call from User1 to User2
    socket.on('callUser', ({ fromUserId, toUserId, roomId }) => {
        const receiverSocketId = userSocketMap[toUserId];
        if (receiverSocketId) {
            console.log(`Calling user: ${toUserId} from: ${fromUserId} in room: ${roomId}`);
            io.to(receiverSocketId).emit('incomingCall', {
                fromUserId,
                roomId
            });
        } else {
            console.log(`Receiver ${toUserId} not found in userSocketMap.`);
        }
    });

    // Handle the event when User2 accepts the call
    socket.on('acceptCall', ({ fromUserId, toUserId, roomId }) => {
        const callerSocketId = userSocketMap[fromUserId];
        if (callerSocketId) {
            console.log(`User ${toUserId} accepted call from ${fromUserId}`);
            io.to(callerSocketId).emit('callAccepted', {
                fromUserId,
                toUserId,
                roomId,
            });
        }
    });

    // Handle socket disconnection
    socket.on('disconnect', () => {
        if (userId) {
            console.log(`User disconnected: ${userId} with socket ID: ${socket.id}`);
            delete userSocketMap[userId]; // Remove the user from the map
            console.log("Updated UserSocketMap after disconnect:", userSocketMap);
        }
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    });
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
