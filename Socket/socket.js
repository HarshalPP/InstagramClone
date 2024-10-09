const { Server } = require("socket.io");
const express = require("express");
const http = require("http");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'https://instagram-clone-cyan-five.vercel.app ',
        methods: ['GET', 'POST']
    }
});

const userSocketMap = {}; 

// This map stores socket ID corresponding to the user ID; userId -> socketId //

exports.getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    // Handle the Video call //

    socket.on('callUser' , ({fromUserId , toUserId , roomId})=>{
        const ReceiverSocketId = userSocketMap[toUserId]
        if(ReceiverSocketId){
            io.to(ReceiverSocketId).emit('incomingCall',{
                fromUserId,
                roomId
            })
        }
    })

       // Handle the event when User2 accepts the call
       socket.on('acceptCall', ({ fromUserId, toUserId, roomId }) => {
        const callerSocketId = userSocketMap[fromUserId];

        if (callerSocketId) {
            // Notify the caller that the call has been accepted
            io.to(callerSocketId).emit('callAccepted', {
                fromUserId,
                toUserId,
                roomId,
            });
        }
    });

    socket.on('disconnect', () => {
        if (userId) {
            delete userSocketMap[userId];
        }
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    });
});


console.log("UserSocketMap" ,userSocketMap )

module.exports = { app, server, io };
