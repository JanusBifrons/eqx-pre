import { Container } from 'pixi.js';
import { ISystem } from '@/core/types';
import { serviceContainer } from '@/core/ServiceContainer';
import { Application } from '@/core/Application';

export class RenderSystem implements ISystem {
  public readonly name = 'render';
  private application: Application;
  private gameContainer: Container;

  constructor() {
    this.application = serviceContainer.get<Application>('application');
    this.gameContainer = this.application.getGameContainer();
  }
  update(_deltaTime: number): void {
    // The actual rendering is handled by PixiJS automatically
    // This system can be used for custom render logic, sorting, culling, etc.
    
    // Example: Sort children by depth (z-index)
    this.sortByDepth();
  }

  private sortByDepth(): void {
    // Sort children by their zIndex if they have one
    this.gameContainer.children.sort((a, b) => {
      const aZ = (a as any).zIndex || 0;
      const bZ = (b as any).zIndex || 0;
      return aZ - bZ;
    });
  }

  destroy(): void {
    // Cleanup if needed
  }
}
