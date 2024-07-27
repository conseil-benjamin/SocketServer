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

// faire un objet room avec qui contient un numéro de room, l'ensemble des users avec leur points associés, les messages ainsi que les règles de la room
// faire un système de mise à jour des points des users
const rooms = {};

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomName, username }) => {
        socket.join(roomName);

        if (!rooms[roomName]) {
            rooms[roomName] = { users: [{
                username, points: 0
                }], messages: [], roomName: roomName};
        } else if (!rooms[roomName].users.find(user => user.username === username)) {
            rooms[roomName].users.push({ username, points: 0 });
        }

        io.to(roomName).emit('roomData', rooms[roomName]);
        io.to(roomName).emit('message', { username: 'system', text: `${username} has joined the room.`, timestamp: new Date() });
        console.log(rooms);
    });

    socket.on('createRoom', ({ roomName, username, privateRoom }) => {
        socket.join(roomName);
        const code = generateRandomCode();
        console.log(code);
        rooms[roomName] = { users: [{
                username, points: 0
            }], messages: [], roomName: roomName, private: privateRoom, roomCode: code };

        io.to(roomName).emit('roomData', rooms[roomName]);
        console.log(rooms);
    });

    socket.on('leaveRoom', ({ roomName, username }) => {
        socket.leave(roomName);

        if (rooms[roomName]) {
            rooms[roomName].users = rooms[roomName].users.filter(user => user !== username);
            io.to(roomName).emit('roomData', rooms[roomName]);
            io.to(roomName).emit('message', { username: 'system', text: `${username} has left the room.`, timestamp: new Date() });

            if (rooms[roomName].users.length === 0) {
                delete rooms[roomName];
            }
        }
        console.log(rooms);
    });
    socket.on('sendMessage', ({ roomName, username, text }) => {
        if (rooms[roomName]) {
            const message = { username, text, timestamp: new Date() };
            console.log(message);
            rooms[roomName].messages.push(message);
            io.to(roomName).emit('message', message);
        }
        console.log(rooms);
    });
});

function generateRandomCode() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charactersLength = characters.length;
    for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

app.get('/rooms', (req, res) => {
    const roomsArray = Object.entries(rooms).map(([roomId, roomData]) => ({
        roomId,
        ...roomData
    }));
    res.send(roomsArray);
});

server.listen(3001, () => {
    console.log('Server listening on port 3001');
});
