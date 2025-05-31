import { Container, Graphics, Text, FederatedPointerEvent } from 'pixi.js';
import { Ship } from '@/entities/Ship';
import { Block, BlockType } from '@/entities/Block';
import { BlockDefinitions } from '@/entities/BlockDefinitions';
import { Vector } from 'matter-js';

export interface GridPosition {
    x: number;
    y: number;
}

export interface BuilderOptions {
    gridSize: number;
    gridWidth: number;
    gridHeight: number;
    snapToGrid: boolean;
    showGrid: boolean;
    showConnectionPoints: boolean;
}

export class ShipBuilder {
    private container: Container;
    private ship: Ship;
    private gridGraphics: Graphics;
    private blockPalette: Container;
    private previewBlock: Block | null = null;
    private selectedBlockType: string | null = null;
    private selectedButton: Container | null = null;
    private options: BuilderOptions;
    private isBuilding: boolean = true;

    // Camera/viewport system
    private worldContainer: Container;
    private camera: { x: number; y: number; zoom: number } = { x: 0, y: 0, zoom: 1 };
    private isDragging: boolean = false;
    private lastDragPosition: { x: number; y: number } | null = null;
    private panSpeed: number = 1;
    private zoomSpeed: number = 0.1;
    private minZoom: number = 0.5;
    private maxZoom: number = 3;

    // UI elements
    private statsContainer: Container;
    private statsText: Text;
    private buildButton: Graphics;
    private testButton: Graphics;
    private instructionsContainer: Container;

    // Layout constants
    private readonly PALETTE_WIDTH = 200;
    private readonly PALETTE_HEIGHT = 600;
    private readonly STATS_WIDTH = 300;
    private readonly STATS_HEIGHT = 200;
    private readonly BUTTON_WIDTH = 120;
    private readonly BUTTON_HEIGHT = 40;
    private readonly INSTRUCTIONS_WIDTH = 350;
    private readonly INSTRUCTIONS_HEIGHT = 250; constructor(container: Container, options: Partial<BuilderOptions> = {}) {
        this.container = container;
        this.ship = new Ship();
        this.options = {
            gridSize: 32,
            gridWidth: 40,
            gridHeight: 30,
            snapToGrid: true,
            showGrid: true,
            showConnectionPoints: true,
            ...options
        };

        // Initialize camera system
        this.worldContainer = new Container();
        this.container.addChild(this.worldContainer);

        this.gridGraphics = new Graphics();
        this.blockPalette = new Container();
        this.statsContainer = new Container();
        this.statsText = new Text('', { fill: 0xFFFFFF, fontSize: 14 });
        this.buildButton = new Graphics();
        this.testButton = new Graphics();
        this.instructionsContainer = new Container();

        this.initialize();
    } private initialize(): void {
        // Add world objects to the world container (things that can be panned/zoomed)
        // Only add grid graphics if they should be shown
        if (this.options.showGrid) {
            this.worldContainer.addChild(this.gridGraphics);
        } else {
            // If grid is hidden, add placement area visualization instead
            this.addPlacementAreaVisualization();
        }

        this.worldContainer.addChild(this.ship.container);

        // Add UI elements directly to main container (fixed position, no panning)
        this.container.addChild(this.blockPalette);
        this.container.addChild(this.statsContainer);
        this.container.addChild(this.instructionsContainer);

        this.setupGrid();
        this.setupPalette();
        this.setupUI();
        this.setupInstructions();
        this.setupInteraction();
        this.updateStats();

        // Set initial camera position
        this.updateCameraTransform();
    } private setupGrid(): void {
        // Grid is no longer rendered, but we keep this method for consistency
        // and potential future grid re-enabling

        // Create an empty graphics object without any rendering
        this.gridGraphics.clear();

        // Ensure the grid graphics are not interactive
        this.gridGraphics.interactive = false;
        this.gridGraphics.interactiveChildren = false;

        // Log that we're using a gridless setup
        console.log("Using gridless design for better mouse tracking");
    } private setupPalette(): void {
        // Create palette background
        const bg = new Graphics();
        bg.beginFill(0x222222, 0.9);
        bg.drawRect(0, 0, this.PALETTE_WIDTH, this.PALETTE_HEIGHT);
        bg.endFill();
        this.blockPalette.addChild(bg);

        // Position palette on the left side with proper margins
        const gridHalfWidth = (this.options.gridWidth * this.options.gridSize) / 2;
        this.blockPalette.x = -gridHalfWidth - this.PALETTE_WIDTH - 20;
        this.blockPalette.y = -this.PALETTE_HEIGHT / 2;

        // Add title
        const title = new Text('Block Palette', { fill: 0xFFFFFF, fontSize: 16 });
        title.x = 10;
        title.y = 10;
        this.blockPalette.addChild(title);

        // Add block categories
        let currentY = 40;
        const categories = [
            { type: BlockType.HULL, label: 'Hull Blocks' },
            { type: BlockType.ENGINE, label: 'Engines' },
            { type: BlockType.WEAPON, label: 'Weapons' },
            { type: BlockType.UTILITY, label: 'Utilities' }
        ];

        for (const category of categories) {
            // Category header
            const categoryText = new Text(category.label, { fill: 0xCCCCCC, fontSize: 14 });
            categoryText.x = 10;
            categoryText.y = currentY;
            this.blockPalette.addChild(categoryText);
            currentY += 25;

            // Add blocks of this type
            const blocksOfType = BlockDefinitions.getByType(category.type);
            for (const { id, definition } of blocksOfType) {
                const blockButton = this.createBlockButton(id, definition, 10, currentY);
                this.blockPalette.addChild(blockButton);
                currentY += 60;
            }

            currentY += 10; // Extra spacing between categories
        }
    }

