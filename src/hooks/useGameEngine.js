import { useEffect, useRef, useState } from 'react'
import { GameEngine } from '../Game/core/GameEngine.js'
import { GAME_CONSTANTS } from '../Game/core/constants.js'

/**
 * Custom hook for managing PIXI.js game engine lifecycle
 * Handles initialization, mounting, and cleanup
 */
export const useGameEngine = (containerRef) => {
   const gameEngineRef = useRef(null)
   const [gameInitialized, setGameInitialized] = useState(false)
   const [error, setError] = useState(null)

   useEffect(() => {
      const initializeGame = async () => {
         try {
            console.log('Initializing game engine...')

            if (!containerRef.current) {
               console.error('PIXI container not available')
               return
            }

            window.GAME_CONSTANTS = GAME_CONSTANTS

            gameEngineRef.current = new GameEngine()
            await gameEngineRef.current.init()

            const pixiCanvas = gameEngineRef.current.app.view
            if (containerRef.current && pixiCanvas) {
               containerRef.current.innerHTML = ''
               containerRef.current.appendChild(pixiCanvas)
            }

            setGameInitialized(true)
            console.log('Game engine initialized successfully')
            console.log(gameEngineRef.current)
            window.gameEngine = gameEngineRef.current

         } catch (err) {
            console.error('❌ Failed to initialize game:', err)
            setError(err.message)
         }
      }

      const timeoutId = setTimeout(initializeGame, 100)

      return () => {
         clearTimeout(timeoutId)
         if (gameEngineRef.current?.app) {
            gameEngineRef.current.app.destroy(true, true)
         }
      }
   }, [containerRef])

   return {
      gameEngine: gameEngineRef.current,
      gameInitialized,
      error
   }
}
