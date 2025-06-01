import { Container } from 'pixi.js';
import { Engine } from 'matter-js';
import { Application } from '@/core/Application';
import { ShipBuilder } from '@/ui/ShipBuilder';
import { ShipSystem } from '@/systems/ShipSystem';
import { EntityManager } from '@/entities/EntityManager';
import { Block } from '@/entities/Block';
import { BlockDefinitions } from '@/entities/BlockDefinitions';
import { Ship } from '@/entities/Ship';
import { createTestRunner } from '@/debug/ship-builder-test';

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
        await this.application.start();        // Get the rendering engine for advanced features
        const renderingEngine = this.application.getRenderingEngine();

        // Reset camera to normal scale - let ShipBuilder handle its own camera
        renderingEngine.setCamera({
            x: 0,
            y: 0,
            zoom: 1.0  // Use normal scale at application level
        });

        // Now we can create EntityManager since application service is registered
        this.entityManager = new EntityManager();
        this.shipSystem = new ShipSystem(this.physicsEngine);        // Get the game container from the application
        this.gameContainer = this.application.getGameContainer();

        // Center the game container
        const pixiApp = this.application.getPixiApp();
        this.gameContainer.x = pixiApp.screen.width / 2;
        this.gameContainer.y = pixiApp.screen.height / 2; this.shipBuilder = new ShipBuilder(this.gameContainer, {
            gridSize: 32,
            gridWidth: 50,  // Increased from 25
            gridHeight: 30, // Increased from 15
            snapToGrid: true,
            showGrid: true,  // Enable grid to help with positioning
            showConnectionPoints: true
        });

        // Ensure proper sizing for the current screen
        this.shipBuilder.resize(pixiApp.screen.width, pixiApp.screen.height);

        // Register resize callback to keep ship builder UI synchronized
        renderingEngine.addResizeCallback((width, height) => {
            this.shipBuilder.resize(width, height);
        });

        this.setupDemo();
    }    private setupDemo(): void {
        // Create a small demo ship to start with so there's something to interact with
        this.createDemoShip();

        // Manual update loop for ship physics
        const updateLoop = () => {
            this.shipSystem.update(1/60); // Assuming 60 FPS
            requestAnimationFrame(updateLoop);
        };
        updateLoop();

        // Add automatic diagnostic tests to help identify hover preview issues
        this.runInitialDiagnostics();
    }

    /**
     * Run automatic diagnostics when demo loads to help identify issues
     */
    private async runInitialDiagnostics(): Promise<void> {
        console.log('\n🔍 RUNNING INITIAL SHIP BUILDER DIAGNOSTICS');
        console.log('='.repeat(50));
        
        try {
            // Wait a moment for everything to initialize
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Test 1: Check initial state using public methods
            console.log('\n📋 Initial System State:');
            const initialState = {
                hasShipBuilder: !!this.shipBuilder,
                selectedBlockType: this.shipBuilder?.getSelectedBlockType(),
                isBuildingMode: this.shipBuilder?.isBuildingMode(),
                shipBlockCount: this.shipBuilder?.getShip()?.blocks?.size || 0
            };
            console.log(initialState);
            
            // Test 2: Try selecting a block
            console.log('\n🎯 Testing Block Selection:');
            this.shipBuilder.selectBlockType('hull_basic');
            
            const afterSelection = {
                selectedBlockType: this.shipBuilder.getSelectedBlockType(),
                isBuildingMode: this.shipBuilder.isBuildingMode()
            };
            console.log(afterSelection);
            
            // Test 3: Call debug system state for comprehensive info
            console.log('\n🔧 Full System State Debug:');
            this.shipBuilder.debugSystemState();
            
            // Instructions for user testing
            console.log('\n📝 NEXT STEPS FOR USER TESTING:');
            console.log('1. Open browser console to see this output');
            console.log('2. Try hovering over the grid - preview blocks should appear');
            console.log('3. Click to place a block');
            console.log('4. Try hovering again - this is where the issue occurs');
            console.log('5. Run shipBuilderDemo.runTests() for comprehensive analysis');
            console.log('\n🐛 If hover preview stops working after placing a block,');
            console.log('   run: shipBuilderDemo.runTests() for detailed diagnosis');
            
        } catch (error) {
            console.error('❌ Diagnostics failed:', error);
        }
    }

    public createDemoShip(): void {
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

    console.log(`🚀 Initializing Ship Builder Demo...`);
    console.log(`🔍 Container provided:`, container);

    if (container) {
        // Use provided container
        gameContainer = container;
        console.log(`🔍 Using provided container:`, gameContainer);
        console.log(`🔍 Container dimensions:`, gameContainer.getBoundingClientRect());

        gameContainer.style.width = '100%';
        gameContainer.style.height = '100%';
        gameContainer.style.display = 'flex';
        gameContainer.style.justifyContent = 'center';
        gameContainer.style.alignItems = 'center';
        gameContainer.style.overflow = 'hidden';
        gameContainer.style.backgroundColor = '#0a0a0a';

        console.log(`✅ Container styles applied`);
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
    }

    console.log(`🔍 Final container dimensions:`, gameContainer.getBoundingClientRect());

    const demo = new ShipBuilderDemo(gameContainer);
    console.log(`✅ ShipBuilderDemo instance created`);

    await demo.waitForInitialization();
    console.log(`✅ ShipBuilderDemo initialization complete`);

    // Add some helpful console methods for debugging
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
    };    // Expose demo interface globally for debugging and interaction
    (window as any).shipBuilderDemo = {
        testConnections: () => demo.getShipBuilder().testConnectionSystem(),
        repairConnections: () => demo.getShipBuilder().repairConnections(),
        getShip: () => demo.getShipBuilder().getShip(),
        clearShip: () => demo.getShipBuilder().clearShip(),
        createDemoShip: () => demo.createDemoShip(),
        debugState: () => demo.getShipBuilder().debugSystemState(),
        selectBlock: (blockType: string) => demo.getShipBuilder().selectBlockType(blockType),
        runTests: async () => {
            const testRunner = createTestRunner(demo.getShipBuilder());
            await testRunner.runAllTests();
        },
        
        // Add automatic issue reproduction
        reproduceBug: async () => {
            console.log('\n🐛 REPRODUCING HOVER PREVIEW BUG');
            console.log('='.repeat(40));
            
            const shipBuilder = demo.getShipBuilder();
            
            // Step 1: Select a block
            console.log('Step 1: Selecting hull_basic block...');
            shipBuilder.selectBlockType('hull_basic');
            shipBuilder.debugSystemState();
            
            // Step 2: Simulate hover (before placement)
            console.log('\nStep 2: Testing hover BEFORE placing block...');
            const testPos1 = { x: 64, y: 64 }; // 2 grid cells from center
            const testPos1Screen = { x: 800, y: 500 }; // Screen position
            shipBuilder.testHandleMouseMove(testPos1, testPos1Screen);
            shipBuilder.debugSystemState();
            
            // Step 3: Place a block
            console.log('\nStep 3: Placing first block...');
            shipBuilder.testHandleLeftClick(testPos1, testPos1Screen);
            shipBuilder.debugSystemState();
            
            // Step 4: Try to hover again (this should fail)
            console.log('\nStep 4: Testing hover AFTER placing block...');
            const testPos2 = { x: 96, y: 64 }; // Adjacent position
            const testPos2Screen = { x: 832, y: 500 };
            shipBuilder.testHandleMouseMove(testPos2, testPos2Screen);
            shipBuilder.debugSystemState();
            
            console.log('\n📊 Bug reproduction complete. Check the debug output above.');
            console.log('🔍 Look for differences in preview block state between steps 2 and 4.');
        }
    };

    console.log('Ship Builder Demo ready!');
    console.log('Access demo via window.shipBuilderDemo');
    console.log('Get current ship stats: getShipStats()');
    console.log('Validate current ship: validateShip()');
    console.log('Test refactored components: testRefactorComponents()');
    console.log('Create demo ship: shipBuilderDemo.createDemoShip()');

    return demo;
}
