import {GAME_CONSTANTS} from '../core/constants.js';

/**
 * NetworkManager handles all multiplayer networking functionality
 * Including socket connections, room management, move synchronization, and reconnection
 * TODO: Actually implement server-side logic for multiplayer
 */
export class NetworkManager extends EventTarget {
   constructor() {
      super();

      // Connection state
      this.socket = null;
      this.isConnected = false;
      this.isReconnecting = false;

      // Game state
      this.roomId = null;
      this.playerMark = null;
      this.isMyTurn = false;
      this.hasOpponent = false;
      this.isGameOver = false;

      // Connection tracking
      this.connectionAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.reconnectDelay = 1000;

      this.initializeSocket();
   }

   /**
    * Initialize socket connection and set up event listeners
    */
   initializeSocket() {
      if (typeof io === 'undefined') {
         console.warn('Socket.io not available, multiplayer disabled');
         return;
      }

      this.socket = io();
      this.setupSocketEventListeners();
   }

   /**
    * Set up all socket event listeners
    */
   setupSocketEventListeners() {
      if (!this.socket) return;

      // Connection events
      this.socket.on('connect', () => {
         console.log('Connected to server with ID:', this.socket.id);
         this.isConnected = true;
         this.isReconnecting = false;
         this.connectionAttempts = 0;

         this.dispatchEvent(
            new CustomEvent('connected', {
               detail: {socketId: this.socket.id},
            })
         );

         // Attempt to rejoin room if we were in one
         if (this.roomId) {
            this.attemptRoomRejoin();
         }
      });

      this.socket.on('disconnect', reason => {
         console.log('Disconnected from server. Reason:', reason);
         this.isConnected = false;

         this.dispatchEvent(
            new CustomEvent('disconnected', {
               detail: {reason},
            })
         );
      });

      this.socket.on('connect_error', error => {
         console.log('Connection error:', error);
         this.dispatchEvent(
            new CustomEvent('connectionError', {
               detail: {error},
            })
         );
      });

      // Reconnection events
      this.socket.io.on('reconnect', attempts => {
         console.log('Reconnected to server after', attempts, 'attempts');
         this.isReconnecting = false;

         this.dispatchEvent(
            new CustomEvent('reconnected', {
               detail: {attempts},
            })
         );
      });

      this.socket.io.on('reconnect_attempt', attempt => {
         console.log('Attempting to reconnect:', attempt);
         this.isReconnecting = true;
         this.connectionAttempts = attempt;

         this.dispatchEvent(
            new CustomEvent('reconnectAttempt', {
               detail: {attempt},
            })
         );
      });

      this.socket.io.on('reconnect_error', error => {
         console.log('Reconnection error:', error);
         this.dispatchEvent(
            new CustomEvent('reconnectError', {
               detail: {error},
            })
         );
      });

      this.socket.io.on('reconnect_failed', () => {
         console.log('Failed to reconnect to server');
         this.isReconnecting = false;

         this.dispatchEvent(
            new CustomEvent('reconnectFailed', {
               detail: {roomId: this.roomId},
            })
         );
      });

      // Game events
      this.setupGameEventListeners();
   }

