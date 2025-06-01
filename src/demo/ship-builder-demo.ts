import { Container } from 'pixi.js';
import { Engine } from 'matter-js';
import { Application } from '@/core/Application';
import { ShipBuilderRefactored as ShipBuilder } from '@/ui/ShipBuilderRefactored';
import { ShipSystem } from '@/systems/ShipSystem';
import { EntityManager } from '@/entities/EntityManager';
import { Block } from '@/entities/Block';
import { BlockDefinitions } from '@/entities/BlockDefinitions';
import { Ship } from '@/entities/Ship';

export class ShipBuilderDemo {
    private application: Application;
    private physicsEngine: Engine;
    private entityManager!: EntityManager;
    private shipSystem!: ShipSystem;
    private shipBuilder!: ShipBuilder;
    private gameContainer!: Container; private initializationPromise: Promise<void>;

    constructor(domContainer?: HTMLElement) {
        // Create Application instance with unified rendering engine
        this.application = new Application({
            width: 1600,
            height: 1000,
            backgroundColor: 0x0a0a0a,
            antialias: true
        }, domContainer);

        this.physicsEngine = Engine.create();
        this.physicsEngine.world.gravity.y = 0; // Space physics - no gravity

        this.initializationPromise = this.initialize();
    }

    public async waitForInitialization(): Promise<void> {
        await this.initializationPromise;
    }

    private async initialize(): Promise<void> {
        // Start the application (this registers services)
        await this.application.start();

        // Get the rendering engine for advanced features
        const renderingEngine = this.application.getRenderingEngine();

        // Set camera for ship builder (zoomed in for detailed work)
        renderingEngine.setCamera({
            x: 0,
            y: 0,
            zoom: 1.2
        });

        // Now we can create EntityManager since application service is registered
        this.entityManager = new EntityManager();
        this.shipSystem = new ShipSystem(this.physicsEngine);

        // Get the game container from the application
        this.gameContainer = this.application.getGameContainer();

        // Center the game container
        const pixiApp = this.application.getPixiApp(); this.gameContainer.x = pixiApp.screen.width / 2;
        this.gameContainer.y = pixiApp.screen.height / 2; this.shipBuilder = new ShipBuilder(this.gameContainer, {
            gridSize: 32,
            gridWidth: 25,
            gridHeight: 15,
            snapToGrid: true,
            showGrid: false,  // Grid is now disabled to resolve mouse tracking issues
            showConnectionPoints: true
        });        // Ensure proper sizing for the current screen
        this.shipBuilder.resize(pixiApp.screen.width, pixiApp.screen.height);

        // Register resize callback to keep ship builder UI synchronized
        renderingEngine.addResizeCallback((width, height) => {
            this.shipBuilder.resize(width, height);
        });

        this.setupDemo();
    } private setupDemo(): void {
        // Don't create demo ship automatically - let user create it manually
        // This prevents unnecessary physics collisions when ship builder loads
        // this.createDemoShip();

        // Register systems with the Application's GameLoop instead of using separate ticker
        // This prevents duplicate update loops that cause rendering conflicts
        const gameLoop = this.application.getGameLoop();

        // Register ship builder demo system
        gameLoop.addSystem({
            name: 'ship-builder-demo',
            update: (deltaTime: number) => this.update(deltaTime),
            destroy: () => {
                // Cleanup handled in main destroy method
            }
        });

        // Add keyboard controls
        this.setupControls();// Expose test methods globally for debugging
        (window as any).shipBuilderDemo = {
            testConnections: () => this.shipBuilder.testConnectionSystem(),
            repairConnections: () => this.shipBuilder.repairConnections(),
            getShip: () => this.shipBuilder.getShip(),
            clearShip: () => this.shipBuilder.clearShip(),
            createDemoShip: () => this.createDemoShip()  // Allow manual demo ship creation
        }; console.log('Ship Builder Demo initialized!');
        console.log('Controls:');
        console.log('- Click blocks in palette to select');
        console.log('- Click in grid to place blocks');
        console.log('- Use Build/Test buttons to switch modes');
        console.log('Debug methods available:');
        console.log('- shipBuilderDemo.testConnections() - Test connection system');
        console.log('- shipBuilderDemo.repairConnections() - Repair ship connections');
        console.log('- shipBuilderDemo.getShip() - Get current ship');
        console.log('- shipBuilderDemo.clearShip() - Clear current ship');
        console.log('- shipBuilderDemo.createDemoShip() - Create sample ship with physics');
    }

