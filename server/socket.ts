// @ts-nocheck
// @ts-expect-error TS(2304): Cannot find name 'io'.
const socket = io();

const connectionEvents = {
   connect: (id: any) => `Connected to server with ID: ${id}`,
   disconnect: (reason: any) => `Disconnected from server. Reason: ${reason}`,
   connect_error: (error: any) => `Connection error: ${error}`,
   connect_timeout: () => 'Connection timeout',
   reconnect: (attempts: any) => `Reconnected to server after ${attempts} attempts`,
   reconnect_attempt: (attempt: any) => `Attempting to reconnect: ${attempt}`,
   reconnect_error: (error: any) => `Reconnection error: ${error}`,
   reconnect_failed: () => 'Failed to reconnect to server',
};

socket.on('connect', () => {
   console.log(connectionEvents.connect(socket.id));
   if (gameState.gameMode === 'multi' && gameState.roomId) {
      socket.emit('checkRoom', {roomId: gameState.roomId}, (exists: any) => {
         if (exists) {
            socket.emit('rejoinRoom', {
               roomId: gameState.roomId,
               playerId: localStorage.getItem(`room_${gameState.roomId}_playerId`) || socket.id,
            });
         } else {
            resetGameState({
               showMenu: true,
               updateStatus: true,
               clearMarks: true,
               keepGameState: false,
            });
         }
      });
   }
});

socket.on('disconnect', (reason: any) => {
   console.log(connectionEvents.disconnect(reason));
   if (gameState.gameMode === 'multi') {
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      document.getElementById('gameStatus').textContent = 'Disconnected from server...';
   }
});

socket.on('connect_error', (error: any) => console.log(connectionEvents.connect_error(error)));
socket.on('connect_timeout', () => console.log(connectionEvents.connect_timeout()));

socket.io.on('reconnect', (attempts: any) => {
   console.log(connectionEvents.reconnect(attempts));
   if (gameState.gameMode === 'multi' && gameState.roomId) {
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      document.getElementById('gameStatus').textContent = 'Reconnecting to game...';
   }
});

socket.io.on('reconnect_attempt', (attempt: any) =>
   console.log(connectionEvents.reconnect_attempt(attempt))
);
socket.io.on('reconnect_error', (error: any) =>
   console.log(connectionEvents.reconnect_error(error))
);
socket.io.on('reconnect_failed', () => {
   console.log(connectionEvents.reconnect_failed());
   if (gameState.gameMode === 'multi') {
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      document.getElementById('gameStatus').textContent =
         'Failed to reconnect. Please refresh the page.';
      updateButtonState(BUTTON_STATES.OPPONENT_LEFT);
   }
});

socket.on('roomRejoined', (data: any) => {
   // @ts-expect-error TS(2322): Type '"multi"' is not assignable to type 'null'.
   gameState.gameMode = 'multi';
   gameState.roomId = data.roomId;
   gameState.playerMark = data.mark;
   gameState.isMyTurn = data.isYourTurn;
   gameState.isGameOver = data.isGameOver;

   placedMarks.clear();
   if (data.placedMarks) {
      data.placedMarks.forEach((mark: any) => {
         const {x, y, player} = mark;
         const coordKey = `${x},${y}`;

         // @ts-expect-error TS(2304): Cannot find name 'PIXI'.
         const text = new PIXI.Text(player, {
            fontSize: 40,
            fill: player === 'X' ? '#ff6961' : '#a2bffe',
            align: 'center',
            fontWeight: 'bold',
         });

         text.anchor.set(0.5);
         text.x = x * cellSize + cellSize / 2;
         text.y = y * cellSize + cellSize / 2;

         const targetSize = cellSize * 0.8;
         const scale = targetSize / Math.max(text.width, text.height);
         text.scale.set(scale);

         gridContainer.addChild(text);
         placedMarks.set(coordKey, {player, text});
      });
   }

   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('gameStatus').textContent = gameState.isGameOver
      ? 'Game Over'
      : gameState.isMyTurn
        ? `(${gameState.playerMark}) Your turn`
        : `(${gameState.playerMark === 'X' ? 'O' : 'X'}) Opponent's turn`;
});

// @ts-expect-error TS(2531): Object is possibly 'null'.
document.getElementById('createGameBtn').addEventListener('click', () => {
   socket.emit('createRoom');
});

