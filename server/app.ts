/**
 * Rough outline of the server for multiplayer
 * No database yet
 */

import express, {type Request, type Response} from 'express';
import {resolve} from 'path';
import {createServer} from 'http';
import {Server} from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve built frontend from dist
app.use(express.static('dist'));

type Mark = 'X' | 'O';
type Room = {
   players: string[];
   playerMarks: Map<string, Mark>;
   currentPlayer: Mark;
   placedMarks: Map<string, Mark>;
   isGameOver: boolean;
   rematchRequested: Set<string>;
   lastWinner: Mark | null;
};

const rooms: Map<string, Room> = new Map();

const MARKS = {
   X: 'X' as Mark,
   O: 'O' as Mark,
};

io.on('connection', socket => {
   socket.on('createRoom', () => {
      const roomId = Math.random().toString(36).substring(2, 8);
      rooms.set(roomId, {
         players: [socket.id],
         playerMarks: new Map([[socket.id, MARKS.X]]),
         currentPlayer: MARKS.X,
         placedMarks: new Map(),
         isGameOver: false,
         rematchRequested: new Set(),
         lastWinner: null,
      });
      socket.join(roomId);
      socket.emit('roomCreated', roomId);
   });

   socket.on('joinRoom', roomId => {
      const room = rooms.get(roomId);
      if (!room) {
         socket.emit('error', 'Room not found');
         return;
      }

      if (room.players.length >= 2) {
         socket.emit('error', 'Room is full');
         return;
      }

      socket.join(roomId);
      room.players.push(socket.id);
      room.playerMarks.set(socket.id, MARKS.O);

      socket.emit('gameJoined', {
         mark: MARKS.O,
         roomId,
      });

      socket.to(roomId).emit('opponentJoined');
   });

   socket.on('placeMark', ({roomId, cellX, cellY}) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const coordKey = `${cellX},${cellY}`;
      if (room.placedMarks.has(coordKey)) return;

      const playerMark = room.playerMarks.get(socket.id);
      if (playerMark !== room.currentPlayer) return;

      room.rematchRequested.clear();

      room.placedMarks.set(coordKey, playerMark);
      room.currentPlayer = room.currentPlayer === MARKS.X ? MARKS.O : MARKS.X;

      io.in(roomId).emit('markPlaced', {
         cellX,
         cellY,
         player: playerMark,
         nextPlayer: room.currentPlayer,
      });
   });

   socket.on('gameWon', ({roomId, winner}) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.isGameOver = true;
      room.lastWinner = winner;
   });

   socket.on('disconnect', () => {
      const roomsToUpdate: string[] = [];
      rooms.forEach((room, roomId: string) => {
         if (room.players.includes(socket.id)) {
            roomsToUpdate.push(roomId);
         }
      });

      roomsToUpdate.forEach((roomId: string) => {
         const room = rooms.get(roomId);
         if (!room) return;

         room.rematchRequested.clear();
         room.isGameOver = true;

         room.players = room.players.filter((id: string) => id !== socket.id);
         room.playerMarks.delete(socket.id);

         if (room.players.length === 0) {
            rooms.delete(roomId);
         } else {
            io.to(roomId).emit('opponentLeft');
         }
      });
   });

   socket.on('requestRematch', ({roomId}) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.rematchRequested.clear();
      room.rematchRequested.add(socket.id);

      const opponent = room.players.find((id: string) => id !== socket.id);
      if (opponent && room.rematchRequested.has(opponent)) {
         room.rematchRequested.clear();

         room.players.forEach((playerId: string) => {
            const playerMark = room.playerMarks.get(playerId) ?? MARKS.O;
            const shouldBeX = playerMark === room.lastWinner;
            room.playerMarks.set(playerId, shouldBeX ? MARKS.X : MARKS.O);
         });

         room.currentPlayer = MARKS.X;
         room.placedMarks.clear();
         room.isGameOver = false;
         room.lastWinner = null;

         room.players.forEach((playerId: string) => {
            const playerMark = room.playerMarks.get(playerId) ?? MARKS.O;
            const isYourTurn = playerMark === MARKS.X;
            io.to(playerId).emit('rematchAccepted', {
               mark: playerMark,
               isYourTurn,
            });
         });
         return;
      }
      if (opponent) {
         io.to(opponent).emit('rematchRequested');
      }
   });

   socket.on('acceptRematch', ({roomId}) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.players.forEach((playerId: string) => {
         const playerMark = room.playerMarks.get(playerId) ?? MARKS.O;
         const shouldBeX = playerMark === room.lastWinner;
         room.playerMarks.set(playerId, shouldBeX ? MARKS.X : MARKS.O);
      });

      room.currentPlayer = MARKS.X;
      room.placedMarks.clear();
      room.isGameOver = false;
      room.lastWinner = null;

      room.players.forEach((playerId: string) => {
         const playerMark = room.playerMarks.get(playerId) ?? MARKS.O;
         io.to(playerId).emit('rematchAccepted', {
            mark: playerMark,
            isYourTurn: playerMark === MARKS.X,
         });
      });
   });

   socket.on('declineRematch', ({roomId}) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.rematchRequested.clear();
      const requestingPlayer = room.players.find((id: string) => id !== socket.id);
      if (requestingPlayer) {
         io.to(requestingPlayer).emit('rematchDeclined');
      }
   });

   socket.on('cancelRematch', ({roomId}) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.rematchRequested.delete(socket.id);
      socket.to(roomId).emit('rematchCancelled');
   });

   socket.on('leaveRoom', ({roomId}) => {
      const room = rooms.get(roomId);
      if (!room) return;

      socket.leave(roomId);
      room.players = room.players.filter((id: string) => id !== socket.id);
      room.playerMarks.delete(socket.id);
      room.rematchRequested.delete(socket.id);

      if (room.players.length === 0) {
         rooms.delete(roomId);
      } else {
         room.isGameOver = true;
         io.to(roomId).emit('opponentLeft');
      }
   });

   socket.on('rejoinRoom', ({roomId, playerId}) => {
      const room = rooms.get(roomId);
      if (!room) {
         socket.emit('opponentLeft');
         return;
      }

      for (const [existingRoomId, existingRoom] of rooms.entries()) {
         if (existingRoom.players.includes(socket.id) && existingRoomId !== roomId) {
            socket.leave(existingRoomId);
            existingRoom.players = existingRoom.players.filter((id: string) => id !== socket.id);
            existingRoom.playerMarks.delete(socket.id);
            existingRoom.rematchRequested.delete(socket.id);
         }
      }

      const wasInRoom = room.players.includes(playerId);
      const currentPlayerCount = room.players.length;

      if (currentPlayerCount >= 2 && !wasInRoom) {
         socket.emit('error', 'Room is full');
         return;
      }

      if (wasInRoom) {
         const playerIndex = room.players.indexOf(playerId);
         room.players[playerIndex] = socket.id;
         const playerMark = room.playerMarks.get(playerId) ?? MARKS.O;
         room.playerMarks.delete(playerId);
         room.playerMarks.set(socket.id, playerMark);
      } else {
         room.players.push(socket.id);
         room.playerMarks.set(socket.id, currentPlayerCount === 0 ? MARKS.X : MARKS.O);
      }

      socket.join(roomId);

      const placedMarks: {x: number; y: number; player: Mark}[] = [];
      for (const [coord, player] of room.placedMarks.entries()) {
         const [xs, ys] = coord.split(',');
         const x = Number(xs);
         const y = Number(ys);
         placedMarks.push({x, y, player});
      }

      const otherPlayer = room.players.find((id: string) => id !== socket.id);
      if (otherPlayer) {
         socket.to(otherPlayer).emit('opponentJoined');
      }

      socket.emit('roomRejoined', {
         roomId,
         mark: room.playerMarks.get(socket.id),
         isYourTurn: room.currentPlayer === room.playerMarks.get(socket.id),
         isGameOver: room.isGameOver,
         placedMarks,
      });
   });

   socket.on('checkRoom', ({roomId}, callback) => {
      const roomExists = rooms.has(roomId);
      callback(roomExists);
   });
});

app.get('/invite/:roomId', (req: Request<{roomId: string}>, res: Response) => {
   const roomId = req.params.roomId as string;
   const room = rooms.get(roomId);

   if (!room) {
      res.redirect('/?error=room-not-found');
      return;
   }

   if (room.players.length >= 2) {
      res.redirect('/?error=room-full');
      return;
   }

   res.redirect(`/?join=${roomId}`);
});

// SPA fallback for other routes in dev/prod
app.get('*', (_req: Request, res: Response) => {
   res.sendFile(resolve(process.cwd(), 'dist', 'index.html'));
});

const PORT = 3000;
server.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});
