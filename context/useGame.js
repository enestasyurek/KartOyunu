// context/useGame.js
import { useContext } from 'react';
import { GameContext } from './GameProvider'; // GameProvider'dan export edilen context'i kullan

// Custom hook to access game state and actions easily
export const useGame = () => {
    const context = useContext(GameContext);
    // Check if context exists (consumer is inside provider)
    if (context === null) {
        throw new Error('useGame must be used within a GameProvider');
    }
    // Return the necessary parts of the context value
    return {
        gameState: context.gameState,
        actions: context.actions,
        customTasksInput: context.customTasksInput,       // Needed by SetupScreen
        setCustomTasksInput: context.setCustomTasksInput // Needed by SetupScreen
     };
};