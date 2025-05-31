import { Application } from '@/core/Application';
import { GameLoop } from '@/core/GameLoop';
import { RenderSystem } from '@/systems/RenderSystem';
import { PhysicsSystem } from '@/systems/PhysicsSystem';
import { TransformSystem } from '@/systems/TransformSystem';
import { EntityManager } from '@/entities/EntityManager';
import { Entity } from '@/entities/Entity';
import { TransformComponent } from '@/components/TransformComponent';
import { RenderComponent } from '@/components/RenderComponent';
import { RigidBodyComponent } from '@/components/RigidBodyComponent';
import { serviceContainer } from '@/core/ServiceContainer';
import { useGameStore } from '@/store/gameStore';
import { GameState } from '@/core/types';
import { Graphics, Text, TextStyle } from 'pixi.js';

export async function runEnhancedDemo() {
    console.log('🚀 Starting Enhanced Physics Demo...');

    // Create the main application
    const app = new Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1a1a2e,
        antialias: true,
        fps: 60,
        fixedTimeStep: 1 / 60,
    });

    await app.start();

    // Create and register EntityManager
    const entityManager = new EntityManager();
    serviceContainer.register('entityManager', entityManager);

    // Get the game loop and setup systems
    const gameLoop = serviceContainer.get<GameLoop>('gameLoop');

    // Create systems with enhanced physics configuration
    const physicsSystem = new PhysicsSystem({
        gravity: { x: 0, y: 0.5 }, // Light gravity
        enableSleeping: true,
        timeScale: 1,
        enableDebugRender: false
    });

    const transformSystem = new TransformSystem();
    const renderSystem = new RenderSystem();

    gameLoop.addSystem(physicsSystem);
    gameLoop.addSystem(transformSystem);
    gameLoop.addSystem(renderSystem);

    // Register systems in service container
    serviceContainer.register('physicsSystem', physicsSystem);
    serviceContainer.register('transformSystem', transformSystem);
    serviceContainer.register('renderSystem', renderSystem);

    // Get collision manager from physics system
    const collisionManager = physicsSystem.getCollisionManager();

    if (collisionManager) {
        console.log('✅ CollisionManager initialized');

        // Setup collision callbacks
        collisionManager.onCollisionType('collisionStart', (event, type) => {
            console.log(`🎯 Collision started: ${event.entityA} <-> ${event.entityB}`);

            // Change color on collision for visual feedback
            const entityA = entityManager.getEntity(event.entityA);
            const entityB = entityManager.getEntity(event.entityB);

            if (entityA) {
                const renderComp = entityA.getComponent<RenderComponent>('render');
                if (renderComp && renderComp.graphics instanceof Graphics) {
                    renderComp.graphics.tint = 0xff6b6b; // Red tint
                }
            }

            if (entityB) {
                const renderComp = entityB.getComponent<RenderComponent>('render');
                if (renderComp && renderComp.graphics instanceof Graphics) {
                    renderComp.graphics.tint = 0x4ecdc4; // Teal tint
                }
            }
        });

        collisionManager.onCollisionType('collisionEnd', (event, type) => {
            console.log(`💫 Collision ended: ${event.entityA} <-> ${event.entityB}`);

            // Reset color when collision ends
            const entityA = entityManager.getEntity(event.entityA);
            const entityB = entityManager.getEntity(event.entityB);

            if (entityA) {
                const renderComp = entityA.getComponent<RenderComponent>('render');
                if (renderComp && renderComp.graphics instanceof Graphics) {
                    renderComp.graphics.tint = 0xffffff; // Reset to white
                }
            }

            if (entityB) {
                const renderComp = entityB.getComponent<RenderComponent>('render');
                if (renderComp && renderComp.graphics instanceof Graphics) {
                    renderComp.graphics.tint = 0xffffff; // Reset to white
                }
            }
        });
    }

    // Create demo scene with various physics objects
    createDemoScene(entityManager, physicsSystem);

    // Setup UI
    createUI(app);

    // Start the game loop
    gameLoop.start();
    useGameStore.getState().setGameState(GameState.RUNNING);

    console.log('✅ Enhanced Physics Demo started successfully!');
    console.log('📋 Demo features:');
    console.log('  - RigidBodyComponent with various shapes');
    console.log('  - CollisionManager with event handling');
    console.log('  - Visual collision feedback');
    console.log('  - Zustand state integration');
    console.log('  - Real-time collision statistics');
}

