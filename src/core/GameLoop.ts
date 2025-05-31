import { IGameLoop, ISystem } from './types';

export class GameLoop implements IGameLoop {
  private systems: Map<string, ISystem> = new Map();
  private isRunning = false;
  private isPaused = false;
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedTimeStep: number;
  private readonly maxFrameTime = 250; // Maximum frame time to prevent spiral of death
  private animationFrameId?: number;

  constructor(fixedTimeStep = 1 / 60) {
    this.fixedTimeStep = fixedTimeStep * 1000; // Convert to milliseconds
  }

  start(): void {
    if (this.isRunning) {
      console.warn('GameLoop is already running');
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.gameLoop();
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    if (this.isRunning) {
      this.isPaused = false;
      this.lastTime = performance.now();
    }
  }

  addSystem(system: ISystem): void {
    if (this.systems.has(system.name)) {
      console.warn(`System '${system.name}' is already registered`);
      return;
    }
    this.systems.set(system.name, system);
  }

  removeSystem(name: string): void {
    const system = this.systems.get(name);
    if (system) {
      system.destroy();
      this.systems.delete(name);
    }
  }

  private gameLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Prevent spiral of death
    frameTime = Math.min(frameTime, this.maxFrameTime);

    if (!this.isPaused) {
      this.accumulator += frameTime;

      // Fixed timestep update loop
      while (this.accumulator >= this.fixedTimeStep) {
        this.updateSystems(this.fixedTimeStep / 1000); // Convert back to seconds
        this.accumulator -= this.fixedTimeStep;
      }
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private updateSystems(deltaTime: number): void {
    for (const system of this.systems.values()) {
      try {
        system.update(deltaTime);
      } catch (error) {
        console.error(`Error updating system '${system.name}':`, error);
      }
    }
  }

  destroy(): void {
    this.stop();
    for (const system of this.systems.values()) {
      system.destroy();
    }
    this.systems.clear();
  }
}
