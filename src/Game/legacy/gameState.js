const gameState = {
   gameMode: null,
   playerMark: '',
   roomId: '',
   isMyTurn: false,
   currentPlayer: 'X',
   isGameOver: false,
   hasOpponent: false,
};

const BUTTON_STATES = {
   IN_GAME: 'in_game',
   GAME_OVER: 'game_over',
   REMATCH_REQUEST: 'rematch_request',
   WAITING_REMATCH: 'waiting_rematch',
   OPPONENT_LEFT: 'opponent_left',
};

function updateButtonState(state) {
   const buttons = {
      restartButton: false,
      acceptRematchButton: false,
      declineRematchButton: false,
      cancelRematchButton: false,
      exitGameButton: false,
   };

   switch (state) {
      case BUTTON_STATES.IN_GAME:
         buttons.exitGameButton = true;
         break;
      case BUTTON_STATES.GAME_OVER:
         buttons.restartButton = true;
         buttons.exitGameButton = true;
         break;
      case BUTTON_STATES.REMATCH_REQUEST:
         buttons.acceptRematchButton = true;
         buttons.declineRematchButton = true;
         buttons.exitGameButton = true;
         break;
      case BUTTON_STATES.WAITING_REMATCH:
         buttons.cancelRematchButton = true;
         buttons.exitGameButton = true;
         break;
      case BUTTON_STATES.OPPONENT_LEFT:
         buttons.exitGameButton = true;
         break;
   }

   Object.entries(buttons).forEach(([buttonId, isVisible]) => {
      document.getElementById(buttonId).style.display = isVisible
         ? 'block'
         : 'none';
   });
}

function resetGameState(options = {}) {
   const defaults = {
      clearMarks: true,
      showMenu: true,
      updateStatus: true,
      redrawGrid: true,
      keepGameState: false,
   };

   const settings = {...defaults, ...options};

   if (settings.clearMarks) {
      placedMarks.forEach(mark => {
         gridContainer.removeChild(mark.text);
      });
      if (currentHighlight) {
         gridContainer.removeChild(currentHighlight);
         currentHighlight = null;
      }
      placedMarks.clear();
      potentialWins.clear();
      clearWinningLine();
   }

   if (settings.showMenu) {
      document.getElementById('menuOverlay').style.display = 'flex';
   }

   if (settings.updateStatus) {
      document.getElementById('gameStatus').textContent = 'toe';
   }

   if (settings.redrawGrid) {
      drawGrid();
   }

   if (!settings.keepGameState) {
      gameState.gameMode = null;
      gameState.playerMark = '';
      gameState.roomId = '';
      gameState.isMyTurn = false;
      gameState.currentPlayer = 'X';
      gameState.isGameOver = false;
      updateButtonState(null);
   }
}

window.gameState = gameState;
window.BUTTON_STATES = BUTTON_STATES;
window.updateButtonState = updateButtonState;
window.resetGameState = resetGameState;
