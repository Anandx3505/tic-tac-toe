# Tic-Tac-Toe (Web)

A small browser-based Tic-Tac-Toe game with local AI, Player-vs-Player, and an optional "Twist Mode" where each player keeps only their last 3 moves.

## 🚀 Features

- **Player vs Player** and **Player vs AI** modes
- **AI difficulty levels:** easy, medium, hard
- **Twist Mode:** each player keeps only 3 moves; the oldest move disappears
- Local game statistics (wins/draws/losses) persisted to `localStorage`
- Minimal, dependency-free frontend; optional Node server for multiplayer rooms

## 🧭 Project structure

- `index.html` — main web page
- `game.js` — game logic and AI implementation
- `game-style.css` — styles
- `server.js` — simple Express + Socket.IO server for multiplayer rooms

## 💻 Prerequisites

- Node.js (for running the server)
- A modern web browser (desktop recommended)

## ⚙️ Install & Run (local server)

1. Open a terminal in the project directory
2. Install dependencies (if you plan to use the server):

   ```bash
   npm install express socket.io
   ```

3. Start the server:

   ```bash
   node server.js
   ```

4. Open your browser and go to: `http://localhost:3000`

> If you prefer, you can also open `index.html` directly in the browser for a single-player experience.

## 🎮 How to play

- Click cells to place your mark.
- Switch between **Player vs Player** and **Player vs AI** in the mode selector.
- When playing vs AI, change difficulty under **Difficulty** (easy/medium/hard).
- Toggle **Twist Mode** (top-right switch) to enable the mode where only the last 3 moves per player are kept.
- Press **Reset Game** to start over.

## 📊 Stats

When playing vs AI, wins/draws/losses are saved to `localStorage` and shown in the UI.

## 🧩 Notes

- The AI uses a mixture of heuristics and an optimized minimax with alpha-beta pruning on higher difficulty.
- The server included is a simple reference server to demonstrate room-based multiplayer and does not include authentication or production hardening.

## 📝 License

This project has no license file. Add one (for example, `MIT`) if you plan to publish or share it.
