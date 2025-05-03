import { useContext } from 'react';
import { GameContext } from './GameProvider'; // GameProvider'dan export edilen context'i kullan

/**
 * Custom hook to easily access the game state and actions from the GameContext.
 * Provides type checking and ensures the hook is used within a GameProvider.
 * @returns {{gameState: object, actions: object}} The game state and action dispatchers.
 * @throws {Error} If used outside of a GameProvider.
 */
export const useGame = () => {
    const context = useContext(GameContext);

    // Context'in null olup olmadığını kontrol et (Provider içinde mi kullanılıyor?)
    if (context === null || context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }

    // Sadece gerekli olan state ve action'ları döndür
    // Removed: customTasksInput, setCustomTasksInput - bunlar artık SetupScreen'in kendi state'i
    return {
        gameState: context.gameState,
        actions: context.actions,
     };
};