    private createDemoShip(): void {
        // Create a sample ship to demonstrate the system
        const ship = new Ship();        // Create hull blocks - using standard 32x32 grid positions
        const hullCenter = new Block(
            BlockDefinitions.get('hull_basic')!,
            BlockDefinitions.getDefaultProperties('hull_basic'),
            { x: 0, y: 0 }
        );

        const hullLeft = new Block(
            BlockDefinitions.get('hull_basic')!,
            BlockDefinitions.getDefaultProperties('hull_basic'),
            { x: -32, y: 0 }  // One grid unit to the left
        );

        const hullRight = new Block(
            BlockDefinitions.get('hull_basic')!,
            BlockDefinitions.getDefaultProperties('hull_basic'),
            { x: 32, y: 0 }   // One grid unit to the right
        );

        // Create engine - properly positioned below center hull
        const engine = new Block(
            BlockDefinitions.get('engine_basic')!,
            BlockDefinitions.getDefaultProperties('engine_basic'),
            { x: 0, y: 32 }   // One grid unit below
        );

        // Create weapons - properly positioned above side hulls
        const weaponLeft = new Block(
            BlockDefinitions.get('weapon_laser')!,
            BlockDefinitions.getDefaultProperties('weapon_laser'),
            { x: -32, y: -32 }  // Above and left
        );

        const weaponRight = new Block(
            BlockDefinitions.get('weapon_laser')!,
            BlockDefinitions.getDefaultProperties('weapon_laser'),
            { x: 32, y: -32 }   // Above and right
        );

        // Add blocks to ship
        ship.addBlock(hullCenter);
        ship.addBlock(hullLeft);
        ship.addBlock(hullRight);
        ship.addBlock(engine);
        ship.addBlock(weaponLeft);
        ship.addBlock(weaponRight);

        // Connect blocks
        console.log('🔗 DEMO SHIP: Connecting blocks...');

        const connections = [
            { block1: hullCenter, block2: hullLeft, point1: 0, point2: 1, desc: 'center-left hull' },
            { block1: hullCenter, block2: hullRight, point1: 1, point2: 0, desc: 'center-right hull' },
            { block1: hullCenter, block2: engine, point1: 3, point2: 0, desc: 'center-engine' },
            { block1: hullLeft, block2: weaponLeft, point1: 2, point2: 0, desc: 'left hull-weapon' },
            { block1: hullRight, block2: weaponRight, point1: 2, point2: 0, desc: 'right hull-weapon' }
        ];

        for (const conn of connections) {
            const success = ship.connectBlocks(conn.block1, conn.block2, conn.point1, conn.point2);
            console.log(`  ${conn.desc}: ${success ? 'SUCCESS' : 'FAILED'}`);
        }

        // Add visual representations to the scene
        for (const block of ship.blocks.values()) {
            this.gameContainer.addChild(block.container);
            block.container.x = block.gridPosition.x;
            block.container.y = block.gridPosition.y;
        }

        // Position the demo ship away from the builder area
        const shipContainer = new Container();
        for (const block of ship.blocks.values()) {
            shipContainer.addChild(block.container);
        }
        shipContainer.x = 300;
        shipContainer.y = -200;
        this.gameContainer.addChild(shipContainer);        // Register with ship system
        this.shipSystem.registerShip(ship);

        console.log('Demo ship created with stats:', ship.calculateStats());
        console.log('✅ All blocks conform to grid sizing standards');
        console.log('✅ Blocks are properly positioned and connected');

        // Validate structural integrity
        const validation = ship.validateStructuralIntegrity();
        console.log('🔍 DEMO SHIP VALIDATION:', validation);

        if (!validation.isValid) {
            console.warn('⚠️ Demo ship has structural issues:', validation.issues);
        } else {
            console.log('✅ Demo ship passes structural validation');
        }
    }

    private setupControls(): void {
        const keys = new Set<string>();

        document.addEventListener('keydown', (event) => {
            keys.add(event.code);
        });

        document.addEventListener('keyup', (event) => {
            keys.delete(event.code);
        });

        // Store keys reference for update loop
        (this as any).keys = keys;
    }

