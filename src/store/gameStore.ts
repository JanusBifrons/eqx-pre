import { create } from 'zustand';
import { GameState } from '@/core/types';

export interface CollisionInfo {
    id: string;
    entityA: string;
    entityB: string;
    timestamp: number;
    isActive: boolean;
}

interface GameStoreState {
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

    // Physics and collisions
    activeCollisions: CollisionInfo[];
    totalCollisions: number;
}

interface GameStore extends GameStoreState {
    // Actions
    setGameState: (state: GameState) => void;
    setScore: (score: number) => void;
    incrementScore: (points: number) => void;
    setLevel: (level: number) => void;
    setFPS: (fps: number) => void;
    setDeltaTime: (deltaTime: number) => void;
    togglePause: () => void;
    toggleDebug: () => void;
    addCollision: (collision: CollisionInfo) => void;
    removeCollision: (collisionId: string) => void;
    clearCollisions: () => void;
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
    activeCollisions: [],
    totalCollisions: 0,

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

    addCollision: (collision) => set((state) => ({
        activeCollisions: [...state.activeCollisions, collision],
        totalCollisions: state.totalCollisions + 1
    })),

    removeCollision: (collisionId) => set((state) => ({
        activeCollisions: state.activeCollisions.filter(c => c.id !== collisionId)
    })),

    clearCollisions: () => set({
        activeCollisions: [],
        totalCollisions: 0
    }),

    reset: () => set({
        score: 0,
        level: 1,
        fps: 0,
        deltaTime: 0,
        isPaused: false,
        showDebug: false,
        activeCollisions: [],
        totalCollisions: 0,
    }),
}));