import { Engine, World, Bodies, Body, Events } from 'matter-js';
import { ISystem } from '@/core/types';

export class PhysicsSystem implements ISystem {
  public readonly name = 'physics';
  private engine: Engine;
  private world: World;
  constructor() {
    this.engine = Engine.create();
    this.world = this.engine.world;
    
    // Configure physics engine
    this.engine.gravity.y = 0.8;
    
    this.setupEvents();
  }

  update(deltaTime: number): void {
    // Update physics with fixed timestep
    Engine.update(this.engine, deltaTime * 1000);
  }

  addBody(body: Body): void {
    World.add(this.world, body);
  }

  removeBody(body: Body): void {
    World.remove(this.world, body);
  }

  createBox(x: number, y: number, width: number, height: number, options: any = {}): Body {
    return Bodies.rectangle(x, y, width, height, options);
  }

  createCircle(x: number, y: number, radius: number, options: any = {}): Body {
    return Bodies.circle(x, y, radius, options);
  }

  setGravity(x: number, y: number): void {
    this.engine.gravity.x = x;
    this.engine.gravity.y = y;
  }

  private setupEvents(): void {
    // Example: Handle collision events
    Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      for (const pair of pairs) {
        const { bodyA, bodyB } = pair;
        // Handle collision logic here
        console.log('Collision detected between', bodyA.label, 'and', bodyB.label);
      }
    });
  }

  destroy(): void {
    World.clear(this.world, false);
    Engine.clear(this.engine);
  }
}