// @ts-expect-error TS(2531): Object is possibly 'null'.
document.getElementById('joinGameBtn').addEventListener('click', () => {
   // @ts-expect-error TS(2531): Object is possibly 'null'.
   const roomIdToJoin = document.getElementById('roomIdInput').value;
   socket.emit('joinRoom', roomIdToJoin);
});

socket.on('roomCreated', (newRoomId: any) => {
   // @ts-expect-error TS(2322): Type '"multi"' is not assignable to type 'null'.
   gameState.gameMode = 'multi';
   gameState.roomId = newRoomId;
   gameState.playerMark = 'X';
   gameState.isMyTurn = true;
   gameState.hasOpponent = false;
   localStorage.setItem(`room_${newRoomId}_playerId`, socket.id);
   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('menuOverlay').style.display = 'none';
   const inviteUrl = `${window.location.origin}/invite/${newRoomId}`;
   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('gameStatus').innerHTML = `
      Room ID: <span class='room-id' onclick='copyInviteLink('${inviteUrl}')' style='cursor: pointer; text-decoration: underline;' title='Click to copy invite link'>
         ${newRoomId}
      </span><br>Waiting for opponent...
   `;
   updateButtonState(BUTTON_STATES.IN_GAME);
});

socket.on('gameJoined', (data: any) => {
   // @ts-expect-error TS(2322): Type '"multi"' is not assignable to type 'null'.
   gameState.gameMode = 'multi';
   gameState.playerMark = typeof data === 'object' ? data.mark : data;
   gameState.roomId = typeof data === 'object' ? data.roomId : null;
   gameState.isMyTurn = gameState.playerMark === 'X';
   gameState.hasOpponent = true;
   if (gameState.roomId) {
      localStorage.setItem(`room_${gameState.roomId}_playerId`, socket.id);
   }

   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('menuOverlay').style.display = 'none';
   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('gameStatus').textContent = gameState.isMyTurn
      ? `(${gameState.playerMark}) Your turn`
      : `(${gameState.playerMark === 'X' ? 'O' : 'X'}) Opponent's turn`;
   updateButtonState(BUTTON_STATES.IN_GAME);
});

socket.on('opponentJoined', () => {
   gameState.hasOpponent = true;
   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('gameStatus').textContent = gameState.isMyTurn
      ? `(${gameState.playerMark}) Your turn`
      : `(${gameState.playerMark === 'X' ? 'O' : 'X'}) Opponent's turn`;
   updateButtonState(BUTTON_STATES.IN_GAME);
});

socket.on('markPlaced', ({cellX, cellY, player, nextPlayer}: any) => {
   const coordKey = `${cellX},${cellY}`;
   if (placedMarks.has(coordKey)) return;

   velocity = {x: 0, y: 0};

   // @ts-expect-error TS(2304): Cannot find name 'PIXI'.
   const text = new PIXI.Text(player, {
      fontSize: 40,
      fill: player === 'X' ? '#ff6961' : '#a2bffe',
      align: 'center',
      fontWeight: 'bold',
   });

   text.anchor.set(0.5);
   text.x = cellX * cellSize + cellSize / 2;
   text.y = cellY * cellSize + cellSize / 2;

   const targetSize = cellSize * 0.8;
   const scale = targetSize / Math.max(text.width, text.height);
   text.scale.set(scale);

   gridContainer.addChild(text);
   highlightLastMove(cellX, cellY, player);
   showOffscreenIndicator(cellX, cellY, player);
   placedMarks.set(coordKey, {player, text});

   if (player === gameState.playerMark) {
      cameraAdjustment(cellX, cellY);
   }

   const winningCells = checkWin(cellX, cellY, player);
   if (winningCells) {
      animateWinningLine(winningCells);
      setTimeout(() => {
         gameState.isGameOver = true;
         const isWinner = player === gameState.playerMark;
         // @ts-expect-error TS(2531): Object is possibly 'null'.
         document.getElementById('gameStatus').textContent = isWinner
            ? 'You win!'
            : 'Opponent wins!';

         socket.emit('gameWon', {
            roomId: gameState.roomId,
            winner: player,
         });

         updateButtonState(BUTTON_STATES.GAME_OVER);
      }, STRIKE_ANIMATION_DURATION);
      return;
   }

   gameState.isMyTurn = nextPlayer === gameState.playerMark;
   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('gameStatus').textContent = gameState.isMyTurn
      ? `(${gameState.playerMark}) Your turn`
      : `(${gameState.playerMark === 'X' ? 'O' : 'X'}) Opponent's turn`;
});

