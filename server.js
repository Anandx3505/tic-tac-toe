const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const rooms = new Map();
const playerSockets = new Map();

class GameRoom {
    constructor(roomId, creatorId) {
        this.roomId = roomId;
        this.players = [creatorId];
        this.gameBoard = new Array(9).fill(0);
        this.currentPlayer = 'X';
        this.gameStarted = false;
        this.spectators = [];
        this.playerSymbols = { [creatorId]: 'X' };
        this.xMoves = [];
        this.oMoves = [];
        this.twistMode = false;
    }

    addPlayer(playerId) {
        if (this.players.length < 2) {
            this.players.push(playerId);
            this.playerSymbols[playerId] = 'O';
            this.gameStarted = true;
            return true;
        }
        return false;
    }

    addSpectator(spectatorId) {
        this.spectators.push(spectatorId);
    }

    removePlayer(playerId) {
        this.players = this.players.filter(p => p !== playerId);
        this.spectators = this.spectators.filter(s => s !== playerId);
        delete this.playerSymbols[playerId];
    }

    makeMove(playerId, index) {
        if (!this.gameStarted) return { success: false, error: 'Game not started' };
        if (this.playerSymbols[playerId] !== this.currentPlayer) {
            return { success: false, error: 'Not your turn' };
        }
        if (this.gameBoard[index] !== 0) {
            return { success: false, error: 'Cell already occupied' };
        }

        this.gameBoard[index] = this.currentPlayer;

        if (this.twistMode) {
            if (this.currentPlayer === 'X') {
                this.xMoves.push(index);
                if (this.xMoves.length > 3) {
                    const oldIndex = this.xMoves.shift();
                    this.gameBoard[oldIndex] = 0;
                }
            } else {
                this.oMoves.push(index);
                if (this.oMoves.length > 3) {
                    const oldIndex = this.oMoves.shift();
                    this.gameBoard[oldIndex] = 0;
                }
            }
        }

        const winner = this.checkWin();
        const isDraw = !this.gameBoard.includes(0) && !winner;

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';

        return {
            success: true,
            gameBoard: this.gameBoard,
            currentPlayer: this.currentPlayer,
            winner,
            isDraw,
            xMoves: this.xMoves,
            oMoves: this.oMoves
        };
    }

    checkWin() {
        const winSequences = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (let seq of winSequences) {
            const [a, b, c] = seq;
            if (this.gameBoard[a] !== 0 &&
                this.gameBoard[a] === this.gameBoard[b] &&
                this.gameBoard[a] === this.gameBoard[c]) {
                return this.gameBoard[a];
            }
        }
        return null;
    }

    reset() {
        this.gameBoard = new Array(9).fill(0);
        this.currentPlayer = 'X';
        this.xMoves = [];
        this.oMoves = [];
    }

    toggleTwistMode() {
        this.twistMode = !this.twistMode;
        this.reset();
        return this.twistMode;
    }

    getState() {
        return {
            roomId: this.roomId,
            players: this.players.map(p => ({
                id: p,
                symbol: this.playerSymbols[p]
            })),
            gameBoard: this.gameBoard,
            currentPlayer: this.currentPlayer,
            gameStarted: this.gameStarted,
            spectatorCount: this.spectators.length,
            twistMode: this.twistMode,
            xMoves: this.xMoves,
            oMoves: this.oMoves
        };
    }
}

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    socket.on('createRoom', () => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = new GameRoom(roomId, socket.id);
        rooms.set(roomId, room);
        playerSockets.set(socket.id, roomId);
        
        socket.join(roomId);
        socket.emit('roomCreated', { roomId, state: room.getState() });
        console.log(`Room created: ${roomId} by ${socket.id}`);
    });

    socket.on('joinRoom', (roomId) => {
        const room = rooms.get(roomId);
        
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        if (room.addPlayer(socket.id)) {
            playerSockets.set(socket.id, roomId);
            socket.join(roomId);
            io.to(roomId).emit('playerJoined', room.getState());
            console.log(`Player ${socket.id} joined room ${roomId}`);
        } else {
            room.addSpectator(socket.id);
            playerSockets.set(socket.id, roomId);
            socket.join(roomId);
            socket.emit('spectatorMode', room.getState());
            console.log(`Spectator ${socket.id} joined room ${roomId}`);
        }
    });

    socket.on('makeMove', (index) => {
        const roomId = playerSockets.get(socket.id);
        const room = rooms.get(roomId);

        if (!room) return;

        const result = room.makeMove(socket.id, index);
        
        if (result.success) {
            io.to(roomId).emit('moveMade', {
                index,
                player: room.playerSymbols[socket.id],
                gameBoard: result.gameBoard,
                currentPlayer: result.currentPlayer,
                winner: result.winner,
                isDraw: result.isDraw,
                xMoves: result.xMoves,
                oMoves: result.oMoves
            });
        } else {
            socket.emit('error', { message: result.error });
        }
    });

    socket.on('resetGame', () => {
        const roomId = playerSockets.get(socket.id);
        const room = rooms.get(roomId);

        if (room) {
            room.reset();
            io.to(roomId).emit('gameReset', room.getState());
        }
    });

    socket.on('toggleTwistMode', () => {
        const roomId = playerSockets.get(socket.id);
        const room = rooms.get(roomId);

        if (room) {
            const twistMode = room.toggleTwistMode();
            io.to(roomId).emit('twistModeToggled', { twistMode, state: room.getState() });
        }
    });

    socket.on('leaveRoom', () => {
        const roomId = playerSockets.get(socket.id);
        const room = rooms.get(roomId);

        if (room) {
            room.removePlayer(socket.id);
            socket.leave(roomId);
            playerSockets.delete(socket.id);

            if (room.players.length === 0 && room.spectators.length === 0) {
                rooms.delete(roomId);
                console.log(`Room ${roomId} deleted (empty)`);
            } else {
                io.to(roomId).emit('playerLeft', room.getState());
            }
        }
    });

    socket.on('disconnect', () => {
        const roomId = playerSockets.get(socket.id);
        const room = rooms.get(roomId);

        if (room) {
            room.removePlayer(socket.id);
            playerSockets.delete(socket.id);

            if (room.players.length === 0 && room.spectators.length === 0) {
                rooms.delete(roomId);
                console.log(`Room ${roomId} deleted (empty)`);
            } else {
                io.to(roomId).emit('playerLeft', room.getState());
            }
        }

        console.log(`Player disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
