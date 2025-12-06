const socketIo = require('socket.io');

let io;

const init = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*", // Allow all origins for mobile app
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('🔌 New client connected:', socket.id);

        // Join stories feed for real-time updates
        socket.on('join_stories', () => {
            socket.join('stories_feed');
            console.log(`Socket ${socket.id} joined stories_feed`);
        });

        // Join specific story room for real-time updates
        socket.on('join_story', (storyId) => {
            socket.join(`story_${storyId}`);
            console.log(`Socket ${socket.id} joined story_${storyId}`);
        });

        socket.on('leave_story', (storyId) => {
            socket.leave(`story_${storyId}`);
            console.log(`Socket ${socket.id} left story_${storyId}`);
        });

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
            console.log('🔌 Client disconnected:', socket.id);
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

// Emit to a specific room
const emitEvent = (room, event, data) => {
    if (io) {
        io.to(room).emit(event, data);
    }
};

// Broadcast to all connected clients
const broadcast = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

// Story-specific events
const emitStoryUpdate = (storyId, eventType, data) => {
    if (io) {
        // Emit to specific story room
        io.to(`story_${storyId}`).emit('story_update', { storyId, eventType, ...data });
        // Also emit to stories feed
        io.to('stories_feed').emit('story_update', { storyId, eventType, ...data });
    }
};

const emitNewStory = (story) => {
    if (io) {
        io.to('stories_feed').emit('new_story', story);
    }
};

const emitStoryLike = (storyId, likesCount, userId) => {
    if (io) {
        io.emit('story_liked', { storyId, likesCount, userId });
    }
};

const emitStorySave = (storyId, userId) => {
    if (io) {
        io.emit('story_saved', { storyId, userId });
    }
};

module.exports = {
    init,
    getIo,
    emitEvent,
    broadcast,
    emitStoryUpdate,
    emitNewStory,
    emitStoryLike,
    emitStorySave
};
