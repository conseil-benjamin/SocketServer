const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');

const cors = require('cors');
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('join_room', (data) => {
        socket.join(data.roomNumber);
        socket.to(data.roomNumber).emit('user_connect', data);
        console.log(`User joined room ${data.roomNumber}`);
    });

    socket.on('leave', (room) => {
        console.log('user disconnected');
        socket.leave(room);
        socket.to(room).emit('user_disconnect', {pseudo: 'Utilisateur'});
    });
    socket.on('send_message', (data) => {
        console.log(data);
        socket.to(data.roomNumber).emit('receive_message', data);
    });
});

server.listen(3001, () => {
    console.log('Server listening on port 3001');
});
