// importScripts('bot.js');

self.onmessage = e => {
   try {
      console.log('Worker received message', e.data);
      const {placedMarks, potentialWins} = e.data;

      const marksMap = new Map();
      placedMarks.forEach((mark: any) => {
         marksMap.set(mark.key, {player: mark.player});
      });

      const potentialWinsMap = new Map();
      potentialWins.forEach((win: any) => {
         const [direction, x, y] = win.key.split(',');
         potentialWinsMap.set(win.key, {
            count: win.count,
            cells: [[parseInt(x), parseInt(y)]],
         });
      });

      // @ts-ignore
      const move = bot.getBestMove(marksMap, potentialWinsMap);
      console.log('Bot move:', move);

      if (move && typeof move.x === 'number' && typeof move.y === 'number') {
         self.postMessage({
            type: 'move',
            data: move,
         });
      } else {
         const fallbackMove = getFallbackMove(marksMap);
         if (fallbackMove) {
            self.postMessage({
               type: 'move',
               data: fallbackMove,
            });
         } else {
            throw new Error('No valid moves available');
         }
      }
   } catch (error: unknown) {
      self.postMessage({
         type: 'error',
         message: (error as any)?.message ?? 'Unknown error',
         stack: (error as any)?.stack ?? null,
      });
   }
};

function getFallbackMove(marksMap: any) {
   if (marksMap.size === 0) {
      return {x: 0, y: 0};
   }

   let minX = Infinity,
      minY = Infinity;
   let maxX = -Infinity,
      maxY = -Infinity;

   for (const key of marksMap.keys()) {
      const [x, y] = key.split(',').map(Number);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
   }

   for (let x = minX - 1; x <= maxX + 1; x++) {
      for (let y = minY - 1; y <= maxY + 1; y++) {
         if (!marksMap.has(`${x},${y}`)) {
            return {x, y};
         }
      }
   }

   return null;
}