    private createBlockButton(blockId: string, definition: any, x: number, y: number): Container {
        const button = new Container();
        button.x = x;
        button.y = y;

        // Button background
        const bg = new Graphics();
        bg.beginFill(0x444444, 0.8);
        bg.lineStyle(2, 0x666666);
        bg.drawRect(0, 0, 180, 50);
        bg.endFill();
        button.addChild(bg);

        // Block preview (scaled down)
        const preview = new Graphics();
        const scale = 0.8;
        preview.beginFill(definition.color, 0.8);
        preview.lineStyle(1, 0xFFFFFF, 0.8);

        switch (definition.shape) {
            case 'circle':
                preview.drawCircle(25, 25, definition.width * scale / 2);
                break;
            case 'rectangle':
            default:
                const w = definition.width * scale;
                const h = definition.height * scale;
                preview.drawRect(25 - w / 2, 25 - h / 2, w, h);
                break;
        }
        preview.endFill();
        button.addChild(preview);

        // Block name
        const nameText = new Text(blockId.replace('_', ' '), {
            fill: 0xFFFFFF,
            fontSize: 10,
            wordWrap: true,
            wordWrapWidth: 120
        });
        nameText.x = 55;
        nameText.y = 10;
        button.addChild(nameText);

        // Block stats
        const statsText = new Text(`Mass: ${definition.mass}\nHP: ${definition.maxHealth}`, {
            fill: 0xCCCCCC,
            fontSize: 8
        });
        statsText.x = 55;
        statsText.y = 25;
        button.addChild(statsText);        // Make interactive
        button.interactive = true;
        button.eventMode = 'static';
        button.on('pointerdown', () => this.selectBlockType(blockId, button));

        return button;
    } private setupUI(): void {
        // Position stats display on the right side with proper margins
        const gridHalfWidth = (this.options.gridWidth * this.options.gridSize) / 2;
        this.statsContainer.x = gridHalfWidth + 20;
        this.statsContainer.y = -this.STATS_HEIGHT / 2;

        const statsBg = new Graphics();
        statsBg.beginFill(0x222222, 0.9);
        statsBg.drawRect(0, 0, this.STATS_WIDTH, this.STATS_HEIGHT);
        statsBg.endFill();
        this.statsContainer.addChild(statsBg);

        const statsTitle = new Text('Ship Statistics', { fill: 0xFFFFFF, fontSize: 16 });
        statsTitle.x = 10;
        statsTitle.y = 10;
        this.statsContainer.addChild(statsTitle);

        this.statsText.x = 10;
        this.statsText.y = 35;
        this.statsContainer.addChild(this.statsText);

        // Build/Test buttons
        this.setupButtons();
    } private setupButtons(): void {
        const gridHalfWidth = (this.options.gridWidth * this.options.gridSize) / 2;
        const buttonX = gridHalfWidth + 20;

        // Build button
        this.buildButton.beginFill(0x00AA00, 0.8);
        this.buildButton.lineStyle(2, 0x00FF00);
        this.buildButton.drawRect(0, 0, this.BUTTON_WIDTH, this.BUTTON_HEIGHT);
        this.buildButton.endFill();
        this.buildButton.x = buttonX;
        this.buildButton.y = this.STATS_HEIGHT / 2 + 30;
        this.buildButton.interactive = true;
        this.buildButton.eventMode = 'static';
        this.buildButton.on('pointerdown', () => this.toggleBuildMode());

        const buildText = new Text('Build Mode', { fill: 0xFFFFFF, fontSize: 14 });
        buildText.x = 15;
        buildText.y = 10;
        this.buildButton.addChild(buildText);

        // Test button
        this.testButton.beginFill(0xAA6600, 0.8);
        this.testButton.lineStyle(2, 0xFF9900);
        this.testButton.drawRect(0, 0, this.BUTTON_WIDTH, this.BUTTON_HEIGHT);
        this.testButton.endFill();
        this.testButton.x = buttonX;
        this.testButton.y = this.STATS_HEIGHT / 2 + 80;
        this.testButton.interactive = true;
        this.testButton.eventMode = 'static';
        this.testButton.on('pointerdown', () => this.testShip());

        const testText = new Text('Test Ship', { fill: 0xFFFFFF, fontSize: 14 });
        testText.x = 25;
        testText.y = 10;
        this.testButton.addChild(testText);

        this.container.addChild(this.buildButton);
        this.container.addChild(this.testButton);
    } private setupInteraction(): void {
        // Set up interaction on the main container to catch all events
        this.container.interactive = true;
        this.container.eventMode = 'static';

        // Create a large hit area for the main container to capture all events
        const hitArea = new Graphics();

        // Use transparent fill for hit detection
        hitArea.beginFill(0x000000, 0); // Transparent

        // Create a very large hit area to ensure all mouse events are captured
        // This is critical for proper mouse tracking without the grid
        hitArea.drawRect(-5000, -5000, 10000, 10000); // Extra large area
        hitArea.endFill();

        // Add to bottom of display list so it doesn't interfere with other objects
        this.container.addChildAt(hitArea, 0);

        // Debug: Can uncomment this section to visualize the hit area during development
        // const hitAreaDebug = new Graphics();
        // hitAreaDebug.beginFill(0xFF0000, 0.05); // Very faint red
        // hitAreaDebug.drawRect(-5000, -5000, 10000, 10000);
        // hitAreaDebug.endFill();
        // this.container.addChildAt(hitAreaDebug, 1);

        // Set up event listeners
        this.container.on('pointermove', (event: FederatedPointerEvent) => this.onPointerMove(event));
        this.container.on('pointerdown', (event: FederatedPointerEvent) => this.onPointerDown(event));
        this.container.on('pointerup', (event: FederatedPointerEvent) => this.onPointerUp(event));
        this.container.on('pointerupoutside', (event: FederatedPointerEvent) => this.onPointerUp(event));
        this.container.on('wheel', (event: any) => this.onWheel(event));

        // Add keyboard controls
        this.setupKeyboardControls();
    } private selectBlockType(blockId: string, buttonContainer?: Container): void {
        this.selectedBlockType = blockId;

        // Update visual selection feedback
        if (this.selectedButton) {
            // Reset previous selection
            const prevBg = this.selectedButton.getChildAt(0) as Graphics;
            prevBg.clear();
            prevBg.beginFill(0x444444, 0.8);
            prevBg.lineStyle(2, 0x666666);
            prevBg.drawRect(0, 0, 180, 50);
            prevBg.endFill();
        }

        if (buttonContainer) {
            // Highlight current selection
            this.selectedButton = buttonContainer;
            const bg = buttonContainer.getChildAt(0) as Graphics;
            bg.clear();
            bg.beginFill(0x004488, 0.9);
            bg.lineStyle(3, 0x00AAFF);
            bg.drawRect(0, 0, 180, 50);
            bg.endFill();
        }        // Remove existing preview
        if (this.previewBlock) {
            this.previewBlock.destroy();
            this.previewBlock = null;
        }

        // Create new preview block
        this.recreatePreviewBlock();

        console.log(`Selected block type: ${blockId}`);
    } private onPointerMove(event: FederatedPointerEvent): void {
        // Get the pointer position in the main container's coordinate space
        const localPosition = event.data.getLocalPosition(this.container);

        // Handle camera dragging (middle mouse button or right mouse button)
        if (this.isDragging && this.lastDragPosition) {
            const deltaX = localPosition.x - this.lastDragPosition.x;
            const deltaY = localPosition.y - this.lastDragPosition.y;
            this.panCamera(deltaX, deltaY);
            this.lastDragPosition = { x: localPosition.x, y: localPosition.y };
            return;
        }

        // Handle block preview movement
        if (!this.previewBlock || !this.isBuilding) {
            // Skip if we don't have a preview block or not in building mode
            return;
        }

        // Convert container coordinates to world coordinates
        // This takes into account the camera position and zoom level
        const worldX = (localPosition.x - this.camera.x) / this.camera.zoom;
        const worldY = (localPosition.y - this.camera.y) / this.camera.zoom;
        const worldPosition = { x: worldX, y: worldY };

        // Optionally snap to grid if enabled
        const finalPos = this.options.snapToGrid ? this.snapToGrid(worldPosition) : worldPosition;

        if (this.previewBlock) {
            // Update the preview block's grid position and visual position
            this.previewBlock.setGridPosition(finalPos);
            this.previewBlock.container.x = finalPos.x;
            this.previewBlock.container.y = finalPos.y;

            // Debug logging (uncomment if needed for troubleshooting)
            // console.log('Mouse tracking:', {
            //    localPos: localPosition,
            //    worldPos: worldPosition, 
            //    finalPos: finalPos, 
            //    camera: this.camera
            // });
        }
    } private onPointerDown(event: FederatedPointerEvent): void {
        const localPosition = event.data.getLocalPosition(this.container);

        // Check for camera panning (middle mouse button or right mouse with shift)
        if (event.data.button === 1 || (event.data.button === 2 && event.shiftKey)) {
            this.isDragging = true;
            this.lastDragPosition = { x: localPosition.x, y: localPosition.y };
            return;
        }

        // Handle block placement
        if (!this.previewBlock || !this.isBuilding || !this.selectedBlockType) return;

        // Convert container coordinates to world coordinates
        const worldX = (localPosition.x - this.camera.x) / this.camera.zoom;
        const worldY = (localPosition.y - this.camera.y) / this.camera.zoom;

        const worldPosition = { x: worldX, y: worldY };

        // Apply grid snapping if enabled (even when grid is invisible)
        const finalPos = this.options.snapToGrid ? this.snapToGrid(worldPosition) : worldPosition;

        // Check if position is valid (not occupied)
        if (this.isPositionOccupied(finalPos)) {
            return;
        }

        // Create actual block
        const definition = BlockDefinitions.get(this.selectedBlockType)!;
        const properties = BlockDefinitions.getDefaultProperties(this.selectedBlockType);
        const newBlock = new Block(definition, properties, finalPos);

        // Add to ship
        this.ship.addBlock(newBlock, finalPos);

        // Position the block's container correctly
        newBlock.container.x = finalPos.x;
        newBlock.container.y = finalPos.y;

        this.ship.container.addChild(newBlock.container);

        // Try to auto-connect to nearby blocks
        this.autoConnect(newBlock);

        console.log(`Block placed at (${finalPos.x}, ${finalPos.y})`);

        // Update UI
        this.updateStats();

        // Recreate preview block for continued building
        this.recreatePreviewBlock();
    } private recreatePreviewBlock(): void {
        // Remove existing preview
        if (this.previewBlock) {
            this.previewBlock.destroy();
            this.previewBlock = null;
        }

        // Only recreate if we have a selected block type and are in building mode
        if (this.selectedBlockType && this.isBuilding) {
            const definition = BlockDefinitions.get(this.selectedBlockType);
            const properties = BlockDefinitions.getDefaultProperties(this.selectedBlockType);

            if (definition) {
                this.previewBlock = new Block(definition, properties);

                // Make the preview block semi-transparent                this.previewBlock.container.alpha = 0.5;

                // Add a placement indicator since we removed the grid
                const indicator = new Graphics();
                indicator.lineStyle(2, 0x33FF33, 0.8);

                // Draw a dashed placement indicator around the block
                if (definition.shape === 'circle') {
                    // For circular blocks, draw a circular indicator
                    const radius = definition.width / 2;
                    this.drawDashedCircle(indicator, 0, 0, radius + 2);
                } else {
                    // For rectangular blocks, draw a rectangular indicator
                    const width = definition.width;
                    const height = definition.height;
                    this.drawDashedRect(indicator, -width / 2 - 2, -height / 2 - 2, width + 4, height + 4);
                }

                this.previewBlock.container.addChild(indicator);
                this.worldContainer.addChild(this.previewBlock.container);
                console.log(`Preview block recreated for type: ${this.selectedBlockType} (gridless mode active)`);
            }
        }
    }

