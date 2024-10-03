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

const userSocketMap = {}; // This map stores socket ID corresponding to the user ID; userId -> socketId


exports.getReceiverSocketId = (receiverId) => userSocketMap[receiverId];

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    socket.on('disconnect', () => {
        if (userId) {
            delete userSocketMap[userId];
        }
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    });
});

module.exports = { app, server, io };
