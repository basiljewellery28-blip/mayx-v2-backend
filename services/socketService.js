const socketIo = require('socket.io');

let io;

const init = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "http://localhost:3000", // Frontend URL
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join_brief', (briefId) => {
            socket.join(`brief_${briefId}`);
            console.log(`Socket ${socket.id} joined brief_${briefId}`);
        });

        socket.on('join_user', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`Socket ${socket.id} joined user_${userId}`);
        });

        socket.on('leave_brief', (briefId) => {
            socket.leave(`brief_${briefId}`);
            console.log(`Socket ${socket.id} left brief_${briefId}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

const emitEvent = (room, event, data) => {
    if (io) {
        io.to(room).emit(event, data);
    }
}

module.exports = { init, getIo, emitEvent };