function requestRematch() {
   if (!gameState.roomId) return;
   socket.emit('requestRematch', {roomId: gameState.roomId});
   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('gameStatus').textContent = "Waiting for opponent's response...";
   updateButtonState(BUTTON_STATES.GAME_OVER);
}

function cancelRematch() {
   if (!gameState.roomId) return;
   socket.emit('cancelRematch', {roomId: gameState.roomId});
   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('gameStatus').textContent = 'Rematch cancelled';
   updateButtonState(BUTTON_STATES.GAME_OVER);
}

socket.on('rematchRequested', () => {
   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('gameStatus').textContent = 'Opponent wants a rematch!';
   updateButtonState(BUTTON_STATES.GAME_OVER);
});

socket.on('rematchAccepted', (data: any) => {
   if (data) {
      gameState.playerMark = data.mark;
      gameState.isMyTurn = data.isYourTurn;
      gameState.isGameOver = false;
      gameState.hasOpponent = true;
   }

   // @ts-expect-error TS(2322): Type '"multi"' is not assignable to type 'null'.
   gameState.gameMode = 'multi';

   resetGameState({
      showMenu: false,
      updateStatus: false,
      clearMarks: true,
      keepGameState: true,
   });

   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('gameStatus').textContent = gameState.isMyTurn
      ? `(${gameState.playerMark}) Your turn`
      : `(${gameState.playerMark === 'X' ? 'O' : 'X'}) Opponent's turn`;

   updateButtonState(BUTTON_STATES.IN_GAME);
});

socket.on('rematchDeclined', () => {
   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('gameStatus').textContent = 'Opponent declined rematch';
   updateButtonState(BUTTON_STATES.GAME_OVER);
});

socket.on('rematchCancelled', () => {
   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('gameStatus').textContent = 'Opponent cancelled rematch request';
   updateButtonState(BUTTON_STATES.GAME_OVER);
});

socket.on('opponentLeft', () => {
   if (!gameState.gameMode) return;

   gameState.isGameOver = true;
   gameState.hasOpponent = false;
   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('gameStatus').textContent = 'Opponent left the game';

   resetGameState({
      showMenu: false,
      updateStatus: false,
      keepGameState: false,
   });

   updateButtonState(BUTTON_STATES.OPPONENT_LEFT);
});

function handleAcceptRematch() {
   socket.emit('acceptRematch', {roomId: gameState.roomId});
   updateButtonState(BUTTON_STATES.IN_GAME);
}

function handleDeclineRematch() {
   socket.emit('declineRematch', {roomId: gameState.roomId});
   updateButtonState(BUTTON_STATES.GAME_OVER);
}

function handleExitGame() {
   if (gameState.gameMode === 'multi') {
      socket.emit('leaveRoom', {roomId: gameState.roomId});
   }
   resetGameState({
      showMenu: true,
      updateStatus: true,
      clearMarks: true,
      keepGameState: false,
   });
}

function copyInviteLink(url: any) {
   const gameStatusEl = document.getElementById('gameStatus');
   if (!gameStatusEl) return;

   const originalText = gameStatusEl.innerHTML;
   let timeoutId: any;
   const [beforeBr, afterBr] = originalText.split('<br>');

   navigator.clipboard
      .writeText(url)
      .then(() => {
         gameStatusEl.innerHTML = `Room ID: Invite link copied!<br>${afterBr || ''}`;

         timeoutId = setTimeout(() => {
            if (gameStatusEl?.innerHTML.includes('Invite link copied!')) {
               gameStatusEl.innerHTML = originalText;
            }
         }, 2000);
      })
      .catch(err => {
         console.error('Failed to copy:', err);
         gameStatusEl.innerHTML = `Room ID: Failed to copy link<br>${afterBr || ''}`;
      });

   return () => {
      if (timeoutId) clearTimeout(timeoutId);
   };
}

window.addEventListener('load', () => {
   const urlParams = new URLSearchParams(window.location.search);
   const roomToJoin = urlParams.get('join');
   const error = urlParams.get('error');

   if (error) {
      let errorMessage = '';
      switch (error) {
         case 'room-not-found':
            errorMessage = 'Room not found';
            break;
         case 'room-full':
            errorMessage = 'Room is full';
            break;
      }
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      document.getElementById('gameStatus').textContent = errorMessage;
   }

   if (!roomToJoin) {
      return;
   }
   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('roomIdInput').value = roomToJoin;
   // @ts-expect-error TS(2531): Object is possibly 'null'.
   document.getElementById('joinGameBtn').click();
   window.history.replaceState({}, document.title, '/');
});
