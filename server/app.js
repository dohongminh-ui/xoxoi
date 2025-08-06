/** 
 * Rough outline of the server for multiplayer
 * No database yet
 */

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = new Map();

const MARKS = {
   X: "X",
   O: "O"
};

io.on("connection", (socket) => {
   socket.on("createRoom", () => {
      const roomId = Math.random().toString(36).substring(2, 8);
      rooms.set(roomId, {
         players: [socket.id],
         playerMarks: new Map([[socket.id, MARKS.X]]),
         currentPlayer: MARKS.X,
         placedMarks: new Map(),
         isGameOver: false,
         rematchRequested: new Set(),
         lastWinner: null
      });
      socket.join(roomId);
      socket.emit("roomCreated", roomId);
   });

   socket.on("joinRoom", (roomId) => {
      const room = rooms.get(roomId);
      if (!room) {
         socket.emit("error", "Room not found");
         return;
      }

      if (room.players.length >= 2) {
         socket.emit("error", "Room is full");
         return;
      }

      socket.join(roomId);
      room.players.push(socket.id);
      room.playerMarks.set(socket.id, MARKS.O);

      socket.emit("gameJoined", {
         mark: MARKS.O,
         roomId
      });

      socket.to(roomId).emit("opponentJoined");
   });

   socket.on("placeMark", ({ roomId, cellX, cellY }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const coordKey = `${cellX},${cellY}`;
      if (room.placedMarks.has(coordKey)) return;

      const playerMark = room.playerMarks.get(socket.id);
      if (playerMark !== room.currentPlayer) return;

      room.rematchRequested.clear();

      room.placedMarks.set(coordKey, playerMark);
      room.currentPlayer = room.currentPlayer === MARKS.X ? MARKS.O : MARKS.X;

      io.in(roomId).emit("markPlaced", {
         cellX,
         cellY,
         player: playerMark,
         nextPlayer: room.currentPlayer
      });
   });

   socket.on("gameWon", ({ roomId, winner }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.isGameOver = true;
      room.lastWinner = winner;
   });

   socket.on("disconnect", () => {
      const roomsToUpdate = [];
      rooms.forEach((room, roomId) => {
         if (room.players.includes(socket.id)) {
            roomsToUpdate.push(roomId);
         }
      });

      roomsToUpdate.forEach(roomId => {
         const room = rooms.get(roomId);
         if (!room) return;

         room.rematchRequested.clear();
         room.isGameOver = true;

         room.players = room.players.filter(id => id !== socket.id);
         room.playerMarks.delete(socket.id);

         if (room.players.length === 0) {
            rooms.delete(roomId);
         } else {
            io.to(roomId).emit("opponentLeft");
         }
      });
   });

   socket.on("requestRematch", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.rematchRequested.clear();
      room.rematchRequested.add(socket.id);

      const opponent = room.players.find(id => id !== socket.id);
      if (room.rematchRequested.has(opponent)) {
         room.rematchRequested.clear();

         room.players.forEach(playerId => {
            const playerMark = room.playerMarks.get(playerId);
            const shouldBeX = playerMark === room.lastWinner;
            room.playerMarks.set(playerId, shouldBeX ? MARKS.X : MARKS.O);
         });

         room.currentPlayer = MARKS.X;
         room.placedMarks.clear();
         room.isGameOver = false;
         room.lastWinner = null;

         room.players.forEach(playerId => {
            const playerMark = room.playerMarks.get(playerId);
            const isYourTurn = playerMark === MARKS.X;
            io.to(playerId).emit("rematchAccepted", {
               mark: playerMark,
               isYourTurn
            });
         });
         return;
      }
      io.to(opponent).emit("rematchRequested");
   });

   socket.on("acceptRematch", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.players.forEach(playerId => {
         const playerMark = room.playerMarks.get(playerId);
         const shouldBeX = playerMark === room.lastWinner;
         room.playerMarks.set(playerId, shouldBeX ? MARKS.X : MARKS.O);
      });

      room.currentPlayer = MARKS.X;
      room.placedMarks.clear();
      room.isGameOver = false;
      room.lastWinner = null;

      room.players.forEach(playerId => {
         const playerMark = room.playerMarks.get(playerId);
         io.to(playerId).emit("rematchAccepted", {
            mark: playerMark,
            isYourTurn: playerMark === MARKS.X
         });
      });
   });

   socket.on("declineRematch", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.rematchRequested.clear();
      const requestingPlayer = room.players.find(id => id !== socket.id);
      if (requestingPlayer) {
         io.to(requestingPlayer).emit("rematchDeclined");
      }
   });

   socket.on("cancelRematch", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.rematchRequested.delete(socket.id);
      socket.to(roomId).emit("rematchCancelled");
   });

   socket.on("leaveRoom", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      socket.leave(roomId);
      room.players = room.players.filter(id => id !== socket.id);
      room.playerMarks.delete(socket.id);
      room.rematchRequested.delete(socket.id);

      if (room.players.length === 0) {
         rooms.delete(roomId);
      } else {
         room.isGameOver = true;
         io.to(roomId).emit("opponentLeft");
      }
   });

   socket.on("rejoinRoom", ({ roomId, playerId }) => {
      const room = rooms.get(roomId);
      if (!room) {
         socket.emit("opponentLeft");
         return;
      }

      for (const [existingRoomId, existingRoom] of rooms.entries()) {
         if (existingRoom.players.includes(socket.id) && existingRoomId !== roomId) {
            socket.leave(existingRoomId);
            existingRoom.players = existingRoom.players.filter(id => id !== socket.id);
            existingRoom.playerMarks.delete(socket.id);
            existingRoom.rematchRequested.delete(socket.id);
         }
      }

      const wasInRoom = room.players.includes(playerId);
      const currentPlayerCount = room.players.length;

      if (currentPlayerCount >= 2 && !wasInRoom) {
         socket.emit("error", "Room is full");
         return;
      }

      if (wasInRoom) {
         const playerIndex = room.players.indexOf(playerId);
         room.players[playerIndex] = socket.id;
         const playerMark = room.playerMarks.get(playerId);
         room.playerMarks.delete(playerId);
         room.playerMarks.set(socket.id, playerMark);
      } else {
         room.players.push(socket.id);
         room.playerMarks.set(socket.id, currentPlayerCount === 0 ? MARKS.X : MARKS.O);
      }

      socket.join(roomId);

      const placedMarks = Array.from(room.placedMarks.entries()).map(([coord, player]) => {
         const [x, y] = coord.split(",").map(Number);
         return { x, y, player };
      });

      const otherPlayer = room.players.find(id => id !== socket.id);
      if (otherPlayer) {
         socket.to(otherPlayer).emit("opponentJoined");
      }

      socket.emit("roomRejoined", {
         roomId,
         mark: room.playerMarks.get(socket.id),
         isYourTurn: room.currentPlayer === room.playerMarks.get(socket.id),
         isGameOver: room.isGameOver,
         placedMarks
      });
   });

   socket.on("checkRoom", ({ roomId }, callback) => {
      const roomExists = rooms.has(roomId);
      callback(roomExists);
   });
});

app.get("/invite/:roomId", (req, res) => {
   const roomId = req.params.roomId;
   const room = rooms.get(roomId);

   if (!room) {
      res.redirect("/?error=room-not-found");
      return;
   }

   if (room.players.length >= 2) {
      res.redirect("/?error=room-full");
      return;
   }

   res.redirect(`/?join=${roomId}`);
});

const PORT = 3000;
server.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});