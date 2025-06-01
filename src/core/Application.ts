import { Application as PixiApplication, Container } from 'pixi.js';
import Stats from 'stats.js';
import { IApplication, GameConfig, GameState } from './types';
import { GameLoop } from './GameLoop';
import { serviceContainer } from './ServiceContainer';

export class Application implements IApplication {
    private pixiApp?: PixiApplication;
    private stats?: Stats;
    private gameLoop: GameLoop;
    private gameState = GameState.STOPPED;
    private config: GameConfig;
    private gameContainer?: Container;
    private domContainer?: HTMLElement;

    constructor(config: Partial<GameConfig> = {}, domContainer?: HTMLElement) {
        this.config = {
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x1099bb,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            fps: 60,
            fixedTimeStep: 1 / 60,
            ...config,
        };

        this.domContainer = domContainer;
        this.gameLoop = new GameLoop(this.config.fixedTimeStep);
        this.setupServices();
    }

    async start(): Promise<void> {
        try {
            this.gameState = GameState.LOADING;

            await this.initializePixi();
            this.initializeStats();
            this.setupGameContainer();
            this.setupEventListeners();

            this.gameState = GameState.RUNNING;
            this.gameLoop.start();

            console.log('Application started successfully');
        } catch (error) {
            console.error('Failed to start application:', error);
            this.gameState = GameState.STOPPED;
            throw error;
        }
    }

    stop(): void {
        this.gameState = GameState.STOPPED;
        this.gameLoop.stop();
        this.cleanup();
    }

    pause(): void {
        if (this.gameState === GameState.RUNNING) {
            this.gameState = GameState.PAUSED;
            this.gameLoop.pause();
        }
    }

    resume(): void {
        if (this.gameState === GameState.PAUSED) {
            this.gameState = GameState.RUNNING;
            this.gameLoop.resume();
        }
    }

    destroy(): void {
        this.stop();
        this.gameLoop.destroy();

        if (this.pixiApp) {
            this.pixiApp.destroy(true);
            this.pixiApp = undefined;
        }

        if (this.stats) {
            const statsElement = this.stats.dom;
            if (statsElement.parentNode) {
                statsElement.parentNode.removeChild(statsElement);
            }
            this.stats = undefined;
        }
    }

    getPixiApp(): PixiApplication {
        if (!this.pixiApp) {
            throw new Error('PixiJS application not initialized');
        }
        return this.pixiApp;
    }

    getGameContainer(): Container {
        if (!this.gameContainer) {
            throw new Error('Game container not initialized');
        }
        return this.gameContainer;
    }

    getGameState(): GameState {
        return this.gameState;
    } private async initializePixi(): Promise<void> {
        this.pixiApp = new PixiApplication({
            width: this.config.width,
            height: this.config.height,
            backgroundColor: this.config.backgroundColor,
            antialias: this.config.antialias,
            resolution: this.config.resolution,
            autoDensity: true,
        });

        // Add the canvas to the DOM
        let gameContainer: HTMLElement;

        if (this.domContainer) {
            gameContainer = this.domContainer;
        } else {
            // Fallback to looking for game-container element
            const existingContainer = document.getElementById('game-container');
            if (!existingContainer) {
                throw new Error('Game container element not found');
            }
            gameContainer = existingContainer;
        }

        gameContainer.appendChild(this.pixiApp.view as HTMLCanvasElement);
    }

    private initializeStats(): void {
        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

        // Add stats to DOM
        const statsContainer = document.getElementById('stats');
        if (statsContainer) {
            statsContainer.appendChild(this.stats.dom);
        }

        // Update stats in the game loop
        this.gameLoop.addSystem({
            name: 'stats',
            update: () => {
                if (this.stats) {
                    this.stats.update();
                }
            },
            destroy: () => {
                // Stats cleanup handled in main destroy method
            },
        });
    }

    private setupGameContainer(): void {
        if (!this.pixiApp) {
            throw new Error('PixiJS application not initialized');
        }

        this.gameContainer = new Container();
        this.pixiApp.stage.addChild(this.gameContainer);
    }

    private setupServices(): void {
        // Register core services
        serviceContainer.register('application', this);
        serviceContainer.register('gameLoop', this.gameLoop);
        serviceContainer.register('config', this.config);
    }

    private setupEventListeners(): void {
        // Handle window resize
        window.addEventListener('resize', this.handleResize);

        // Handle visibility change for pause/resume
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    private handleResize = (): void => {
        if (!this.pixiApp) return;

        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        this.pixiApp.renderer.resize(newWidth, newHeight);
        this.config.width = newWidth;
        this.config.height = newHeight;
    };

    private handleVisibilityChange = (): void => {
        if (document.hidden) {
            if (this.gameState === GameState.RUNNING) {
                this.pause();
            }
        } else {
            if (this.gameState === GameState.PAUSED) {
                this.resume();
            }
        }
    };

    private cleanup(): void {
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
}
