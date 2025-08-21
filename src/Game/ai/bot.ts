class ToeBot {
   constructor() {
      // @ts-expect-error TS(2339): Property 'WINNING_LENGTH' does not exist on type '... Remove this comment to see the full error message
      this.WINNING_LENGTH = 5;
      // @ts-expect-error TS(2339): Property 'DIRECTIONS' does not exist on type 'ToeB... Remove this comment to see the full error message
      this.DIRECTIONS = [
         [1, 0],
         [0, 1],
         [1, 1],
         [1, -1],
      ];
   }

   getBestMove(placedMarks: any, potentialWins: any) {
      if (placedMarks.size === 0) {
         return {x: 0, y: 0};
      }

      const bounds = this.getBoardBoundaries(placedMarks);
      const isSpotAvailable = (x: any, y: any) => !placedMarks.has(`${x},${y}`);

      const winningMove = this.findLineMove(
         placedMarks,
         bounds,
         'O',
         // @ts-expect-error TS(2339): Property 'WINNING_LENGTH' does not exist on type '... Remove this comment to see the full error message
         this.WINNING_LENGTH - 1
      );
      const criticalBlock = this.findLineMove(placedMarks, bounds, 'X', 4);

      if (
         winningMove &&
         criticalBlock &&
         isSpotAvailable(winningMove.x, winningMove.y) &&
         isSpotAvailable(criticalBlock.x, criticalBlock.y)
      ) {
         placedMarks.set(`${winningMove.x},${winningMove.y}`, {player: 'O'});
         const opponentCanStillWin = this.findLineMove(placedMarks, bounds, 'X', 4);
         placedMarks.delete(`${winningMove.x},${winningMove.y}`);

         if (opponentCanStillWin) {
            placedMarks.set(`${criticalBlock.x},${criticalBlock.y}`, {
               player: 'O',
            });
            const weCanWinAfterBlock = this.findLineMove(placedMarks, bounds, 'O', 4);
            placedMarks.delete(`${criticalBlock.x},${criticalBlock.y}`);

            if (weCanWinAfterBlock) {
               return criticalBlock;
            }
            const opponentDir = this.getWinningDirection(
               criticalBlock.x,
               criticalBlock.y,
               placedMarks,
               'X'
            );
            const ourDir = this.getWinningDirection(winningMove.x, winningMove.y, placedMarks, 'O');

            if (opponentDir && ourDir && !this.areParallelDirections(opponentDir, ourDir)) {
               return winningMove;
            }
         }
         return winningMove;
      }

      if (criticalBlock && isSpotAvailable(criticalBlock.x, criticalBlock.y)) return criticalBlock;
      if (winningMove && isSpotAvailable(winningMove.x, winningMove.y)) return winningMove;

      let developmentMove = null;
      const quickWin = this.analyzePotentialThreats(potentialWins);
      if (quickWin && isSpotAvailable(quickWin.x, quickWin.y)) {
         if (quickWin.priority === 'immediate') {
            return quickWin;
         }
         developmentMove = quickWin;
      }

      const forcedWinMove = this.findForcedWinMove(placedMarks, bounds, potentialWins);
      if (forcedWinMove && isSpotAvailable(forcedWinMove.x, forcedWinMove.y)) return forcedWinMove;

      const blockForcedWin = this.findForcedWinMove(placedMarks, bounds, potentialWins, 'X');
      if (blockForcedWin && isSpotAvailable(blockForcedWin.x, blockForcedWin.y))
         return blockForcedWin;

      const doubleThreeBlock = this.findDoubleThreeThreat(placedMarks, bounds);
      if (doubleThreeBlock && isSpotAvailable(doubleThreeBlock.x, doubleThreeBlock.y))
         return doubleThreeBlock;

      const multiThreatMove = this.findMultiThreatMove(placedMarks, bounds, potentialWins);
      if (multiThreatMove && isSpotAvailable(multiThreatMove.x, multiThreatMove.y))
         return multiThreatMove;

      const openThreeBlock = this.findOpenThreeThreat(placedMarks, bounds);
      if (openThreeBlock && isSpotAvailable(openThreeBlock.x, openThreeBlock.y))
         return openThreeBlock;

      const developmentBlock = this.findDevelopmentBlock(placedMarks, bounds);
      if (developmentBlock && isSpotAvailable(developmentBlock.x, developmentBlock.y))
         return developmentBlock;

      const strategicMove = this.findStrategicMove(placedMarks, bounds);
      if (strategicMove && isSpotAvailable(strategicMove.x, strategicMove.y)) return strategicMove;

      if (developmentMove && isSpotAvailable(developmentMove.x, developmentMove.y)) {
         return developmentMove;
      }

      for (let x = bounds.minX; x <= bounds.maxX; x++) {
         for (let y = bounds.minY; y <= bounds.maxY; y++) {
            if (isSpotAvailable(x, y)) return {x, y};
         }
      }

      return null;
   }

   getBoardBoundaries(placedMarks: any) {
      let minX = Infinity,
         minY = Infinity;
      let maxX = -Infinity,
         maxY = -Infinity;

      for (const key of placedMarks.keys()) {
         const [x, y] = key.split(',').map(Number);
         minX = Math.min(minX, x);
         minY = Math.min(minY, y);
         maxX = Math.max(maxX, x);
         maxY = Math.max(maxY, y);
      }

      return {
         minX: minX - 2,
         minY: minY - 2,
         maxX: maxX + 2,
         maxY: maxY + 2,
      };
   }

   findLineMove(placedMarks: any, bounds: any, player: any, targetLength: any) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
         for (let y = bounds.minY; y <= bounds.maxY; y++) {
            if (placedMarks.has(`${x},${y}`)) continue;

            // @ts-expect-error TS(2339): Property 'DIRECTIONS' does not exist on type 'ToeB... Remove this comment to see the full error message
            for (const [dx, dy] of this.DIRECTIONS) {
               let count = 0;
               let openEnds = 0;

               for (let dir = -1; dir <= 1; dir += 2) {
                  let consecutive = 0;
                  let isOpen = false;

                  // @ts-expect-error TS(2339): Property 'WINNING_LENGTH' does not exist on type '... Remove this comment to see the full error message
                  for (let i = 1; i < this.WINNING_LENGTH; i++) {
                     const newX = x + dx * i * dir;
                     const newY = y + dy * i * dir;
                     const cell = placedMarks.get(`${newX},${newY}`);

                     if (!cell) {
                        isOpen = true;
                        break;
                     } else if (cell.player === player) {
                        consecutive++;
                     } else {
                        break;
                     }
                  }

                  count += consecutive;
                  if (isOpen) openEnds++;
               }

               if (count >= 4 && openEnds > 0) {
                  return {x, y};
               }

               if (count >= 3 && openEnds === 2) {
                  return {x, y};
               }

               if (count >= targetLength && openEnds > 0) {
                  return {x, y};
               }
            }
         }
      }
      return null;
   }

   evaluateThreats(x: any, y: any, placedMarks: any, player: any) {
      const threats = [];
      let totalScore = 0;
      let openThreats = 0;
      let forcingMoves = 0;

      // @ts-expect-error TS(2339): Property 'DIRECTIONS' does not exist on type 'ToeB... Remove this comment to see the full error message
      for (const [dx, dy] of this.DIRECTIONS) {
         let count = 1;
         let openEnds = 0;
         let gaps = 0;
         let blocked = false;

         for (let dir = -1; dir <= 1; dir += 2) {
            let consecutive = 0;
            let isOpen = false;
            let tempGaps = 0;

            // @ts-expect-error TS(2339): Property 'WINNING_LENGTH' does not exist on type '... Remove this comment to see the full error message
            for (let i = 1; i < this.WINNING_LENGTH; i++) {
               const newX = x + dx * i * dir;
               const newY = y + dy * i * dir;
               const cell = placedMarks.get(`${newX},${newY}`);

               if (!cell) {
                  isOpen = true;
                  tempGaps++;
                  if (tempGaps > 1) break;
               } else if (cell.player === player) {
                  consecutive++;
                  count++;
               } else {
                  blocked = true;
                  break;
               }
            }

            if (isOpen) openEnds++;
            gaps += tempGaps;
         }

         if (count >= 2) {
            threats.push({
               direction: [dx, dy],
               count,
               openEnds,
               gaps,
               blocked,
            });

            let threatValue = count * 20;
            if (openEnds === 2) threatValue *= 1.5;
            if (!blocked) threatValue *= 1.2;

            totalScore += threatValue;

            if (count >= 3 && openEnds > 0) openThreats++;
            if ((count >= 3 && openEnds === 2 && gaps <= 1) || (count >= 4 && openEnds > 0))
               forcingMoves++;
         }
      }

      return {
         threats,
         totalScore,
         openThreats,
         forcingMoves,
         hasStrongThreat: forcingMoves > 0,
      };
   }

   evaluateThreatPosition(posData: any) {
      let threatLevel = 0;
      let connectedThreats = 0;
      let hasStrongThreat = false;

      posData.threats.sort((a: any, b: any) => {
         const aStrength = a.count * (a.openEnds === 2 ? 1.5 : 1) * (a.blocked ? 1 : 1.2);
         const bStrength = b.count * (b.openEnds === 2 ? 1.5 : 1) * (b.blocked ? 1 : 1.2);
         return bStrength - aStrength;
      });

      for (let i = 0; i < posData.threats.length; i++) {
         const threat = posData.threats[i];
         let threatValue = threat.count * 20;

         if (threat.openEnds === 2) threatValue *= 1.5;
         if (!threat.blocked) threatValue *= 1.2;

         for (let j = i + 1; j < posData.threats.length; j++) {
            const otherThreat = posData.threats[j];

            if (
               !this.areParallelDirections(threat.direction, otherThreat.direction) &&
               threat.count >= 2 &&
               otherThreat.count >= 2
            ) {
               threatValue *= 1.3;
               connectedThreats++;

               if (threat.openEnds + otherThreat.openEnds >= 3) {
                  threatValue *= 1.2;
               }
            }
         }

         threatLevel += threatValue;

         if (
            (threat.count >= 4 && threat.openEnds > 0) ||
            (threat.count >= 3 && threat.openEnds === 2 && !threat.blocked)
         ) {
            hasStrongThreat = true;
         }
      }

      return {
         threatLevel,
         connectedThreats,
         hasStrongThreat,
      };
   }

   analyzePotentialThreats(potentialWins: any) {
      let bestThreat = null;
      let bestDevelopment = null;
      let maxThreatLevel = 0;
      let maxDevelopmentLevel = 0;

      const threatsByPosition = new Map();

      for (const [key, data] of potentialWins) {
         const [dx, dy, x, y] = key.split(',').map(Number);
         const posKey = `${x},${y}`;

         if (!threatsByPosition.has(posKey)) {
            threatsByPosition.set(posKey, {
               x,
               y,
               threats: [],
               totalValue: 0,
               connectedThreats: 0,
            });
         }

         const posData = threatsByPosition.get(posKey);
         posData.threats.push({
            direction: [dx, dy],
            count: data.count,
            openEnds: data.openEnds || 0,
            blocked: data.blocked || false,
         });
      }

      for (const [_, posData] of threatsByPosition) {
         const {threatLevel, connectedThreats, hasStrongThreat} =
            this.evaluateThreatPosition(posData);

         posData.totalValue = threatLevel;
         posData.connectedThreats = connectedThreats;

         if (hasStrongThreat && threatLevel > maxThreatLevel) {
            maxThreatLevel = threatLevel;
            bestThreat = {
               x: posData.x,
               y: posData.y,
               priority: 'immediate',
               value: threatLevel,
               connected: connectedThreats,
            };
         } else if (connectedThreats >= 1 && threatLevel > maxDevelopmentLevel) {
            maxDevelopmentLevel = threatLevel;
            bestDevelopment = {
               x: posData.x,
               y: posData.y,
               priority: 'development',
               value: threatLevel,
               connected: connectedThreats,
            };
         }
      }

      return bestThreat || bestDevelopment;
   }

   areParallelDirections(dir1: any, dir2: any) {
      return (
         (dir1[0] === dir2[0] && dir1[1] === dir2[1]) ||
         (dir1[0] === -dir2[0] && dir1[1] === -dir2[1])
      );
   }

   findStrategicMove(placedMarks: any, bounds: any) {
      let bestMove = null;
      let bestScore = -Infinity;

      let centerX = 0,
         centerY = 0,
         count = 0;
      for (const key of placedMarks.keys()) {
         const [x, y] = key.split(',').map(Number);
         centerX += x;
         centerY += y;
         count++;
      }
      centerX = Math.round(centerX / count);
      centerY = Math.round(centerY / count);

      for (let dx = -2; dx <= 2; dx++) {
         for (let dy = -2; dy <= 2; dy++) {
            const x = centerX + dx;
            const y = centerY + dy;

            if (placedMarks.has(`${x},${y}`)) continue;

            const score = this.evaluateStrategicPosition(x, y, placedMarks);
            if (score > bestScore) {
               bestScore = score;
               bestMove = {x, y};
            }
         }
      }

      return bestMove;
   }

   evaluateStrategicPosition(x: any, y: any, placedMarks: any) {
      let score = 0;

      score += this.evaluatePositionPotential(x, y, placedMarks, 'O') * 1.5;

      score += this.evaluatePositionPotential(x, y, placedMarks, 'X');

      score += this.evaluateSpaceControl(x, y, placedMarks);

      return score;
   }

   evaluateSpaceControl(x: any, y: any, placedMarks: any) {
      let score = 0;
      const radius = 2;

      for (let dx = -radius; dx <= radius; dx++) {
         for (let dy = -radius; dy <= radius; dy++) {
            const newX = x + dx;
            const newY = y + dy;
            if (!placedMarks.has(`${newX},${newY}`)) {
               score += 5 / (Math.abs(dx) + Math.abs(dy) + 1);
            }
         }
      }

      return score;
   }

   evaluatePosition(x: any, y: any, placedMarks: any) {
      let score = 0;

      // @ts-expect-error TS(2339): Property 'DIRECTIONS' does not exist on type 'ToeB... Remove this comment to see the full error message
      for (const [dx, dy] of this.DIRECTIONS) {
         let consecutive = 0;
         let openEnds = 0;

         for (let dir = -1; dir <= 1; dir += 2) {
            let space = 0;
            // @ts-expect-error TS(2339): Property 'WINNING_LENGTH' does not exist on type '... Remove this comment to see the full error message
            for (let i = 1; i < this.WINNING_LENGTH; i++) {
               const newX = x + dx * i * dir;
               const newY = y + dy * i * dir;
               const cell = placedMarks.get(`${newX},${newY}`);

               if (!cell) {
                  space++;
                  if (space === 1) openEnds++;
               } else if (cell.player === 'O') {
                  consecutive++;
                  score += 15;
               } else {
                  break;
               }
            }
         }

         score += openEnds * 20;
         if (consecutive >= 2) score += 70;
         if (consecutive >= 3) score += 150;
      }

      const blockingValue = this.countBlockingPotential(x, y, placedMarks) * 25;
      score += blockingValue;

      const centerDistance = Math.abs(x) + Math.abs(y);
      score += Math.max(0, 20 - centerDistance * 2);

      return score;
   }

   countBlockingPotential(x: any, y: any, placedMarks: any) {
      let blockingCount = 0;

      // @ts-expect-error TS(2339): Property 'DIRECTIONS' does not exist on type 'ToeB... Remove this comment to see the full error message
      for (const [dx, dy] of this.DIRECTIONS) {
         let consecutive = 0;
         for (let dir = -1; dir <= 1; dir += 2) {
            // @ts-expect-error TS(2339): Property 'WINNING_LENGTH' does not exist on type '... Remove this comment to see the full error message
            for (let i = 1; i < this.WINNING_LENGTH; i++) {
               const newX = x + dx * i * dir;
               const newY = y + dy * i * dir;
               const cell = placedMarks.get(`${newX},${newY}`);

               if (cell?.player === 'X') {
                  consecutive++;
               } else {
                  break;
               }
            }
         }
         if (consecutive >= 2) blockingCount++;
      }

      return blockingCount;
   }

   findMultiThreatMove(placedMarks: any, bounds: any, potentialWins: any) {
      let bestMove = null;
      let bestScore = -1;

      for (let x = bounds.minX; x <= bounds.maxX; x++) {
         for (let y = bounds.minY; y <= bounds.maxY; y++) {
            if (placedMarks.has(`${x},${y}`)) continue;

            placedMarks.set(`${x},${y}`, {player: 'O'});
            const evaluation = this.evaluateThreats(x, y, placedMarks, 'O');
            placedMarks.delete(`${x},${y}`);

            if (evaluation.openThreats >= 2 && evaluation.totalScore > bestScore) {
               bestScore = evaluation.totalScore;
               bestMove = {x, y};
            }
         }
      }

      return bestMove;
   }

   findDoubleThreeThreat(placedMarks: any, bounds: any) {
      let bestMove = null;
      let bestScore = -1;

      for (let x = bounds.minX; x <= bounds.maxX; x++) {
         for (let y = bounds.minY; y <= bounds.maxY; y++) {
            if (placedMarks.has(`${x},${y}`)) continue;

            placedMarks.set(`${x},${y}`, {player: 'X'});
            const evaluation = this.evaluateThreats(x, y, placedMarks, 'X');
            placedMarks.delete(`${x},${y}`);

            if (evaluation.openThreats >= 2 && evaluation.totalScore > bestScore) {
               bestScore = evaluation.totalScore;
               bestMove = {x, y};
            }
         }
      }

      return bestMove;
   }

   findForcedWinMove(placedMarks: any, bounds: any, potentialWins: any, player = 'O') {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
         for (let y = bounds.minY; y <= bounds.maxY; y++) {
            if (placedMarks.has(`${x},${y}`)) continue;

            placedMarks.set(`${x},${y}`, {player});
            const evaluation = this.evaluateThreats(x, y, placedMarks, player);
            placedMarks.delete(`${x},${y}`);

            if (evaluation.forcingMoves >= 2) {
               return {x, y};
            }
         }
      }

      return null;
   }

   findDevelopmentBlock(placedMarks: any, bounds: any) {
      let bestMove = null;
      let maxThreatPotential = -1;

      for (let x = bounds.minX; x <= bounds.maxX; x++) {
         for (let y = bounds.minY; y <= bounds.maxY; y++) {
            if (placedMarks.has(`${x},${y}`)) continue;

            placedMarks.set(`${x},${y}`, {player: 'X'});
            const threatPotential = this.evaluatePositionPotential(x, y, placedMarks, 'X');
            placedMarks.delete(`${x},${y}`);

            if (threatPotential > maxThreatPotential) {
               maxThreatPotential = threatPotential;
               bestMove = {x, y};
            }
         }
      }

      return maxThreatPotential > 100 ? bestMove : null;
   }

   evaluatePositionPotential(x: any, y: any, placedMarks: any, player: any) {
      let totalPotential = 0;

      // @ts-expect-error TS(2339): Property 'DIRECTIONS' does not exist on type 'ToeB... Remove this comment to see the full error message
      for (const [dx, dy] of this.DIRECTIONS) {
         let potential = 0;
         let openEnds = 0;

         for (let dir = -1; dir <= 1; dir += 2) {
            let space = 0;
            let consecutive = 0;

            // @ts-expect-error TS(2339): Property 'WINNING_LENGTH' does not exist on type '... Remove this comment to see the full error message
            for (let i = 1; i < this.WINNING_LENGTH; i++) {
               const newX = x + dx * i * dir;
               const newY = y + dy * i * dir;
               const cell = placedMarks.get(`${newX},${newY}`);

               if (!cell) {
                  space++;
                  if (space === 1) openEnds++;
               } else if (cell.player === player) {
                  consecutive++;
                  potential += 20;
               } else {
                  break;
               }
            }
         }

         if (openEnds === 2) potential *= 2;
         totalPotential += potential;
      }

      return totalPotential;
   }

   findOpenThreeThreat(placedMarks: any, bounds: any) {
      let bestMove = null;
      let maxThreat = 0;

      for (let x = bounds.minX; x <= bounds.maxX; x++) {
         for (let y = bounds.minY; y <= bounds.maxY; y++) {
            if (placedMarks.has(`${x},${y}`)) continue;

            placedMarks.set(`${x},${y}`, {player: 'X'});
            const threatLevel = this.evaluateOpenThreats(x, y, placedMarks);
            placedMarks.delete(`${x},${y}`);

            if (threatLevel > maxThreat) {
               maxThreat = threatLevel;
               bestMove = {x, y};
            }
         }
      }

      return maxThreat > 100 ? bestMove : null;
   }

   isOpenThree(x: any, y: any, dx: any, dy: any, placedMarks: any, player: any) {
      let count = 1;
      let openEnds = 0;

      for (let dir = -1; dir <= 1; dir += 2) {
         let isOpen = true;
         let consecutive = 0;

         // @ts-expect-error TS(2339): Property 'WINNING_LENGTH' does not exist on type '... Remove this comment to see the full error message
         for (let i = 1; i < this.WINNING_LENGTH - 1; i++) {
            const newX = x + dx * i * dir;
            const newY = y + dy * i * dir;
            const cell = placedMarks.get(`${newX},${newY}`);

            if (!cell) {
               if (isOpen) openEnds++;
               break;
            } else if (cell.player === player) {
               consecutive++;
               count++;
            } else {
               isOpen = false;
               break;
            }
         }
      }

      return count >= 3 && openEnds >= 1;
   }

   evaluateOpenThreats(x: any, y: any, placedMarks: any) {
      let threatScore = 0;

      // @ts-expect-error TS(2339): Property 'DIRECTIONS' does not exist on type 'ToeB... Remove this comment to see the full error message
      for (const [dx, dy] of this.DIRECTIONS) {
         let score = 0;
         let openEnds = 0;
         let consecutive = 0;

         for (let dir = -1; dir <= 1; dir += 2) {
            let tempConsecutive = 0;
            let isOpen = true;

            // @ts-expect-error TS(2339): Property 'WINNING_LENGTH' does not exist on type '... Remove this comment to see the full error message
            for (let i = 1; i < this.WINNING_LENGTH; i++) {
               const newX = x + dx * i * dir;
               const newY = y + dy * i * dir;
               const cell = placedMarks.get(`${newX},${newY}`);

               if (!cell) {
                  if (isOpen) openEnds++;
                  break;
               } else if (cell.player === 'X') {
                  tempConsecutive++;
                  score += 20;
               } else {
                  isOpen = false;
                  break;
               }
            }
            consecutive = Math.max(consecutive, tempConsecutive);
         }

         if (consecutive >= 2 && openEnds === 2) score *= 2;
         if (consecutive >= 3 && openEnds >= 1) score *= 3;
         threatScore += score;
      }

      return threatScore;
   }

   verifyForcedWin(x: any, y: any, placedMarks: any, player: any) {
      placedMarks.set(`${x},${y}`, {player});
      const isForced =
         // @ts-expect-error TS(2339): Property 'evaluateDirection' does not exist on typ... Remove this comment to see the full error message
         this.evaluateDirection(x, y, 1, 0, placedMarks).isForcingMove ||
         // @ts-expect-error TS(2339): Property 'evaluateDirection' does not exist on typ... Remove this comment to see the full error message
         this.evaluateDirection(x, y, 0, 1, placedMarks).isForcingMove ||
         // @ts-expect-error TS(2339): Property 'evaluateDirection' does not exist on typ... Remove this comment to see the full error message
         this.evaluateDirection(x, y, 1, 1, placedMarks).isForcingMove ||
         // @ts-expect-error TS(2339): Property 'evaluateDirection' does not exist on typ... Remove this comment to see the full error message
         this.evaluateDirection(x, y, 1, -1, placedMarks).isForcingMove;
      placedMarks.delete(`${x},${y}`);
      return isForced;
   }

   findDetailedForcedWin(placedMarks: any, bounds: any, player: any) {
      for (let x = bounds.minX; x <= bounds.maxX; x++) {
         for (let y = bounds.minY; y <= bounds.maxY; y++) {
            if (placedMarks.has(`${x},${y}`)) continue;

            placedMarks.set(`${x},${y}`, {player});
            let winningThreats = 0;

            // @ts-expect-error TS(2339): Property 'DIRECTIONS' does not exist on type 'ToeB... Remove this comment to see the full error message
            for (const [dx, dy] of this.DIRECTIONS) {
               // @ts-expect-error TS(2339): Property 'evaluateDirection' does not exist on typ... Remove this comment to see the full error message
               const score = this.evaluateDirection(x, y, dx, dy, placedMarks);
               if (score.isForcingMove) winningThreats++;
            }

            placedMarks.delete(`${x},${y}`);

            if (winningThreats >= 2) {
               return {x, y};
            }
         }
      }
      return null;
   }

   findDetailedMultiThreat(placedMarks: any, bounds: any) {
      let bestMove = null;
      let bestScore = -1;

      for (let x = bounds.minX; x <= bounds.maxX; x++) {
         for (let y = bounds.minY; y <= bounds.maxY; y++) {
            if (placedMarks.has(`${x},${y}`)) continue;

            let moveScore = 0;
            let threats = 0;

            placedMarks.set(`${x},${y}`, {player: 'O'});

            // @ts-expect-error TS(2339): Property 'DIRECTIONS' does not exist on type 'ToeB... Remove this comment to see the full error message
            for (const [dx, dy] of this.DIRECTIONS) {
               // @ts-expect-error TS(2339): Property 'evaluateDirection' does not exist on typ... Remove this comment to see the full error message
               const score = this.evaluateDirection(x, y, dx, dy, placedMarks);
               moveScore += score.value;
               if (score.isThreat) threats++;
            }

            placedMarks.delete(`${x},${y}`);

            if (threats >= 2 && moveScore > bestScore) {
               bestScore = moveScore;
               bestMove = {x, y};
            }
         }
      }

      return bestMove;
   }

   getWinningDirection(x: any, y: any, placedMarks: any, player: any) {
      // @ts-expect-error TS(2339): Property 'DIRECTIONS' does not exist on type 'ToeB... Remove this comment to see the full error message
      for (const [dx, dy] of this.DIRECTIONS) {
         let count = 1;
         for (let dir = -1; dir <= 1; dir += 2) {
            // @ts-expect-error TS(2339): Property 'WINNING_LENGTH' does not exist on type '... Remove this comment to see the full error message
            for (let i = 1; i < this.WINNING_LENGTH; i++) {
               const newX = x + dx * i * dir;
               const newY = y + dy * i * dir;
               const cell = placedMarks.get(`${newX},${newY}`);
               if (!cell || cell.player !== player) break;
               count++;
            }
         }
         if (count >= 4) return [dx, dy];
      }
      return null;
   }
}

const bot = new ToeBot();
