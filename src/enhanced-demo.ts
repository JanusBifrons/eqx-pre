// filepath: c:\Users\alecv\Desktop\eqx-pre\eqx-pre\src\enhanced-demo.ts
import { Application } from '@/core/Application';
import { GameLoop } from '@/core/GameLoop';
import { RenderSystem } from '@/systems/RenderSystem';
import { PhysicsSystem } from '@/systems/PhysicsSystem';
import { TransformSystem } from '@/systems/TransformSystem';
import { EntityManager } from '@/entities/EntityManager';
import { TransformComponent } from '@/components/TransformComponent';
import { RenderComponent } from '@/components/RenderComponent';
import { RigidBodyComponent } from '@/components/RigidBodyComponent';
import { serviceContainer } from '@/core/ServiceContainer';
import { useGameStore } from '@/store/gameStore';
import { GameState } from '@/core/types';
import { Graphics, Text, TextStyle } from 'pixi.js';

export async function runEnhancedDemo(container?: HTMLElement) {
    console.log('🚀 Starting Enhanced Physics Demo...');

    // If container is provided, use it
    let gameContainer: HTMLElement;

    if (container) {
        gameContainer = container;
    } else {
        // Fallback to document.body for legacy usage
        gameContainer = document.body;
    }

    // Create the main application
    const app = new Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1a1a2e,
        antialias: true,
        fps: 60,
        fixedTimeStep: 1 / 60,
    }, gameContainer);

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
    serviceContainer.register('renderSystem', renderSystem);    // Get collision manager from physics system
    const collisionManager = physicsSystem.getCollisionManager();    // Enable mouse interaction for dragging physics objects
    const pixiApp = app.getPixiApp();
    console.log('🔍 Debugging canvas access...');
    console.log('pixiApp:', pixiApp);
    console.log('pixiApp.view:', pixiApp.view);
    console.log('pixiApp.renderer.view:', pixiApp.renderer.view);

    // Try different ways to get the canvas
    const canvas = (pixiApp.view as HTMLCanvasElement) || (pixiApp.renderer.view as HTMLCanvasElement);
    console.log('canvas element:', canvas);

    if (canvas) {
        physicsSystem.enableMouseInteraction(canvas);
        console.log('🖱️ Mouse interaction enabled - you can now drag physics objects!');
    } else {
        console.error('❌ Could not find canvas element for mouse interaction');
    }

    if (collisionManager) {
        console.log('✅ CollisionManager initialized');

        // Setup collision callbacks
        collisionManager.onCollisionType('collisionStart', (event) => {
            console.log(`🎯 Collision started: ${event.entityA} <-> ${event.entityB}`);

            // Change color on collision for visual feedback
            const entityA = entityManager.getEntity(event.entityA);
            const entityB = entityManager.getEntity(event.entityB);

            if (entityA) {
                const renderComp = entityA.getComponent<RenderComponent>('render');
                if (renderComp && renderComp.displayObject instanceof Graphics) {
                    renderComp.displayObject.tint = 0xff6b6b; // Red tint
                }
            }

            if (entityB) {
                const renderComp = entityB.getComponent<RenderComponent>('render');
                if (renderComp && renderComp.displayObject instanceof Graphics) {
                    renderComp.displayObject.tint = 0x4ecdc4; // Teal tint
                }
            }
        });

        collisionManager.onCollisionType('collisionEnd', (event) => {
            console.log(`💫 Collision ended: ${event.entityA} <-> ${event.entityB}`);

            // Reset color when collision ends
            const entityA = entityManager.getEntity(event.entityA);
            const entityB = entityManager.getEntity(event.entityB);

            if (entityA) {
                const renderComp = entityA.getComponent<RenderComponent>('render');
                if (renderComp && renderComp.displayObject instanceof Graphics) {
                    renderComp.displayObject.tint = 0xffffff; // Reset to white
                }
            }

            if (entityB) {
                const renderComp = entityB.getComponent<RenderComponent>('render');
                if (renderComp && renderComp.displayObject instanceof Graphics) {
                    renderComp.displayObject.tint = 0xffffff; // Reset to white
                }
            }
        });
    }    // Create demo scene with various physics objects
    createDemoScene(entityManager, physicsSystem);

    // Setup UI
    createUI(app);

    // Start the game loop
    gameLoop.start();
    useGameStore.getState().setGameState(GameState.RUNNING); console.log('✅ Enhanced Physics Demo started successfully!');
    console.log('📋 Demo features:');
    console.log('  - RigidBodyComponent with various shapes');
    console.log('  - CollisionManager with event handling');
    console.log('  - Visual collision feedback');
    console.log('  - Zustand state integration');
    console.log('  - Real-time collision statistics');
    console.log('  - Mouse interaction for dragging objects');
}

