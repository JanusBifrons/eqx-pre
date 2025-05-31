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
import { Graphics } from 'pixi.js';
import { Body } from 'matter-js';

// Game state
const keyState: { [key: string]: boolean } = {};
let lastFireTime = 0;
const fireRate = 250; // milliseconds between shots

// Keyboard event listeners
document.addEventListener('keydown', (event) => {
    keyState[event.code] = true;
});

document.addEventListener('keyup', (event) => {
    keyState[event.code] = false;
});

function isKeyPressed(keyCode: string): boolean {
    return !!keyState[keyCode];
}

export async function runAsteroidsDemo() {
    console.log('🚀 Starting Asteroids Demo...');

    // Create the main application
    const app = new Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000011, // Space-like dark blue
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

    // Create systems - no gravity for space!
    const physicsSystem = new PhysicsSystem({
        gravity: { x: 0, y: 0 },
        enableSleeping: false,
        timeScale: 1,
        enableDebugRender: false
    });

    const transformSystem = new TransformSystem();
    const renderSystem = new RenderSystem();

    // Add systems to game loop
    gameLoop.addSystem(physicsSystem);
    gameLoop.addSystem(transformSystem);
    gameLoop.addSystem(renderSystem);

    // Register systems in service container
    serviceContainer.register('physicsSystem', physicsSystem);
    serviceContainer.register('transformSystem', transformSystem);
    serviceContainer.register('renderSystem', renderSystem);

    // Create game entities
    const playerShip = createPlayerShip(entityManager, physicsSystem);
    createAsteroids(entityManager, physicsSystem, 8);

    // Setup game systems
    setupCollisionHandling(entityManager, physicsSystem);
    enableMouseInteraction(app, physicsSystem);

    // Add game systems
    const inputSystem = createInputSystem(playerShip);
    const laserSystem = createLaserCleanupSystem();
    
    gameLoop.addSystem(inputSystem);
    gameLoop.addSystem(laserSystem);

    // Start the game loop
    gameLoop.start();

    console.log('✅ Asteroids Demo started!');
    console.log('Controls: WASD/Arrows = Move, Space = Fire, Mouse = Drag asteroids');
}

function createPlayerShip(entityManager: EntityManager, physicsSystem: PhysicsSystem) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const ship = entityManager.createEntity();

    // Transform component
    ship.addComponent(new TransformComponent(ship.id, { x: centerX, y: centerY }));

    // Graphics
    const shipGraphics = new Graphics();
    shipGraphics.lineStyle(2, 0x00ff00);
    shipGraphics.beginFill(0x004400, 0.8);
    shipGraphics.moveTo(0, -15);
    shipGraphics.lineTo(-10, 10);
    shipGraphics.lineTo(0, 5);
    shipGraphics.lineTo(10, 10);
    shipGraphics.lineTo(0, -15);
    shipGraphics.endFill();
    ship.addComponent(new RenderComponent(ship.id, shipGraphics));

    // Physics
    ship.addComponent(new RigidBodyComponent(
        ship.id,
        { x: centerX, y: centerY },
        { type: 'circle', radius: 12 },
        {
            density: 1,
            friction: 0,
            restitution: 0.8,
            frictionAir: 0.02,
            label: 'player_ship'
        }
    ));

    const shipRigidBody = ship.getComponent('rigidbody') as RigidBodyComponent;
    if (shipRigidBody) {
        physicsSystem.addRigidBodyComponent(shipRigidBody);
    }

    return ship;
}

function createAsteroids(entityManager: EntityManager, physicsSystem: PhysicsSystem, count: number) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const minDistanceFromPlayer = 150;

    for (let i = 0; i < count; i++) {
        const asteroid = entityManager.createEntity();

        // Generate safe position
        let x, y;
        do {
            x = Math.random() * window.innerWidth;
            y = Math.random() * window.innerHeight;
        } while (Math.hypot(x - centerX, y - centerY) < minDistanceFromPlayer);

        const size = 40 + Math.random() * 30;
        const radius = size * 0.7;

        // Components
        asteroid.addComponent(new TransformComponent(asteroid.id, { x, y }));
        asteroid.addComponent(new RenderComponent(asteroid.id, createAsteroidShape(size)));
        asteroid.addComponent(new RigidBodyComponent(
            asteroid.id,
            { x, y },
            { type: 'circle', radius },
            {
                density: 0.8,
                friction: 0,
                restitution: 0.9,
                frictionAir: 0,
                label: `asteroid_large_${i}`
            }
        ));

        // Add to physics and set motion
        const rigidBody = asteroid.getComponent('rigidbody') as RigidBodyComponent;
        if (rigidBody) {
            physicsSystem.addRigidBodyComponent(rigidBody);
            
            // Random velocity and rotation
            const speed = 0.5 + Math.random() * 1.5;
            const angle = Math.random() * Math.PI * 2;
            rigidBody.setVelocity({
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            });
            
            if (rigidBody.body) {
                Body.setAngularVelocity(rigidBody.body, (Math.random() - 0.5) * 0.1);
            }
        }
    }
}

