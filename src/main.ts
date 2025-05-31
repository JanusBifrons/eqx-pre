import { Application } from '@/core/Application';
import { GameLoop } from '@/core/GameLoop';
import { RenderSystem } from '@/systems/RenderSystem';
import { PhysicsSystem } from '@/systems/PhysicsSystem';
import { TransformSystem } from '@/systems/TransformSystem';
import { EntityManager } from '@/entities/EntityManager';
import { TransformComponent } from '@/components/TransformComponent';
import { RenderComponent } from '@/components/RenderComponent';
import { PhysicsComponent } from '@/components/PhysicsComponent';
import { serviceContainer } from '@/core/ServiceContainer';
import { Graphics } from 'pixi.js';

async function main() {
  try {
    console.log('🎮 Starting game initialization...');
    
    // Create the main application
    const app = new Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x2c3e50,
      antialias: true,
      fps: 60,
      fixedTimeStep: 1 / 60,
    });

    console.log('📱 Application created, starting...');

    // Initialize and start the application
    await app.start();

    console.log('✅ Application started successfully!');

    // Create and register EntityManager
    const entityManager = new EntityManager();
    serviceContainer.register('entityManager', entityManager);
    
    // Get the game loop from the service container
    const gameLoop = serviceContainer.get<GameLoop>('gameLoop');

    // Add core systems
    const physicsSystem = new PhysicsSystem();
    const transformSystem = new TransformSystem();
    const renderSystem = new RenderSystem();

    gameLoop.addSystem(physicsSystem);
    gameLoop.addSystem(transformSystem);
    gameLoop.addSystem(renderSystem);

    // Register systems in service container for easy access
    serviceContainer.register('physicsSystem', physicsSystem);
    serviceContainer.register('transformSystem', transformSystem);
    serviceContainer.register('renderSystem', renderSystem);

    // Example: Create a simple test scene
    createTestScene();

    console.log('Game initialized successfully!');
    
    // Make app globally available for debugging
    (window as any).app = app;
    (window as any).serviceContainer = serviceContainer;

  } catch (error) {
    console.error('Failed to initialize game:', error);
  }
}

function createTestScene() {
  console.log('Creating test scene...');
  
  const entityManager = serviceContainer.get<EntityManager>('entityManager');
  const physicsSystem = serviceContainer.get<PhysicsSystem>('physicsSystem');
  
  // Create a test entity with graphics
  const testEntity = entityManager.createEntity('test-box');
  
  // Add transform component
  const transform = new TransformComponent('test-box', { x: 400, y: 100 });
  testEntity.addComponent(transform);  // Create graphics for rendering
  const graphics = new Graphics();
  graphics.beginFill(0xff6b6b);
  graphics.lineStyle(2, 0xff0000);
  graphics.drawRect(-25, -25, 50, 50);
  graphics.endFill();
  
  // Add render component
  const render = new RenderComponent('test-box', graphics);
  testEntity.addComponent(render);
  
  // Create physics body
  const physicsBody = physicsSystem.createBox(400, 100, 50, 50, {
    restitution: 0.8,
    friction: 0.5
  });
  
  // Add physics component
  const physics = new PhysicsComponent('test-box', physicsBody);
  testEntity.addComponent(physics);
  
  // Add the physics body to the world
  physicsSystem.addBody(physicsBody);
  
  // Create ground
  const groundEntity = entityManager.createEntity('ground');
  const groundTransform = new TransformComponent('ground', { x: 400, y: 550 });
  groundEntity.addComponent(groundTransform);  const groundGraphics = new Graphics();
  groundGraphics.beginFill(0x4ecdc4);
  groundGraphics.drawRect(-400, -25, 800, 50);
  groundGraphics.endFill();
  
  const groundRender = new RenderComponent('ground', groundGraphics);
  groundEntity.addComponent(groundRender);
  
  const groundBody = physicsSystem.createBox(400, 550, 800, 50, { isStatic: true });
  const groundPhysics = new PhysicsComponent('ground', groundBody);
  groundPhysics.setStatic(true);
  groundEntity.addComponent(groundPhysics);
  
  physicsSystem.addBody(groundBody);
  
  console.log('Test scene created with falling box and ground');
}

// Start the application
main();