   /**
    * Set up game-specific socket event listeners
    */
   setupGameEventListeners() {
      if (!this.socket) return;

      // Room management
      this.socket.on('roomCreated', roomId => {
         console.log('Room created:', roomId);
         this.roomId = roomId;
         this.playerMark = 'X';
         this.isMyTurn = true;
         this.hasOpponent = false;
         this.isGameOver = false;

         // Store player ID for reconnection
         localStorage.setItem(`room_${roomId}_playerId`, this.socket.id);

         this.dispatchEvent(
            new CustomEvent('roomCreated', {
               detail: {
                  roomId,
                  playerMark: this.playerMark,
                  isMyTurn: this.isMyTurn,
                  inviteUrl: `${window.location.origin}/invite/${roomId}`,
               },
            })
         );
      });

      this.socket.on('gameJoined', data => {
         console.log('Joined game:', data);
         this.playerMark = typeof data === 'object' ? data.mark : data;
         this.roomId = typeof data === 'object' ? data.roomId : null;
         this.isMyTurn = this.playerMark === 'X';
         this.hasOpponent = true;
         this.isGameOver = false;

         if (this.roomId) {
            localStorage.setItem(
               `room_${this.roomId}_playerId`,
               this.socket.id
            );
         }

         this.dispatchEvent(
            new CustomEvent('gameJoined', {
               detail: {
                  roomId: this.roomId,
                  playerMark: this.playerMark,
                  isMyTurn: this.isMyTurn,
                  hasOpponent: this.hasOpponent,
               },
            })
         );
      });

      this.socket.on('opponentJoined', () => {
         console.log('Opponent joined the game');
         this.hasOpponent = true;

         this.dispatchEvent(
            new CustomEvent('opponentJoined', {
               detail: {hasOpponent: this.hasOpponent},
            })
         );
      });

      this.socket.on('opponentLeft', () => {
         console.log('Opponent left the game');
         this.hasOpponent = false;
         this.isGameOver = true;

         this.dispatchEvent(
            new CustomEvent('opponentLeft', {
               detail: {hasOpponent: this.hasOpponent},
            })
         );
      });

      // Move synchronization
      this.socket.on('markPlaced', data => {
         const {cellX, cellY, player, nextPlayer} = data;
         console.log('Received move:', data);

         this.isMyTurn = nextPlayer === this.playerMark;

         this.dispatchEvent(
            new CustomEvent('moveReceived', {
               detail: {
                  cellX,
                  cellY,
                  player,
                  nextPlayer,
                  isMyTurn: this.isMyTurn,
               },
            })
         );
      });

      this.socket.on('gameWon', data => {
         const {winner} = data;
         console.log('Game won by:', winner);
         this.isGameOver = true;

         this.dispatchEvent(
            new CustomEvent('gameWon', {
               detail: {
                  winner,
                  isWinner: winner === this.playerMark,
               },
            })
         );
      });

      // Room rejoining
      this.socket.on('roomRejoined', data => {
         console.log('Room rejoined:', data);
         this.roomId = data.roomId;
         this.playerMark = data.mark;
         this.isMyTurn = data.isYourTurn;
         this.isGameOver = data.isGameOver;
         this.hasOpponent = true;

         this.dispatchEvent(
            new CustomEvent('roomRejoined', {
               detail: {
                  roomId: this.roomId,
                  playerMark: this.playerMark,
                  isMyTurn: this.isMyTurn,
                  isGameOver: this.isGameOver,
                  placedMarks: data.placedMarks,
               },
            })
         );
      });

      // Rematch functionality
      this.socket.on('rematchRequested', () => {
         this.dispatchEvent(new CustomEvent('rematchRequested'));
      });

      this.socket.on('rematchAccepted', data => {
         if (data) {
            this.playerMark = data.mark;
            this.isMyTurn = data.isYourTurn;
            this.isGameOver = false;
            this.hasOpponent = true;
         }

         this.dispatchEvent(
            new CustomEvent('rematchAccepted', {
               detail: {
                  playerMark: this.playerMark,
                  isMyTurn: this.isMyTurn,
               },
            })
         );
      });

      this.socket.on('rematchDeclined', () => {
         this.dispatchEvent(new CustomEvent('rematchDeclined'));
      });

      this.socket.on('rematchCancelled', () => {
         this.dispatchEvent(new CustomEvent('rematchCancelled'));
      });

      // Error handling
      this.socket.on('error', error => {
         console.error('Socket error:', error);
         this.dispatchEvent(
            new CustomEvent('error', {
               detail: {error},
            })
         );
      });
   }

   /**
    * Create a new multiplayer room
    */
   createRoom() {
      if (!this.socket || !this.isConnected) {
         console.warn('Socket not connected, cannot create room');
         return false;
      }

      this.socket.emit('createRoom');
      return true;
   }

   /**
    * Join an existing multiplayer room
    * @param {string} roomId - The room ID to join
    */
   joinRoom(roomId) {
      if (!this.socket || !this.isConnected) {
         console.warn('Socket not connected, cannot join room');
         return false;
      }

      if (!roomId || typeof roomId !== 'string') {
         console.warn('Invalid room ID');
         return false;
      }

      this.socket.emit('joinRoom', roomId);
      return true;
   }