function createLaser(entityManager: EntityManager, physicsSystem: PhysicsSystem, startX: number, startY: number, direction: number) {
    const laser = entityManager.createEntity();

    // Graphics
    const laserGraphics = new Graphics();
    laserGraphics.lineStyle(3, 0x00ffff);
    laserGraphics.beginFill(0x88ffff, 0.8);
    laserGraphics.drawCircle(0, 0, 3);
    laserGraphics.endFill();

    // Components
    laser.addComponent(new TransformComponent(laser.id, { x: startX, y: startY }));
    laser.addComponent(new RenderComponent(laser.id, laserGraphics));
    laser.addComponent(new RigidBodyComponent(
        laser.id,
        { x: startX, y: startY },
        { type: 'circle', radius: 3 },
        {
            density: 0.1,
            friction: 0,
            restitution: 0,
            frictionAir: 0,
            isSensor: false,
            label: 'laser'
        }
    ));

    // Add to physics and set velocity
    const rigidBody = laser.getComponent('rigidbody') as RigidBodyComponent;
    if (rigidBody) {
        physicsSystem.addRigidBodyComponent(rigidBody);
        const laserSpeed = 15;
        rigidBody.setVelocity({
            x: Math.sin(direction) * laserSpeed,
            y: -Math.cos(direction) * laserSpeed
        });
    }

    return laser;
}

function createAsteroidShape(size: number): Graphics {
    const graphics = new Graphics();
    graphics.lineStyle(2, 0x999999);
    graphics.beginFill(0x444444, 0.9);

    // Irregular shape
    const points = 8 + Math.floor(Math.random() * 4);
    const angleStep = (Math.PI * 2) / points;

    graphics.moveTo(size, 0);
    for (let i = 1; i <= points; i++) {
        const angle = angleStep * i;
        const radiusVariation = 0.7 + Math.random() * 0.6;
        const radius = size * radiusVariation;
        graphics.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    graphics.endFill();

    // Surface details
    const craterCount = Math.max(1, Math.floor(size / 20));
    for (let i = 0; i < craterCount; i++) {
        const detailAngle = Math.random() * Math.PI * 2;
        const detailRadius = size * (0.3 + Math.random() * 0.4);
        const detailX = Math.cos(detailAngle) * detailRadius;
        const detailY = Math.sin(detailAngle) * detailRadius;
        const craterSize = 2 + Math.random() * (size / 10);

        graphics.lineStyle(1, 0x666666);
        graphics.beginFill(0x222222, 0.8);
        graphics.drawCircle(detailX, detailY, craterSize);
        graphics.endFill();
    }

    return graphics;
}

function setupCollisionHandling(entityManager: EntityManager, physicsSystem: PhysicsSystem) {
    const collisionManager = physicsSystem.getCollisionManager();
    
    if (!collisionManager) {
        console.warn('CollisionManager not available');
        return;
    }

    collisionManager.onCollision((event, type) => {
        if (type !== 'collisionStart') return;

        const { entityA, entityB, bodyA, bodyB } = event;

        // Check for laser-asteroid collision
        const isLaserAsteroidCollision = 
            (bodyA.label === 'laser' && bodyB.label?.startsWith('asteroid_')) ||
            (bodyB.label === 'laser' && bodyA.label?.startsWith('asteroid_'));

        if (isLaserAsteroidCollision) {
            const laserEntityId = bodyA.label === 'laser' ? entityA : entityB;
            const asteroidEntityId = bodyA.label === 'laser' ? entityB : entityA;

            const laserEntity = entityManager.getEntity(laserEntityId);
            const asteroidEntity = entityManager.getEntity(asteroidEntityId);

            if (laserEntity && asteroidEntity) {
                shatterAsteroid(asteroidEntity, entityManager, physicsSystem);
                entityManager.destroyEntity(laserEntityId);
                console.log('💥 Asteroid destroyed by laser!');
            }
        }

        // Check for player-asteroid collision
        const isPlayerAsteroidCollision = 
            (bodyA.label === 'player_ship' && bodyB.label?.startsWith('asteroid_')) ||
            (bodyB.label === 'player_ship' && bodyA.label?.startsWith('asteroid_'));

        if (isPlayerAsteroidCollision) {
            const playerEntityId = bodyA.label === 'player_ship' ? entityA : entityB;
            const asteroidEntityId = bodyA.label === 'player_ship' ? entityB : entityA;

            console.log('💥 Player hit asteroid!');
            
            // You can add different behaviors here:
            // Option 1: Destroy the player (game over)
            // entityManager.destroyEntity(playerEntityId);
            
            // Option 2: Damage the player
            // damagePlayer(playerEntityId);
            
            // Option 3: Just visual/audio feedback
            const playerEntity = entityManager.getEntity(playerEntityId);
            const asteroidEntity = entityManager.getEntity(asteroidEntityId);
            
            if (playerEntity) {
                // Flash the player red to indicate damage
                const renderComp = playerEntity.getComponent('render') as RenderComponent;
                if (renderComp) {
                    renderComp.displayObject.tint = 0xff0000; // Red tint
                    setTimeout(() => {
                        if (renderComp.displayObject) {
                            renderComp.displayObject.tint = 0xffffff; // Reset
                        }
                    }, 300);
                }
            }
            
            // Option 4: Shatter the asteroid on impact
            if (asteroidEntity) {
                shatterAsteroid(asteroidEntity, entityManager, physicsSystem);
            }
        }

        // Check for asteroid-asteroid collisions (optional - for more realistic physics)
        const isAsteroidAsteroidCollision = 
            bodyA.label?.startsWith('asteroid_') && bodyB.label?.startsWith('asteroid_');

        if (isAsteroidAsteroidCollision) {
            console.log('🪨 Asteroid collision!');
            // Optional: Add sparks effect, sound, etc.
        }
    });

    console.log('✅ Collision handling setup complete (laser-asteroid, player-asteroid, asteroid-asteroid)');
}

function shatterAsteroid(asteroid: any, entityManager: EntityManager, physicsSystem: PhysicsSystem) {
    const transform = asteroid.getComponent('transform') as TransformComponent;
    const rigidBody = asteroid.getComponent('rigidbody') as RigidBodyComponent;
    
    if (!transform || !rigidBody) return;

    const { x, y } = transform.position;
    const label = rigidBody.body?.label || '';

    // Create fragments based on size
    if (label.includes('large')) {
        const fragments = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < fragments; i++) {
            createAsteroidFragment(entityManager, physicsSystem, x, y, 'medium', i);
        }
    } else if (label.includes('medium')) {
        const fragments = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < fragments; i++) {
            createAsteroidFragment(entityManager, physicsSystem, x, y, 'small', i);
        }
    }

    entityManager.destroyEntity(asteroid.id);
}