function createDemoScene(entityManager: EntityManager, physicsSystem: PhysicsSystem) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Create ground platform
    const ground = new Entity('ground');
    ground.addComponent(new TransformComponent(ground.id, centerX, window.innerHeight - 50));

    const groundGraphics = new Graphics();
    groundGraphics.rect(-200, -25, 400, 50);
    groundGraphics.fill(0x2c3e50);
    ground.addComponent(new RenderComponent(ground.id, groundGraphics));

    ground.addComponent(new RigidBodyComponent(
        ground.id,
        { x: centerX, y: window.innerHeight - 50 },
        { type: 'rectangle', width: 400, height: 50 },
        { isStatic: true, label: 'ground', friction: 0.7, restitution: 0.3 }
    ));

    entityManager.addEntity(ground);

    // Create dynamic boxes
    for (let i = 0; i < 5; i++) {
        const box = new Entity(`box_${i}`);
        const x = centerX + (i - 2) * 80;
        const y = centerY - 200 - i * 100;

        box.addComponent(new TransformComponent(box.id, x, y));

        const boxGraphics = new Graphics();
        boxGraphics.rect(-25, -25, 50, 50);
        boxGraphics.fill(0xe74c3c + i * 0x001100); // Slight color variation
        box.addComponent(new RenderComponent(box.id, boxGraphics));

        box.addComponent(new RigidBodyComponent(
            box.id,
            { x, y },
            { type: 'rectangle', width: 50, height: 50 },
            {
                density: 0.001,
                friction: 0.3,
                restitution: 0.6,
                label: `box_${i}`
            }
        ));

        entityManager.addEntity(box);
    }

    // Create dynamic circles
    for (let i = 0; i < 3; i++) {
        const circle = new Entity(`circle_${i}`);
        const x = centerX + 150 + i * 60;
        const y = centerY - 300;

        circle.addComponent(new TransformComponent(circle.id, x, y));

        const circleGraphics = new Graphics();
        circleGraphics.circle(0, 0, 25);
        circleGraphics.fill(0x3498db + i * 0x001100);
        circle.addComponent(new RenderComponent(circle.id, circleGraphics));

        circle.addComponent(new RigidBodyComponent(
            circle.id,
            { x, y },
            { type: 'circle', radius: 25 },
            {
                density: 0.001,
                friction: 0.2,
                restitution: 0.8,
                label: `circle_${i}`
            }
        ));

        entityManager.addEntity(circle);
    }

    // Create sensor (trigger) area
    const sensor = new Entity('sensor');
    sensor.addComponent(new TransformComponent(sensor.id, centerX - 150, centerY));

    const sensorGraphics = new Graphics();
    sensorGraphics.rect(-40, -40, 80, 80);
    sensorGraphics.fill(0x9b59b6);
    sensorGraphics.alpha = 0.5; // Semi-transparent
    sensor.addComponent(new RenderComponent(sensor.id, sensorGraphics));

    sensor.addComponent(new RigidBodyComponent(
        sensor.id,
        { x: centerX - 150, y: centerY },
        { type: 'rectangle', width: 80, height: 80 },
        {
            isStatic: true,
            isSensor: true,
            label: 'sensor'
        }
    ));

    entityManager.addEntity(sensor);

    // Create moving platform
    const platform = new Entity('platform');
    platform.addComponent(new TransformComponent(platform.id, centerX + 200, centerY + 100));

    const platformGraphics = new Graphics();
    platformGraphics.rect(-60, -10, 120, 20);
    platformGraphics.fill(0xf39c12);
    platform.addComponent(new RenderComponent(platform.id, platformGraphics));

    platform.addComponent(new RigidBodyComponent(
        platform.id,
        { x: centerX + 200, y: centerY + 100 },
        { type: 'rectangle', width: 120, height: 20 },
        {
            isStatic: true,
            label: 'platform'
        }
    ));

    entityManager.addEntity(platform);

    // Animate the moving platform
    let platformTime = 0;
    const animatePlatform = () => {
        platformTime += 0.02;
        const platformRigidBody = platform.getComponent<RigidBodyComponent>('rigidbody');
        if (platformRigidBody) {
            const newY = centerY + 100 + Math.sin(platformTime) * 50;
            platformRigidBody.setPosition({ x: centerX + 200, y: newY });
        }
        requestAnimationFrame(animatePlatform);
    };
    animatePlatform();

    console.log('🏗️ Demo scene created with enhanced physics objects');
}

function createUI(app: Application) {
    const pixiApp = app.getPixiApp();

    // Create UI text for collision info
    const textStyle = new TextStyle({
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xffffff,
        align: 'left'
    });

    const collisionText = new Text('Collisions: 0 active', textStyle);
    collisionText.x = 10;
    collisionText.y = 10;
    pixiApp.stage.addChild(collisionText);

    const statsText = new Text('', textStyle);
    statsText.x = 10;
    statsText.y = 30;
    pixiApp.stage.addChild(statsText);

    const instructionsText = new Text('Enhanced Physics Demo\n• Watch objects collide and change colors\n• Sensor area (purple) detects objects\n• Moving platform (orange) animates', textStyle);
    instructionsText.x = 10;
    instructionsText.y = window.innerHeight - 80;
    pixiApp.stage.addChild(instructionsText);

    // Update UI with game state
    const updateUI = () => {
        const gameState = useGameStore.getState();
        const collisionManager = serviceContainer.get('physicsSystem')?.getCollisionManager();

        collisionText.text = `Active Collisions: ${gameState.activeCollisions.length}`;

        if (collisionManager) {
            const stats = collisionManager.getCollisionStats();
            statsText.text = `Total Collisions: ${gameState.totalCollisions} | Callbacks: ${stats.totalCallbacks}`;
        }

        requestAnimationFrame(updateUI);
    };
    updateUI();

    console.log('🎨 Enhanced UI created with real-time collision stats');
}
