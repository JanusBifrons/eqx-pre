import { create } from 'zustand';
import { GameState } from '@/core/types';

interface GameStore {
  // Game state
  gameState: GameState;
  score: number;
  level: number;
  
  // Performance metrics
  fps: number;
  deltaTime: number;
  
  // UI state
  isPaused: boolean;
  showDebug: boolean;
  
  // Actions
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  incrementScore: (points: number) => void;
  setLevel: (level: number) => void;
  setFPS: (fps: number) => void;
  setDeltaTime: (deltaTime: number) => void;
  togglePause: () => void;
  toggleDebug: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Initial state
  gameState: GameState.STOPPED,
  score: 0,
  level: 1,
  fps: 0,
  deltaTime: 0,
  isPaused: false,
  showDebug: false,

  // Actions
  setGameState: (gameState) => set({ gameState }),
  
  setScore: (score) => set({ score }),
  
  incrementScore: (points) => set((state) => ({ 
    score: state.score + points 
  })),
  
  setLevel: (level) => set({ level }),
  
  setFPS: (fps) => set({ fps }),
  
  setDeltaTime: (deltaTime) => set({ deltaTime }),
  
  togglePause: () => set((state) => ({ 
    isPaused: !state.isPaused 
  })),
  
  toggleDebug: () => set((state) => ({ 
    showDebug: !state.showDebug 
  })),
  
  reset: () => set({
    score: 0,
    level: 1,
    fps: 0,
    deltaTime: 0,
    isPaused: false,
    showDebug: false,
  }),
}));