function createAsteroidFragment(entityManager: EntityManager, physicsSystem: PhysicsSystem, x: number, y: number, size: string, index: number) {
    const fragment = entityManager.createEntity();

    // Position with spread
    const spreadRadius = 30;
    const angle = (Math.PI * 2 * index) / 3 + Math.random() * 0.5;
    const fragmentX = x + Math.cos(angle) * spreadRadius;
    const fragmentY = y + Math.sin(angle) * spreadRadius;

    // Size based on fragment type
    const asteroidSize = size === 'medium' ? 20 + Math.random() * 15 : 10 + Math.random() * 10;
    const radius = asteroidSize * 0.7;

    // Components
    fragment.addComponent(new TransformComponent(fragment.id, { x: fragmentX, y: fragmentY }));
    fragment.addComponent(new RenderComponent(fragment.id, createAsteroidShape(asteroidSize)));
    fragment.addComponent(new RigidBodyComponent(
        fragment.id,
        { x: fragmentX, y: fragmentY },
        { type: 'circle', radius },
        {
            density: 0.6,
            friction: 0,
            restitution: 0.9,
            frictionAir: 0,
            label: `asteroid_${size}_${Date.now()}_${index}`
        }
    ));

    // Add to physics with velocity
    const rigidBody = fragment.getComponent('rigidbody') as RigidBodyComponent;
    if (rigidBody) {
        physicsSystem.addRigidBodyComponent(rigidBody);
        
        const speed = 2 + Math.random() * 3;
        const velocityAngle = Math.random() * Math.PI * 2;
        rigidBody.setVelocity({
            x: Math.cos(velocityAngle) * speed,
            y: Math.sin(velocityAngle) * speed
        });

        if (rigidBody.body) {
            Body.setAngularVelocity(rigidBody.body, (Math.random() - 0.5) * 0.2);
        }
    }
}

function enableMouseInteraction(app: Application, physicsSystem: PhysicsSystem) {
    const pixiApp = app.getPixiApp();
    const canvas = (pixiApp.view as HTMLCanvasElement) || (pixiApp.renderer.view as HTMLCanvasElement);
    
    if (canvas) {
        physicsSystem.enableMouseInteraction(canvas);
        console.log('🖱️ Mouse interaction enabled');
    } else {
        console.error('❌ Could not find canvas for mouse interaction');
    }
}