    // Helper method to draw a dashed rectangle
    private drawDashedRect(graphics: Graphics, x: number, y: number, width: number, height: number): void {
        const dashLength = 4;
        const gapLength = 2;
        let currentPos = 0;

        // Draw top line
        while (currentPos < width) {
            const segLength = Math.min(dashLength, width - currentPos);
            if (currentPos % (dashLength + gapLength) < dashLength) {
                graphics.moveTo(x + currentPos, y);
                graphics.lineTo(x + currentPos + segLength, y);
            }
            currentPos += 1;
        }

        // Draw right line
        currentPos = 0;
        while (currentPos < height) {
            const segLength = Math.min(dashLength, height - currentPos);
            if (currentPos % (dashLength + gapLength) < dashLength) {
                graphics.moveTo(x + width, y + currentPos);
                graphics.lineTo(x + width, y + currentPos + segLength);
            }
            currentPos += 1;
        }

        // Draw bottom line
        currentPos = 0;
        while (currentPos < width) {
            const segLength = Math.min(dashLength, width - currentPos);
            if (currentPos % (dashLength + gapLength) < dashLength) {
                graphics.moveTo(x + width - currentPos, y + height);
                graphics.lineTo(x + width - currentPos - segLength, y + height);
            }
            currentPos += 1;
        }

        // Draw left line
        currentPos = 0;
        while (currentPos < height) {
            const segLength = Math.min(dashLength, height - currentPos);
            if (currentPos % (dashLength + gapLength) < dashLength) {
                graphics.moveTo(x, y + height - currentPos);
                graphics.lineTo(x, y + height - currentPos - segLength);
            }
            currentPos += 1;
        }
    }