   /**
    * Send a move to the server
    * @param {number} cellX - Cell X coordinate
    * @param {number} cellY - Cell Y coordinate
    */
   sendMove(cellX, cellY) {
      if (!this.socket || !this.isConnected) {
         console.warn('Socket not connected, cannot send move');
         return false;
      }

      if (!this.roomId) {
         console.warn('Not in a room, cannot send move');
         return false;
      }

      if (!this.isMyTurn) {
         console.warn('Not your turn, cannot send move');
         return false;
      }

      this.socket.emit('placeMark', {
         roomId: this.roomId,
         cellX,
         cellY,
      });

      return true;
   }

   /**
    * Leave the current room
    */
   leaveRoom() {
      if (!this.socket || !this.roomId) return;

      this.socket.emit('leaveRoom', {roomId: this.roomId});
      this.resetGameState();
   }

   /**
    * Request a rematch
    */
   requestRematch() {
      if (!this.socket || !this.roomId) return false;

      this.socket.emit('requestRematch', {roomId: this.roomId});
      return true;
   }

   /**
    * Accept a rematch request
    */
   acceptRematch() {
      if (!this.socket || !this.roomId) return false;

      this.socket.emit('acceptRematch', {roomId: this.roomId});
      return true;
   }

   /**
    * Decline a rematch request
    */
   declineRematch() {
      if (!this.socket || !this.roomId) return false;

      this.socket.emit('declineRematch', {roomId: this.roomId});
      return true;
   }

   /**
    * Cancel a rematch request
    */
   cancelRematch() {
      if (!this.socket || !this.roomId) return false;

      this.socket.emit('cancelRematch', {roomId: this.roomId});
      return true;
   }

   /**
    * Attempt to rejoin a room after reconnection
    */
   attemptRoomRejoin() {
      if (!this.socket || !this.roomId) return;

      this.socket.emit('checkRoom', {roomId: this.roomId}, exists => {
         if (exists) {
            const playerId =
               localStorage.getItem(`room_${this.roomId}_playerId`) ||
               this.socket.id;
            this.socket.emit('rejoinRoom', {
               roomId: this.roomId,
               playerId,
            });
         } else {
            // Room no longer exists
            this.dispatchEvent(
               new CustomEvent('roomNotFound', {
                  detail: {roomId: this.roomId},
               })
            );
            this.resetGameState();
         }
      });
   }

   /**
    * Get current network state
    * @returns {Object} Current network state
    */
   getNetworkState() {
      return {
         isConnected: this.isConnected,
         isReconnecting: this.isReconnecting,
         connectionAttempts: this.connectionAttempts,
         roomId: this.roomId,
         playerMark: this.playerMark,
         isMyTurn: this.isMyTurn,
         hasOpponent: this.hasOpponent,
         isGameOver: this.isGameOver,
         socketId: this.socket?.id,
      };
   }

   /**
    * Reset game state (but keep connection)
    */
   resetGameState() {
      const oldRoomId = this.roomId;

      this.roomId = null;
      this.playerMark = null;
      this.isMyTurn = false;
      this.hasOpponent = false;
      this.isGameOver = false;

      // Clean up localStorage
      if (oldRoomId) {
         localStorage.removeItem(`room_${oldRoomId}_playerId`);
      }

      this.dispatchEvent(
         new CustomEvent('gameStateReset', {
            detail: {previousRoomId: oldRoomId},
         })
      );
   }

   /**
    * Check if currently in a multiplayer game
    * @returns {boolean} True if in multiplayer game
    */
   isInMultiplayerGame() {
      return !!(this.roomId && this.isConnected);
   }

   /**
    * Clean up resources and disconnect
    */
   destroy() {
      if (this.socket) {
         if (this.roomId) {
            this.leaveRoom();
         }

         this.socket.disconnect();
         this.socket = null;
      }

      this.resetGameState();
      this.isConnected = false;
      this.isReconnecting = false;
   }
}