function createInputSystem(playerShip: any) {
    return {
        name: 'inputSystem',
        update: (_deltaTime: number) => {
            const transform = playerShip.getComponent('transform') as TransformComponent;
            const rigidBody = playerShip.getComponent('rigidbody') as RigidBodyComponent;

            if (!transform || !rigidBody) return;

            const rotationSpeed = 0.1;
            const thrustForce = 0.15;

            // Rotation
            if (isKeyPressed('KeyA') || isKeyPressed('ArrowLeft')) {
                const newRotation = transform.rotation - rotationSpeed;
                transform.setRotation(newRotation);
                rigidBody.setRotation(newRotation);
            }
            if (isKeyPressed('KeyD') || isKeyPressed('ArrowRight')) {
                const newRotation = transform.rotation + rotationSpeed;
                transform.setRotation(newRotation);
                rigidBody.setRotation(newRotation);
            }

            // Thrust
            if (isKeyPressed('KeyW') || isKeyPressed('ArrowUp')) {
                const forceX = Math.sin(transform.rotation) * thrustForce;
                const forceY = -Math.cos(transform.rotation) * thrustForce;
                rigidBody.applyForce({ x: forceX, y: forceY });
                showThrustEffect(playerShip, 0xffff88);
            }
            if (isKeyPressed('KeyS') || isKeyPressed('ArrowDown')) {
                const forceX = -Math.sin(transform.rotation) * thrustForce * 0.5;
                const forceY = Math.cos(transform.rotation) * thrustForce * 0.5;
                rigidBody.applyForce({ x: forceX, y: forceY });
                showThrustEffect(playerShip, 0xff8888);
            }

            // Fire laser
            if (isKeyPressed('Space')) {
                const currentTime = Date.now();
                if (currentTime - lastFireTime > fireRate) {
                    const entityManager = serviceContainer.get<EntityManager>('entityManager');
                    const physicsSystem = serviceContainer.get<PhysicsSystem>('physicsSystem');
                    
                    const laserX = transform.position.x + Math.sin(transform.rotation) * 20;
                    const laserY = transform.position.y - Math.cos(transform.rotation) * 20;
                    
                    createLaser(entityManager, physicsSystem, laserX, laserY, transform.rotation);
                    lastFireTime = currentTime;
                }
            }

            // Screen wrapping
            wrapAroundScreen(rigidBody, transform);
            wrapAllAsteroids();
        }
    };
}

function createLaserCleanupSystem() {
    return {
        name: 'laserCleanupSystem',
        update: (_deltaTime: number) => {
            const entityManager = serviceContainer.get<EntityManager>('entityManager');
            const lasers = entityManager.getEntitiesWithComponent('rigidbody').filter(entity => {
                const rigidBody = entity.getComponent('rigidbody') as RigidBodyComponent;
                return rigidBody?.body?.label === 'laser';
            });

            // Remove off-screen lasers
            lasers.forEach(laser => {
                const transform = laser.getComponent('transform') as TransformComponent;
                if (!transform) return;

                const margin = 100;
                const { x, y } = transform.position;
                if (x < -margin || x > window.innerWidth + margin ||
                    y < -margin || y > window.innerHeight + margin) {
                    entityManager.destroyEntity(laser.id);
                }
            });
        }
    };
}

function showThrustEffect(ship: any, color: number) {
    const renderComp = ship.getComponent('render') as RenderComponent;
    if (renderComp) {
        renderComp.displayObject.tint = color;
        setTimeout(() => {
            if (renderComp.displayObject) {
                renderComp.displayObject.tint = 0xffffff;
            }
        }, 100);
    }
}

function wrapAroundScreen(rigidBody: RigidBodyComponent, transform: TransformComponent) {
    const margin = 50;
    let { x, y } = transform.position;
    let wrapped = false;

    if (x > window.innerWidth + margin) {
        x = -margin;
        wrapped = true;
    } else if (x < -margin) {
        x = window.innerWidth + margin;
        wrapped = true;
    }

    if (y > window.innerHeight + margin) {
        y = -margin;
        wrapped = true;
    } else if (y < -margin) {
        y = window.innerHeight + margin;
        wrapped = true;
    }

    if (wrapped) {
        rigidBody.setPosition({ x, y });
        transform.setPosition(x, y);
    }
}

function wrapAllAsteroids() {
    const entityManager = serviceContainer.get<EntityManager>('entityManager');
    const asteroids = entityManager.getEntitiesWithComponent('rigidbody').filter(entity => {
        const rigidBody = entity.getComponent('rigidbody') as RigidBodyComponent;
        return rigidBody?.body?.label?.startsWith('asteroid_');
    });

    asteroids.forEach(asteroid => {
        const rigidBody = asteroid.getComponent('rigidbody') as RigidBodyComponent;
        const transform = asteroid.getComponent('transform') as TransformComponent;
        if (rigidBody && transform) {
            wrapAroundScreen(rigidBody, transform);
        }
    });
}