function createDemoScene(entityManager: EntityManager, physicsSystem: PhysicsSystem) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Create ground platform using EntityManager.createEntity
    const ground = entityManager.createEntity();
    ground.addComponent(new TransformComponent(ground.id, { x: centerX, y: window.innerHeight - 50 }));

    const groundGraphics = new Graphics();
    groundGraphics.beginFill(0x2c3e50);
    groundGraphics.drawRect(-2000, -250, 4000, 500); // Centered at (0, 0) for the entity
    groundGraphics.endFill();
    ground.addComponent(new RenderComponent(ground.id, groundGraphics));
    ground.addComponent(new RigidBodyComponent(
        ground.id,
        { x: centerX, y: window.innerHeight - 50 },
        { type: 'rectangle', width: 4000, height: 500 },
        { isStatic: true, label: 'ground', friction: 0.7, restitution: 0.3 }
    ));

    // Add the RigidBodyComponent to the physics world
    const groundRigidBody = ground.getComponent<RigidBodyComponent>('rigidbody');
    if (groundRigidBody) {
        physicsSystem.addRigidBodyComponent(groundRigidBody);
    }

    // Create dynamic boxes
    for (let i = 0; i < 5; i++) {
        const box = entityManager.createEntity();
        const x = centerX + (i - 2) * 80;
        const y = centerY - 200 - i * 100;

        box.addComponent(new TransformComponent(box.id, { x, y }));

        const boxGraphics = new Graphics();
        boxGraphics.beginFill(0xe74c3c + i * 0x001100); // Slight color variation
        boxGraphics.drawRect(-25, -25, 50, 50);
        boxGraphics.endFill();
        box.addComponent(new RenderComponent(box.id, boxGraphics)); box.addComponent(new RigidBodyComponent(
            box.id,
            { x, y },
            { type: 'rectangle', width: 50, height: 50 },
            {
                density: 0.1, // Increased from 0.01 for much better mouse interaction
                friction: 0.3,
                restitution: 0.6,
                label: `box_${i}`
            }
        ));

        // Add the RigidBodyComponent to the physics world
        const boxRigidBody = box.getComponent<RigidBodyComponent>('rigidbody');
        if (boxRigidBody) {
            physicsSystem.addRigidBodyComponent(boxRigidBody);
        }
    }

    // Create dynamic circles
    for (let i = 0; i < 5; i++) {
        const circle = entityManager.createEntity();
        const x = centerX + 150 + (i % 5) * 60;
        const y = centerY - 300 - Math.floor(i / 5) * 60;

        circle.addComponent(new TransformComponent(circle.id, { x, y }));

        const circleGraphics = new Graphics();
        circleGraphics.beginFill(0x3498db + i * 0x111100);
        circleGraphics.drawCircle(0, 0, 25);
        circleGraphics.endFill();
        circle.addComponent(new RenderComponent(circle.id, circleGraphics));

        circle.addComponent(new RigidBodyComponent(
            circle.id,
            { x, y },
            { type: 'circle', radius: 25 },
            {
                density: 0.1, // Increased from 0.01 for much better mouse interaction
                friction: 0.2,
                restitution: 0.8,
                label: `circle_${i}`
            }
        ));

        // Add the RigidBodyComponent to the physics world
        const circleRigidBody = circle.getComponent<RigidBodyComponent>('rigidbody');
        if (circleRigidBody) {
            physicsSystem.addRigidBodyComponent(circleRigidBody);
        }
    }
    // Create performance test objects - many small dynamic bodies
    const testObjectCount = 50; // Adjust this number to stress test
    for (let i = 0; i < testObjectCount; i++) {
        const testObject = entityManager.createEntity();
        const x = centerX + (Math.random() - 0.5) * 400;
        const y = centerY - 400 - Math.random() * 200;
        const size = 10 + Math.random() * 20;

        testObject.addComponent(new TransformComponent(testObject.id, { x, y }));

        const testGraphics = new Graphics();
        const color = Math.random() * 0xffffff;
        testGraphics.beginFill(color);

        // Random shape for variety
        if (Math.random() > 0.5) {
            testGraphics.drawRect(-size / 2, -size / 2, size, size);
        } else {
            testGraphics.drawCircle(0, 0, size / 2);
        }
        testGraphics.endFill();
        testObject.addComponent(new RenderComponent(testObject.id, testGraphics));

        testObject.addComponent(new RigidBodyComponent(
            testObject.id,
            { x, y },
            Math.random() > 0.5
                ? { type: 'rectangle', width: size, height: size }
                : { type: 'circle', radius: size / 2 },
            {
                density: 0.05,
                friction: 0.4,
                restitution: 0.7,
                label: `perfTest_${i}`
            }
        ));

        const testRigidBody = testObject.getComponent<RigidBodyComponent>('rigidbody');
        if (testRigidBody) {
            physicsSystem.addRigidBodyComponent(testRigidBody);
        }
    }

    console.log(`🧪 Performance test: Created ${testObjectCount} additional physics objects`);
    // Create sensor (trigger) area
    const sensor = entityManager.createEntity();
    sensor.addComponent(new TransformComponent(sensor.id, { x: centerX - 150, y: centerY }));

    const sensorGraphics = new Graphics();
    sensorGraphics.beginFill(0x9b59b6, 0.5); // Semi-transparent
    sensorGraphics.drawRect(-40, -40, 80, 80);
    sensorGraphics.endFill();
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

    // Add the RigidBodyComponent to the physics world
    const sensorRigidBody = sensor.getComponent<RigidBodyComponent>('rigidbody');
    if (sensorRigidBody) {
        physicsSystem.addRigidBodyComponent(sensorRigidBody);
    }

    // Create moving platform
    const platform = entityManager.createEntity();
    platform.addComponent(new TransformComponent(platform.id, { x: centerX + 200, y: centerY + 100 }));

    const platformGraphics = new Graphics();
    platformGraphics.beginFill(0xf39c12);
    platformGraphics.drawRect(-60, -10, 120, 20);
    platformGraphics.endFill();
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

    // Add the RigidBodyComponent to the physics world
    const platformRigidBody = platform.getComponent<RigidBodyComponent>('rigidbody');
    if (platformRigidBody) {
        physicsSystem.addRigidBodyComponent(platformRigidBody);
    }

    // Animate the moving platform
    let platformTime = 0;
    const animatePlatform = () => {
        platformTime += 0.02;
        const platformRigidBody = platform.getComponent<RigidBodyComponent>('rigidbody');
        const platformTransform = platform.getComponent<TransformComponent>('transform');

        if (platformRigidBody && platformTransform) {
            const newY = centerY + 100 + Math.sin(platformTime) * 50;
            const newPosition = { x: centerX + 200, y: newY };

            // Update both physics body and transform component
            platformRigidBody.setPosition(newPosition);
            platformTransform.setPosition(newPosition.x, newPosition.y);
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

    const instructionsText = new Text('Enhanced Physics Demo\n• Watch objects collide and change colors\n• Sensor area (purple) detects objects\n• Moving platform (orange) animates\n• Click and drag to move physics objects!', textStyle);
    instructionsText.x = 10;
    instructionsText.y = window.innerHeight - 100;
    pixiApp.stage.addChild(instructionsText);

    // Update UI with game state
    const updateUI = () => {
        const gameState = useGameStore.getState();
        const physicsSystem = serviceContainer.get('physicsSystem') as PhysicsSystem;

        collisionText.text = `Active Collisions: ${gameState.activeCollisions.length}`;

        if (physicsSystem && physicsSystem.getCollisionManager) {
            const collisionManager = physicsSystem.getCollisionManager();
            if (collisionManager) {
                const stats = collisionManager.getCollisionStats();
                statsText.text = `Total Collisions: ${gameState.totalCollisions} | Callbacks: ${stats.totalCallbacks}`;
            }
        }

        requestAnimationFrame(updateUI);
    };
    updateUI();

    console.log('🎨 Enhanced UI created with real-time collision stats');
}