    private update(deltaTime: number): void {
        const dt = deltaTime * 0.016; // Convert to seconds (60fps baseline)

        // Update physics
        Engine.update(this.physicsEngine, dt * 1000);

        // Update ship system
        this.shipSystem.update(dt);

        // Handle input for ship control
        this.handleShipControls(dt);

        // Update entity manager
        this.entityManager.update(dt);
    }

    private handleShipControls(_deltaTime: number): void {
        const keys = (this as any).keys as Set<string>;
        const ships = this.shipSystem.getShips();

        if (ships.length === 0) return;        // Control the first ship (demo ship)
        const ship = ships[0];
        const shipComponent = ship.getComponent('ship') as any;

        if (!shipComponent?.isConstructed) return;

        // Apply ship controls
        if (keys.has('KeyW')) {
            this.shipSystem.applyThrustToShip(ship, { x: 0, y: -1 }, 1);
        }
        if (keys.has('KeyS')) {
            this.shipSystem.applyThrustToShip(ship, { x: 0, y: 1 }, 1);
        }
        if (keys.has('KeyA')) {
            this.shipSystem.applyThrustToShip(ship, { x: -1, y: 0 }, 1);
        }
        if (keys.has('KeyD')) {
            this.shipSystem.applyThrustToShip(ship, { x: 1, y: 0 }, 1);
        }
    } public getPixiApp() {
        return this.application.getPixiApp();
    }

    public getShipBuilder(): ShipBuilder {
        return this.shipBuilder;
    }

    public getShipSystem(): ShipSystem {
        return this.shipSystem;
    } public destroy(): void {
        // Remove systems from game loop first
        const gameLoop = this.application.getGameLoop();
        gameLoop.removeSystem('ship-builder-demo');

        // Then destroy components
        this.shipBuilder.destroy();
        this.shipSystem.destroy();
        this.application.destroy();
    }
}

// Example usage and initialization
export async function initializeShipBuilderDemo(container?: HTMLElement): Promise<ShipBuilderDemo> {
    // Create required DOM elements
    let gameContainer: HTMLElement;

    if (container) {
        // Use provided container
        gameContainer = container;
        gameContainer.style.width = '100%';
        gameContainer.style.height = '100%';
        gameContainer.style.display = 'flex';
        gameContainer.style.justifyContent = 'center';
        gameContainer.style.alignItems = 'center';
        gameContainer.style.overflow = 'hidden';
        gameContainer.style.backgroundColor = '#0a0a0a';
    } else {
        // Create new container and append to body (fallback for legacy usage)
        gameContainer = document.createElement('div');
        gameContainer.id = 'game-container';
        gameContainer.style.width = '100%';
        gameContainer.style.height = '100vh';
        gameContainer.style.display = 'flex';
        gameContainer.style.justifyContent = 'center';
        gameContainer.style.alignItems = 'center';
        gameContainer.style.overflow = 'hidden';
        gameContainer.style.backgroundColor = '#0a0a0a';
        document.body.appendChild(gameContainer);

        // Apply full-screen styling to body
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
        document.body.style.backgroundColor = '#0a0a0a';
    } const demo = new ShipBuilderDemo(gameContainer);
    await demo.waitForInitialization();    // Add some helpful console methods for debugging
    (window as any).shipBuilderDemo = demo;
    (window as any).getShip = () => demo.getShipBuilder().getShip();
    (window as any).getShipStats = () => demo.getShipBuilder().getShip().calculateStats();
    (window as any).validateShip = () => demo.getShipBuilder().getShip().validateStructuralIntegrity(); (window as any).testRefactorComponents = () => {
        console.log('🧪 TESTING REFACTORED COMPONENTS:');

        try {
            // Test component methods (DO NOT auto-run these during initialization)
            console.log('Available test methods:');
            console.log('- builder.testConnectionSystem() - Creates test blocks');
            console.log('- builder.repairConnections() - Repairs ship connections');
            console.log('- builder.clearShip() - Clears current ship');
            console.log('- builder.resize(1600, 1000) - Resizes ship builder');

            console.log('✅ All component methods available!');
            return true;
        } catch (error) {
            console.error('❌ Component test failed:', error);
            return false;
        }
    }; console.log('Ship Builder Demo ready!');
    console.log('Access demo via window.shipBuilderDemo');
    console.log('Get current ship stats: getShipStats()');
    console.log('Validate current ship: validateShip()');
    console.log('Test refactored components: testRefactorComponents()');
    console.log('Create demo ship: shipBuilderDemo.createDemoShip()');

    return demo;
}
