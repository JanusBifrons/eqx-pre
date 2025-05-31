import { Container } from 'pixi.js';
import { Engine } from 'matter-js';
import { Application } from '@/core/Application';
import { ShipBuilder } from '@/ui/ShipBuilder';
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
    private gameContainer!: Container;
    private initializationPromise: Promise<void>;

    constructor() {        // Create Application instance which will register itself in ServiceContainer
        this.application = new Application({
            width: 1600,
            height: 1000,
            backgroundColor: 0x0a0a0a,
            antialias: true
        });

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
        });

        // Ensure proper sizing for the current screen
        this.shipBuilder.resize(pixiApp.screen.width, pixiApp.screen.height);

        this.setupDemo();
    }

    private setupDemo(): void {
        // Create some demo content
        this.createDemoShip();

        // Start the game loop
        const pixiApp = this.application.getPixiApp();
        pixiApp.ticker.add(this.update.bind(this));

        // Add keyboard controls
        this.setupControls();

        console.log('Ship Builder Demo initialized!');
        console.log('Controls:');
        console.log('- Click blocks in palette to select');
        console.log('- Click in grid to place blocks');
        console.log('- Use Build/Test buttons to switch modes');
        console.log('- WASD to move ship in test mode');
    }

    private createDemoShip(): void {
        // Create a sample ship to demonstrate the system
        const ship = new Ship();

        // Create hull blocks
        const hullCenter = new Block(
            BlockDefinitions.get('hull_basic')!,
            BlockDefinitions.getDefaultProperties('hull_basic'),
            { x: 0, y: 0 }
        );

        const hullLeft = new Block(
            BlockDefinitions.get('hull_basic')!,
            BlockDefinitions.getDefaultProperties('hull_basic'),
            { x: -32, y: 0 }
        );

        const hullRight = new Block(
            BlockDefinitions.get('hull_basic')!,
            BlockDefinitions.getDefaultProperties('hull_basic'),
            { x: 32, y: 0 }
        );

        // Create engine
        const engine = new Block(
            BlockDefinitions.get('engine_basic')!,
            BlockDefinitions.getDefaultProperties('engine_basic'),
            { x: 0, y: 32 }
        );

        // Create weapons
        const weaponLeft = new Block(
            BlockDefinitions.get('weapon_laser')!,
            BlockDefinitions.getDefaultProperties('weapon_laser'),
            { x: -32, y: -32 }
        );

        const weaponRight = new Block(
            BlockDefinitions.get('weapon_laser')!,
            BlockDefinitions.getDefaultProperties('weapon_laser'),
            { x: 32, y: -32 }
        );

        // Add blocks to ship
        ship.addBlock(hullCenter);
        ship.addBlock(hullLeft);
        ship.addBlock(hullRight);
        ship.addBlock(engine);
        ship.addBlock(weaponLeft);
        ship.addBlock(weaponRight);

        // Connect blocks
        ship.connectBlocks(hullCenter, hullLeft, 0, 1); // left-right connection
        ship.connectBlocks(hullCenter, hullRight, 1, 0); // right-left connection
        ship.connectBlocks(hullCenter, engine, 3, 0); // center-engine connection
        ship.connectBlocks(hullLeft, weaponLeft, 2, 0); // left hull to left weapon
        ship.connectBlocks(hullRight, weaponRight, 2, 0); // right hull to right weapon

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
        this.gameContainer.addChild(shipContainer);

        // Register with ship system
        this.shipSystem.registerShip(ship);

        console.log('Demo ship created with stats:', ship.calculateStats());
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
    }

    public destroy(): void {
        this.shipBuilder.destroy();
        this.shipSystem.destroy();
        this.application.destroy();
    }
}

// Example usage and initialization
export async function initializeShipBuilderDemo(): Promise<ShipBuilderDemo> {    // Create required DOM elements
    const gameContainer = document.createElement('div');
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

    const demo = new ShipBuilderDemo();
    await demo.waitForInitialization();

    // Add some helpful console methods for debugging
    (window as any).shipBuilderDemo = demo;
    (window as any).getShip = () => demo.getShipBuilder().getShip();
    (window as any).getShipStats = () => demo.getShipBuilder().getShip().calculateStats();
    (window as any).validateShip = () => demo.getShipBuilder().getShip().validateStructuralIntegrity();

    console.log('Ship Builder Demo ready!');
    console.log('Access demo via window.shipBuilderDemo');
    console.log('Get current ship stats: getShipStats()');
    console.log('Validate current ship: validateShip()');

    return demo;
}
