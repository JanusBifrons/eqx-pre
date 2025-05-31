import { Container } from 'pixi.js';

export interface ISystem {
    readonly name: string;
    update(deltaTime: number): void;
    destroy(): void;
}

export interface IComponent {
    readonly type: string;
    readonly entityId: string;
}

export interface IEntity {
    readonly id: string;  // UUID string
    readonly container: Container;
    addComponent<T extends IComponent>(component: T): void;
    removeComponent(type: string): void;
    getComponent<T extends IComponent>(type: string): T | undefined;
    hasComponent(type: string): boolean;
    destroy(): void;
}

export interface IServiceContainer {
    register<T>(key: string, service: T): void;
    get<T>(key: string): T;
    has(key: string): boolean;
}

export interface IApplication {
    start(): Promise<void>;
    stop(): void;
    pause(): void;
    resume(): void;
    destroy(): void;
}

export interface IGameLoop {
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;
    addSystem(system: ISystem): void;
    removeSystem(name: string): void;
}

export type Vector2 = {
    x: number;
    y: number;
};

export type GameConfig = {
    width: number;
    height: number;
    backgroundColor: number;
    antialias: boolean;
    resolution: number;
    fps: number;
    fixedTimeStep: number;
};

export enum GameState {
    LOADING = 'loading',
    RUNNING = 'running',
    PAUSED = 'paused',
    STOPPED = 'stopped',
}