    // Helper method to draw a dashed circle
    private drawDashedCircle(graphics: Graphics, centerX: number, centerY: number, radius: number): void {
        const segments = 32;
        const dashLength = 2;
        const gapLength = 1;

        for (let i = 0; i < segments; i++) {
            if (i % (dashLength + gapLength) < dashLength) {
                const startAngle = (i / segments) * Math.PI * 2;
                const endAngle = ((i + 1) / segments) * Math.PI * 2;

                const startX = centerX + Math.cos(startAngle) * radius;
                const startY = centerY + Math.sin(startAngle) * radius;
                const endX = centerX + Math.cos(endAngle) * radius;
                const endY = centerY + Math.sin(endAngle) * radius;

                graphics.moveTo(startX, startY);
                graphics.lineTo(endX, endY);
            }
        }
    }

    private onPointerUp(_event: FederatedPointerEvent): void {
        this.isDragging = false;
        this.lastDragPosition = null;
    }

    private onWheel(event: any): void {
        event.preventDefault();

        const localPosition = event.data.getLocalPosition(this.container);
        const zoomDelta = -event.deltaY * this.zoomSpeed * 0.01;

        this.zoomCamera(zoomDelta, localPosition.x, localPosition.y);
    }

    private setupKeyboardControls(): void {
        // Add keyboard event listeners for camera controls
        document.addEventListener('keydown', (event) => {
            if (event.target !== document.body) return; // Only when not typing in inputs

            const panDistance = 20 / this.camera.zoom;

            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    if (event.shiftKey) {
                        this.panCamera(0, panDistance);
                        event.preventDefault();
                    }
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (event.shiftKey) {
                        this.panCamera(0, -panDistance);
                        event.preventDefault();
                    }
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    if (event.shiftKey) {
                        this.panCamera(panDistance, 0);
                        event.preventDefault();
                    }
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (event.shiftKey) {
                        this.panCamera(-panDistance, 0);
                        event.preventDefault();
                    }
                    break;
                case 'KeyR':
                    if (event.ctrlKey) {
                        this.resetCamera();
                        event.preventDefault();
                    }
                    break;
                case 'Equal':
                case 'NumpadAdd':
                    if (event.ctrlKey) {
                        this.zoomCamera(this.zoomSpeed);
                        event.preventDefault();
                    }
                    break;
                case 'Minus':
                case 'NumpadSubtract':
                    if (event.ctrlKey) {
                        this.zoomCamera(-this.zoomSpeed);
                        event.preventDefault();
                    }
                    break;
            }
        });
    } private snapToGrid(position: Vector): Vector {
        if (!this.options.snapToGrid) return position;

        const { gridSize } = this.options;
        // Snap to grid even when grid isn't visible
        return {
            x: Math.round(position.x / gridSize) * gridSize,
            y: Math.round(position.y / gridSize) * gridSize
        };
    }

    private isPositionOccupied(position: Vector): boolean {
        for (const block of this.ship.blocks.values()) {
            const blockPos = block.gridPosition;
            if (Math.abs(blockPos.x - position.x) < 1 && Math.abs(blockPos.y - position.y) < 1) {
                return true;
            }
        }
        return false;
    }

    private autoConnect(newBlock: Block): void {
        const connectionRange = this.options.gridSize * 1.5;

        for (const existingBlock of this.ship.blocks.values()) {
            if (existingBlock === newBlock) continue;

            const distance = Vector.magnitude(Vector.sub(newBlock.gridPosition, existingBlock.gridPosition));
            if (distance <= connectionRange) {
                // Try to find compatible connection points
                const newBlockPoints = newBlock.getAvailableConnectionPoints();
                const existingBlockPoints = existingBlock.getAvailableConnectionPoints();

                if (newBlockPoints.length > 0 && existingBlockPoints.length > 0) {
                    // Connect using first available points
                    this.ship.connectBlocks(
                        newBlock,
                        existingBlock,
                        newBlockPoints[0],
                        existingBlockPoints[0]
                    );
                }
            }
        }
    }

    private updateStats(): void {
        const stats = this.ship.calculateStats();
        const validation = this.ship.validateStructuralIntegrity();

        let statsString = `Blocks: ${stats.blockCount}\n`;
        statsString += `Total Mass: ${stats.totalMass.toFixed(1)}\n`;
        statsString += `Center of Mass: (${stats.centerOfMass.x.toFixed(1)}, ${stats.centerOfMass.y.toFixed(1)})\n`;
        statsString += `Total Thrust: ${stats.totalThrust}\n`;
        statsString += `Total Armor: ${stats.totalArmor}\n`;
        statsString += `Weapons: ${stats.totalWeapons}\n\n`;

        if (!validation.isValid) {
            statsString += 'Issues:\n';
            validation.issues.forEach(issue => {
                statsString += `• ${issue}\n`;
            });
        } else {
            statsString += 'Ship is valid!';
        }

        this.statsText.text = statsString;
    }

    private toggleBuildMode(): void {
        this.isBuilding = !this.isBuilding;

        if (this.isBuilding) {
            // Switch to build mode
            const buildText = this.buildButton.children[0] as Text;
            buildText.text = 'Build Mode';
            this.buildButton.clear();
            this.buildButton.beginFill(0x00AA00, 0.8);
            this.buildButton.lineStyle(2, 0x00FF00);
            this.buildButton.drawRect(0, 0, 120, 40);
            this.buildButton.endFill();
        } else {
            // Switch to test mode
            const buildText = this.buildButton.children[0] as Text;
            buildText.text = 'Edit Mode';
            this.buildButton.clear();
            this.buildButton.beginFill(0xAA0000, 0.8);
            this.buildButton.lineStyle(2, 0xFF0000);
            this.buildButton.drawRect(0, 0, 120, 40);
            this.buildButton.endFill();
        }

        // Hide/show preview block
        if (this.previewBlock) {
            this.previewBlock.container.visible = this.isBuilding;
        }
    }

    private testShip(): void {
        const validation = this.ship.validateStructuralIntegrity();

        if (!validation.isValid) {
            console.warn('Cannot test ship: validation failed', validation.issues);
            return;
        }        // Create compound physics body for testing
        this.ship.createCompoundPhysicsBody();
        // Enable physics simulation
        const shipComponent = this.ship.getComponent('ship') as any;
        if (shipComponent && shipComponent.setConstructed) {
            shipComponent.setConstructed(true);
        }

        console.log('Ship test mode activated!');
        console.log('Ship stats:', this.ship.calculateStats());
    }

    public getShip(): Ship {
        return this.ship;
    }

    public clearShip(): void {
        this.ship.destroy();
        this.ship = new Ship();
        this.updateStats();
    }

    public saveShip(): any {
        // Serialize ship data
        const shipData = {
            blocks: Array.from(this.ship.blocks.values()).map(block => ({
                id: block.id,
                type: this.selectedBlockType, // You'd need to store this properly
                position: block.gridPosition,
                rotation: block.rotation
            })), connections: this.ship.constraints.map(() => ({
                // Store constraint data
            }))
        };

        return shipData;
    }

    public loadShip(_shipData: any): void {
        this.clearShip();

        // Reconstruct ship from data
        // Implementation would depend on your serialization format
    }

    public destroy(): void {
        this.ship.destroy();
        if (this.previewBlock) {
            this.previewBlock.destroy();
        }
        this.container.destroy({ children: true });
    } private setupInstructions(): void {
        const gridHalfHeight = (this.options.gridHeight * this.options.gridSize) / 2;

        // Position instructions at the bottom center
        this.instructionsContainer.x = -this.INSTRUCTIONS_WIDTH / 2;
        this.instructionsContainer.y = gridHalfHeight + 20;        // Instructions background with border
        const instructionsBg = new Graphics();
        instructionsBg.beginFill(0x1a1a1a, 0.95);
        instructionsBg.lineStyle(3, 0x00AAFF, 0.8);
        instructionsBg.drawRect(0, 0, this.INSTRUCTIONS_WIDTH, this.INSTRUCTIONS_HEIGHT);
        instructionsBg.endFill();
        this.instructionsContainer.addChild(instructionsBg);

        // Instructions title with glow effect
        const title = new Text('🚀 Ship Builder Controls', {
            fill: 0x00AAFF,
            fontSize: 18,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: 0x004488,
            dropShadowBlur: 4,
            dropShadowDistance: 2
        });
        title.x = 10;
        title.y = 8;
        this.instructionsContainer.addChild(title);        // Instructions text with better formatting
        const instructions = [
            '🎯 Click blocks in LEFT PALETTE to select them',
            '📍 Click in BUILDING AREA to place selected blocks',
            '🔗 Blocks auto-connect when placed adjacent',
            '🔨 BUILD MODE: Construct and modify your ship',
            '🚀 TEST MODE: Pilot ship with WASD keys',
            '📊 View ship stats in the RIGHT PANEL',
            '',
            '🎮 Camera Controls:',
            '   • Middle-click & drag to pan camera',
            '   • Mouse wheel to zoom in/out',
            '   • Shift+Arrow keys to pan',
            '   • Ctrl+R to reset camera view',
            '   • Ctrl +/- to zoom'
        ];

        const instructionText = new Text(instructions.join('\n'), {
            fill: 0xEEEEEE,
            fontSize: 12,
            lineHeight: 18,
            wordWrap: true,
            wordWrapWidth: this.INSTRUCTIONS_WIDTH - 20
        });
        instructionText.x = 10;
        instructionText.y = 35;
        this.instructionsContainer.addChild(instructionText);
    }

    public resize(screenWidth: number, screenHeight: number): void {
        // Update grid size if screen is too small
        const minScreenWidth = this.PALETTE_WIDTH + (this.options.gridWidth * this.options.gridSize) + this.STATS_WIDTH + 80;
        const minScreenHeight = Math.max(this.PALETTE_HEIGHT, this.options.gridHeight * this.options.gridSize) + this.INSTRUCTIONS_HEIGHT + 40;

        // Reposition elements based on new screen size
        const gridHalfWidth = (this.options.gridWidth * this.options.gridSize) / 2;
        const gridHalfHeight = (this.options.gridHeight * this.options.gridSize) / 2;

        // Reposition palette
        this.blockPalette.x = -gridHalfWidth - this.PALETTE_WIDTH - 20;
        this.blockPalette.y = -this.PALETTE_HEIGHT / 2;

        // Reposition stats
        this.statsContainer.x = gridHalfWidth + 20;
        this.statsContainer.y = -this.STATS_HEIGHT / 2;

        // Reposition buttons
        const buttonX = gridHalfWidth + 20;
        this.buildButton.x = buttonX;
        this.buildButton.y = this.STATS_HEIGHT / 2 + 30;
        this.testButton.x = buttonX;
        this.testButton.y = this.STATS_HEIGHT / 2 + 80;

        // Reposition instructions
        this.instructionsContainer.x = -this.INSTRUCTIONS_WIDTH / 2;
        this.instructionsContainer.y = gridHalfHeight + 20;

        console.log(`UI resized for screen: ${screenWidth}x${screenHeight}, minimum required: ${minScreenWidth}x${minScreenHeight}`);
    }

    // Camera system methods
    private updateCameraTransform(): void {
        this.worldContainer.x = this.camera.x;
        this.worldContainer.y = this.camera.y;
        this.worldContainer.scale.set(this.camera.zoom);
    }

    private panCamera(deltaX: number, deltaY: number): void {
        this.camera.x += deltaX * this.panSpeed;
        this.camera.y += deltaY * this.panSpeed;
        this.updateCameraTransform();
    }

    private zoomCamera(zoomDelta: number, centerX?: number, centerY?: number): void {
        const oldZoom = this.camera.zoom;
        this.camera.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.camera.zoom + zoomDelta));

        if (centerX !== undefined && centerY !== undefined) {
            // Zoom towards a specific point
            const zoomFactor = this.camera.zoom / oldZoom;
            this.camera.x = centerX - (centerX - this.camera.x) * zoomFactor;
            this.camera.y = centerY - (centerY - this.camera.y) * zoomFactor;
        }

        this.updateCameraTransform();
    }

    private resetCamera(): void {
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.zoom = 1;
        this.updateCameraTransform();
    } public worldToScreen(worldPos: { x: number; y: number }): { x: number; y: number } {
        return {
            x: worldPos.x * this.camera.zoom + this.camera.x,
            y: worldPos.y * this.camera.zoom + this.camera.y
        };
    } public screenToWorld(screenPos: { x: number; y: number }): { x: number; y: number } {
        // screenPos is already relative to the centered container
        // We just need to account for camera transforms
        return {
            x: (screenPos.x - this.camera.x) / this.camera.zoom,
            y: (screenPos.y - this.camera.y) / this.camera.zoom
        };
    }

    private addPlacementAreaVisualization(): void {
        // Create a subtle visualization of the placement area boundaries
        // This helps users understand the limits without a visible grid
        const { gridSize, gridWidth, gridHeight } = this.options;
        const areaWidth = gridWidth * gridSize;
        const areaHeight = gridHeight * gridSize;
        const startX = -areaWidth / 2;
        const startY = -areaHeight / 2;

        // Create a new graphics object for the placement area
        const areaGraphics = new Graphics();

        // Draw a subtle dashed border
        areaGraphics.lineStyle(2, 0x3366CC, 0.4);

        // Draw dashed lines for the border
        const dashLength = 10;
        const gapLength = 5;
        let currentPos = 0;

        // Top edge
        while (currentPos < areaWidth) {
            if (currentPos % (dashLength + gapLength) < dashLength) {
                areaGraphics.moveTo(startX + currentPos, startY);
                areaGraphics.lineTo(startX + Math.min(currentPos + dashLength, areaWidth), startY);
            }
            currentPos += dashLength + gapLength;
        }

        // Right edge
        currentPos = 0;
        while (currentPos < areaHeight) {
            if (currentPos % (dashLength + gapLength) < dashLength) {
                areaGraphics.moveTo(startX + areaWidth, startY + currentPos);
                areaGraphics.lineTo(startX + areaWidth, startY + Math.min(currentPos + dashLength, areaHeight));
            }
            currentPos += dashLength + gapLength;
        }

        // Bottom edge
        currentPos = 0;
        while (currentPos < areaWidth) {
            if (currentPos % (dashLength + gapLength) < dashLength) {
                areaGraphics.moveTo(startX + areaWidth - currentPos, startY + areaHeight);
                areaGraphics.lineTo(startX + areaWidth - Math.min(currentPos + dashLength, areaWidth), startY + areaHeight);
            }
            currentPos += dashLength + gapLength;
        }

        // Left edge
        currentPos = 0;
        while (currentPos < areaHeight) {
            if (currentPos % (dashLength + gapLength) < dashLength) {
                areaGraphics.moveTo(startX, startY + areaHeight - currentPos);
                areaGraphics.lineTo(startX, startY + areaHeight - Math.min(currentPos + dashLength, areaHeight));
            }
            currentPos += dashLength + gapLength;
        }

        // Add corner indicators
        const cornerSize = 20;

        // Top-left corner
        areaGraphics.lineStyle(3, 0x3366CC, 0.6);
        areaGraphics.moveTo(startX, startY + cornerSize);
        areaGraphics.lineTo(startX, startY);
        areaGraphics.lineTo(startX + cornerSize, startY);

        // Top-right corner
        areaGraphics.moveTo(startX + areaWidth - cornerSize, startY);
        areaGraphics.lineTo(startX + areaWidth, startY);
        areaGraphics.lineTo(startX + areaWidth, startY + cornerSize);

        // Bottom-right corner
        areaGraphics.moveTo(startX + areaWidth, startY + areaHeight - cornerSize);
        areaGraphics.lineTo(startX + areaWidth, startY + areaHeight);
        areaGraphics.lineTo(startX + areaWidth - cornerSize, startY + areaHeight);

        // Bottom-left corner
        areaGraphics.moveTo(startX + cornerSize, startY + areaHeight);
        areaGraphics.lineTo(startX, startY + areaHeight);
        areaGraphics.lineTo(startX, startY + areaHeight - cornerSize);

        // Add a very subtle fill to help visualize the placement area
        areaGraphics.beginFill(0x3366CC, 0.03);
        areaGraphics.drawRect(startX, startY, areaWidth, areaHeight);
        areaGraphics.endFill();

        // Ensure the area graphics are not interactive
        areaGraphics.interactive = false;
        areaGraphics.interactiveChildren = false;

        // Add to world container
        this.worldContainer.addChild(areaGraphics);
    }
}
