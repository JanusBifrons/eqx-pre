import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';
import { Ship } from '@/entities/Ship';
import { Block } from '@/entities/Block';
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
    enableDebugVisualization?: boolean;
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
    private maxZoom: number = 3;    // UI elements - now handled by MUI components
    // Legacy UI elements removed - replaced by MUI components

    constructor(container: Container, options: Partial<BuilderOptions> = {}) {
        this.container = container;
        this.ship = new Ship(); this.options = {
            gridSize: 32,
            gridWidth: 40,
            gridHeight: 30,
            snapToGrid: true,
            showGrid: true,
            showConnectionPoints: true,
            enableDebugVisualization: false,
            ...options
        };// Initialize camera system
        this.worldContainer = new Container();
        this.container.addChild(this.worldContainer); this.gridGraphics = new Graphics();
        this.blockPalette = new Container();

        this.initialize();
    }

    private initialize(): void {
        // Add world objects to the world container (things that can be panned/zoomed)
        // Only add grid graphics if they should be shown
        if (this.options.showGrid) {
            this.worldContainer.addChild(this.gridGraphics);
        } else {
            // If grid is hidden, add placement area visualization instead
            this.addPlacementAreaVisualization();
        }

        this.worldContainer.addChild(this.ship.container);        // Add UI elements directly to main container (fixed position, no panning)
        // UI elements now handled by MUI components - old canvas UI removed
        this.blockPalette.zIndex = 100; // Highest z-index for palette

        this.container.addChild(this.blockPalette);

        // Enable z-index sorting on the main container
        this.container.sortableChildren = true; this.setupGrid();
        this.setupPalette();
        // UI setup now handled by MUI components - old canvas UI methods stubbed out
        this.setupInteraction();
        // Stats update now handled by MUI components

        // Add debug visualization if enabled
        if (this.options.enableDebugVisualization) {
            this.addDebugVisualization();
        }

        // Set initial camera position
        this.updateCameraTransform();

        // Initialize UI positioning based on screen size (assume 1600x1000 as default)
        this.resize(1600, 1000);
    } private setupGrid(): void {
        // Grid is no longer rendered, but we keep this method for consistency
        // and potential future grid re-enabling        // Create an empty graphics object without any rendering
        this.gridGraphics.clear();        // Log that we're using a gridless setup
        console.log("Using gridless design for better mouse tracking");
    }

    private setupPalette(): void {
        // Block palette now handled by MUI components - method stubbed out
        console.log("Canvas palette setup skipped - using MUI components");
    }

    private setupInteraction(): void {
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
        this.container.on('wheel', (event: any) => this.onWheel(event));        // Add keyboard controls
        this.setupKeyboardControls();
    }

    public selectBlockType(blockId: string, buttonContainer?: Container): void {
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
            bg.drawRect(0, 0, 180, 50); bg.endFill();
        }

        // Remove existing preview
        if (this.previewBlock) {
            this.previewBlock.destroy();
            this.previewBlock = null;
        }        // Create new preview block
        this.recreatePreviewBlock();

        console.log(`Selected block type: ${blockId}`);
    }

    public deselectBlockType(): void {
        // Clear the selected block type
        this.selectedBlockType = null;

        // Reset visual selection feedback
        if (this.selectedButton) {
            const bg = this.selectedButton.getChildAt(0) as Graphics;
            bg.clear();
            bg.beginFill(0x444444, 0.8);
            bg.lineStyle(2, 0x666666);
            bg.drawRect(0, 0, 180, 50);
            bg.endFill();
            this.selectedButton = null;
        }

        // Remove preview block
        if (this.previewBlock) {
            this.previewBlock.destroy();
            this.previewBlock = null;
        }

        console.log('Block type deselected');
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
        const worldPosition = { x: worldX, y: worldY };        // Optionally snap to grid if enabled
        const definition = this.selectedBlockType ? BlockDefinitions.get(this.selectedBlockType) : undefined;
        const finalPos = this.options.snapToGrid ? this.snapToGrid(worldPosition, definition) : worldPosition;

        if (this.previewBlock) {
            // Update the preview block's grid position and visual position
            this.previewBlock.setGridPosition(finalPos);
            this.previewBlock.container.x = finalPos.x;
            this.previewBlock.container.y = finalPos.y;            // Check if the position would be valid and update preview appearance
            const isValidPosition = this.isPositionValid(finalPos, definition);
            const isWithinBounds = this.isPositionWithinBounds(finalPos, definition);
            const isOccupied = this.isPositionOccupied(finalPos, definition);

            // Update preview block opacity and indicator color based on validity
            if (isValidPosition) {
                this.previewBlock.container.alpha = 0.5;
                // Update indicator color to green (valid)
                const indicator = this.previewBlock.container.getChildAt(1); // Indicator is the second child
                if (indicator instanceof Graphics) {
                    const graphics = indicator as Graphics;
                    graphics.clear();
                    graphics.lineStyle(2, 0x33FF33, 0.8); // Green for valid

                    if (definition?.shape === 'circle') {
                        const radius = definition.width / 2;
                        this.drawDashedCircle(graphics, 0, 0, radius + 2);
                    } else if (definition) {
                        const width = definition.width;
                        const height = definition.height;
                        this.drawDashedRect(graphics, -width / 2 - 2, -height / 2 - 2, width + 4, height + 4);
                    }
                }
            } else {
                this.previewBlock.container.alpha = 0.3;
                // Update indicator color based on the type of invalidity
                const indicator = this.previewBlock.container.getChildAt(1);
                if (indicator instanceof Graphics) {
                    const graphics = indicator as Graphics;
                    graphics.clear();

                    // Different colors for different types of invalid placement
                    let indicatorColor: number;
                    if (!isWithinBounds) {
                        indicatorColor = 0xFF6600; // Orange for out of bounds
                    } else if (isOccupied) {
                        indicatorColor = 0xFF3333; // Red for occupied
                    } else {
                        indicatorColor = 0xFF3333; // Default red for other issues
                    }

                    graphics.lineStyle(2, indicatorColor, 0.8);

                    if (definition?.shape === 'circle') {
                        const radius = definition.width / 2;
                        this.drawDashedCircle(graphics, 0, 0, radius + 2);
                    } else if (definition) {
                        const width = definition.width;
                        const height = definition.height;
                        this.drawDashedRect(graphics, -width / 2 - 2, -height / 2 - 2, width + 4, height + 4);
                    }
                }
            }

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

        // Right-click to deselect block type
        if (event.data.button === 2 && this.selectedBlockType) {
            this.deselectBlockType();
            return;
        }

        // Handle block placement
        if (!this.previewBlock || !this.isBuilding || !this.selectedBlockType) {
            // If no block selected, clicking anywhere (except UI) should deselect
            if (this.selectedBlockType && event.data.button === 0) {
                // Check if click is not on any UI element by checking world coordinates
                const worldX = (localPosition.x - this.camera.x) / this.camera.zoom;
                const worldY = (localPosition.y - this.camera.y) / this.camera.zoom;

                // If clicking in the building area (not on UI), deselect
                const buildAreaHalfWidth = (this.options.gridWidth * this.options.gridSize) / 2;
                const buildAreaHalfHeight = (this.options.gridHeight * this.options.gridSize) / 2;

                if (Math.abs(worldX) <= buildAreaHalfWidth && Math.abs(worldY) <= buildAreaHalfHeight) {
                    this.deselectBlockType();
                }
            }
            return;
        }

        // Convert container coordinates to world coordinates
        const worldX = (localPosition.x - this.camera.x) / this.camera.zoom;
        const worldY = (localPosition.y - this.camera.y) / this.camera.zoom; const worldPosition = { x: worldX, y: worldY };        // Apply grid snapping if enabled (even when grid is invisible)
        const blockDefinition = BlockDefinitions.get(this.selectedBlockType)!;
        const finalPos = this.options.snapToGrid ? this.snapToGrid(worldPosition, blockDefinition) : worldPosition;

        // Check if position is valid (within bounds and not occupied)
        if (!this.isPositionValid(finalPos, blockDefinition)) {
            // Check specifically what's wrong to provide better feedback
            const withinBounds = this.isPositionWithinBounds(finalPos, blockDefinition);
            const isOccupied = this.isPositionOccupied(finalPos, blockDefinition);

            if (!withinBounds) {
                console.log(`Cannot place block at (${finalPos.x}, ${finalPos.y}) - outside building area`);
            } else if (isOccupied) {
                console.log(`Cannot place block at (${finalPos.x}, ${finalPos.y}) - position occupied`);
            }
            // Visual feedback could be added here (red flash, etc.)
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

                // Start the preview block off-screen to avoid showing it at center
                // It will be positioned properly when the mouse moves
                this.previewBlock.container.x = -10000;
                this.previewBlock.container.y = -10000;

                this.worldContainer.addChild(this.previewBlock.container);
                console.log(`Preview block recreated for type: ${this.selectedBlockType} (positioned off-screen until mouse moves)`);
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
    } private setupKeyboardControls(): void {
        // Add keyboard event listeners for camera controls
        document.addEventListener('keydown', (event) => {
            if (event.target !== document.body) return; // Only when not typing in inputs

            const panDistance = 20 / this.camera.zoom;

            switch (event.code) {
                case 'Escape':
                    // Deselect current block type
                    this.deselectBlockType();
                    event.preventDefault();
                    break;
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
    }

    private snapToGrid(position: Vector, blockDefinition?: any): Vector {
        if (!this.options.snapToGrid) return position;

        const { gridSize } = this.options;

        // If we have a block definition, we can do smarter snapping
        if (blockDefinition) {
            // For blocks larger than the base grid size, ensure they align properly
            const blockWidth = blockDefinition.width || gridSize;
            const blockHeight = blockDefinition.height || gridSize;

            // Calculate how many grid units this block occupies
            const gridUnitsX = blockWidth / gridSize;
            const gridUnitsY = blockHeight / gridSize;

            // For blocks that span multiple grid units, adjust snapping
            // to ensure they align with the grid boundaries properly
            let snappedX = Math.round(position.x / gridSize) * gridSize;
            let snappedY = Math.round(position.y / gridSize) * gridSize;

            // For multi-unit blocks, ensure they snap to positions where
            // they will align with the grid properly
            if (gridUnitsX > 1) {
                // Ensure the block's center aligns with grid intersections
                const offsetX = ((gridUnitsX - 1) * gridSize) / 2;
                snappedX = Math.round((position.x - offsetX) / gridSize) * gridSize + offsetX;
            }

            if (gridUnitsY > 1) {
                // Ensure the block's center aligns with grid intersections
                const offsetY = ((gridUnitsY - 1) * gridSize) / 2;
                snappedY = Math.round((position.y - offsetY) / gridSize) * gridSize + offsetY;
            }

            return { x: snappedX, y: snappedY };
        }

        // Default snapping for blocks without definition
        return {
            x: Math.round(position.x / gridSize) * gridSize,
            y: Math.round(position.y / gridSize) * gridSize
        };
    } private isPositionWithinBounds(position: Vector, blockDefinition?: any): boolean {
        const testWidth = blockDefinition?.width || this.options.gridSize;
        const testHeight = blockDefinition?.height || this.options.gridSize;

        // Calculate the building area boundaries
        const buildAreaHalfWidth = (this.options.gridWidth * this.options.gridSize) / 2;
        const buildAreaHalfHeight = (this.options.gridHeight * this.options.gridSize) / 2;

        // Calculate the bounding box for the block being tested
        const testLeft = position.x - testWidth / 2;
        const testRight = position.x + testWidth / 2;
        const testTop = position.y - testHeight / 2;
        const testBottom = position.y + testHeight / 2;

        // Check if the entire block would fit within the building area
        const withinHorizontalBounds = testLeft >= -buildAreaHalfWidth && testRight <= buildAreaHalfWidth;
        const withinVerticalBounds = testTop >= -buildAreaHalfHeight && testBottom <= buildAreaHalfHeight;

        return withinHorizontalBounds && withinVerticalBounds;
    }

    private isPositionOccupied(position: Vector, blockDefinition?: any): boolean {
        const testWidth = blockDefinition?.width || this.options.gridSize;
        const testHeight = blockDefinition?.height || this.options.gridSize;

        for (const block of this.ship.blocks.values()) {
            const blockPos = block.gridPosition;
            const existingDef = block.definition;
            const existingWidth = existingDef.width;
            const existingHeight = existingDef.height;

            // Calculate the bounding boxes for both blocks
            const testLeft = position.x - testWidth / 2;
            const testRight = position.x + testWidth / 2;
            const testTop = position.y - testHeight / 2;
            const testBottom = position.y + testHeight / 2;

            const existingLeft = blockPos.x - existingWidth / 2;
            const existingRight = blockPos.x + existingWidth / 2;
            const existingTop = blockPos.y - existingHeight / 2;
            const existingBottom = blockPos.y + existingHeight / 2;

            // Check for overlap using AABB (Axis-Aligned Bounding Box) collision
            const overlapping = !(testRight <= existingLeft ||
                testLeft >= existingRight ||
                testBottom <= existingTop ||
                testTop >= existingBottom);

            if (overlapping) {
                return true;
            }
        }
        return false;
    }

    private isPositionValid(position: Vector, blockDefinition?: any): boolean {
        // A position is valid if it's both within bounds AND not occupied
        return this.isPositionWithinBounds(position, blockDefinition) &&
            !this.isPositionOccupied(position, blockDefinition);
    }

    private autoConnect(newBlock: Block): void {
        // Use a more precise connection range based on grid size and block sizes
        const gridSize = this.options.gridSize;
        console.log(`🔗 AUTO-CONNECT: Attempting to connect new block at (${newBlock.gridPosition.x}, ${newBlock.gridPosition.y})`);

        let connectionsAttempted = 0;
        let connectionsSuccessful = 0;

        for (const existingBlock of this.ship.blocks.values()) {
            if (existingBlock === newBlock) continue;

            const newBlockPos = newBlock.gridPosition;
            const existingBlockPos = existingBlock.gridPosition;

            // Calculate the edges of both blocks
            const newBlockDef = newBlock.definition;
            const existingBlockDef = existingBlock.definition;

            const newHalfWidth = newBlockDef.width / 2;
            const newHalfHeight = newBlockDef.height / 2;
            const existingHalfWidth = existingBlockDef.width / 2;
            const existingHalfHeight = existingBlockDef.height / 2;

            // Check if blocks are adjacent (touching edges)
            const deltaX = Math.abs(newBlockPos.x - existingBlockPos.x);
            const deltaY = Math.abs(newBlockPos.y - existingBlockPos.y);

            // More lenient adjacency check - blocks are adjacent if they're within reasonable range
            const expectedGapX = newHalfWidth + existingHalfWidth;
            const expectedGapY = newHalfHeight + existingHalfHeight;

            // Allow for small gaps/overlaps due to positioning precision
            const tolerance = 2; // pixels

            const touchingHorizontally = (
                Math.abs(deltaX - expectedGapX) <= tolerance &&
                deltaY <= Math.max(newHalfHeight, existingHalfHeight) + tolerance
            );

            const touchingVertically = (
                Math.abs(deltaY - expectedGapY) <= tolerance &&
                deltaX <= Math.max(newHalfWidth, existingHalfWidth) + tolerance
            );

            console.log(`  Checking vs block at (${existingBlockPos.x}, ${existingBlockPos.y}): deltaX=${deltaX.toFixed(1)}, deltaY=${deltaY.toFixed(1)}, H=${touchingHorizontally}, V=${touchingVertically}`);

            if (touchingHorizontally || touchingVertically) {
                connectionsAttempted++;

                // Find the best connection points on each block
                const newBlockPoints = newBlock.getAvailableConnectionPoints();
                const existingBlockPoints = existingBlock.getAvailableConnectionPoints();

                console.log(`    Adjacent! Available points: new=${newBlockPoints.length}, existing=${existingBlockPoints.length}`);

                if (newBlockPoints.length > 0 && existingBlockPoints.length > 0) {
                    // Find the closest connection points
                    let bestDistance = Infinity;
                    let bestNewPoint = 0;
                    let bestExistingPoint = 0;

                    for (let i = 0; i < newBlockPoints.length; i++) {
                        for (let j = 0; j < existingBlockPoints.length; j++) {
                            const newPoint = newBlockDef.connectionPoints[newBlockPoints[i]];
                            const existingPoint = existingBlockDef.connectionPoints[existingBlockPoints[j]];

                            // Calculate world positions of connection points
                            const newWorldPoint = {
                                x: newBlockPos.x + newPoint.x,
                                y: newBlockPos.y + newPoint.y
                            };
                            const existingWorldPoint = {
                                x: existingBlockPos.x + existingPoint.x,
                                y: existingBlockPos.y + existingPoint.y
                            };

                            const distance = Vector.magnitude(Vector.sub(newWorldPoint, existingWorldPoint));

                            if (distance < bestDistance) {
                                bestDistance = distance;
                                bestNewPoint = newBlockPoints[i];
                                bestExistingPoint = existingBlockPoints[j];
                            }
                        }
                    }

                    // More lenient connection distance - allow up to 1 grid unit
                    const connectionTolerance = gridSize;
                    if (bestDistance <= connectionTolerance) {
                        const connectionSuccess = this.ship.connectBlocks(
                            newBlock,
                            existingBlock,
                            bestNewPoint,
                            bestExistingPoint
                        );

                        if (connectionSuccess) {
                            connectionsSuccessful++;
                            console.log(`    ✅ Connected! Distance: ${bestDistance.toFixed(1)}px`);
                        } else {
                            console.log(`    ❌ Connection failed despite valid distance: ${bestDistance.toFixed(1)}px`);
                        }
                    } else {
                        console.log(`    ⚠️ Points too far: ${bestDistance.toFixed(1)}px > ${connectionTolerance}px`);
                    }
                } else {
                    console.log(`    ❌ No available connection points`);
                }
            }
        }

        console.log(`🔗 AUTO-CONNECT SUMMARY: ${connectionsSuccessful}/${connectionsAttempted} connections successful`);

        // If no connections were made, log a warning
        if (connectionsAttempted > 0 && connectionsSuccessful === 0) {
            console.warn('⚠️ Block placed adjacent to others but no connections established!');
        }
    }

    public repairConnections(): void {
        console.log('🔧 REPAIRING CONNECTIONS: Attempting to connect isolated blocks...');

        const validation = this.ship.validateStructuralIntegrity();
        if (validation.isValid) {
            console.log('✅ Ship structure is already valid - no repairs needed');
            return;
        }

        // Get the main connected structure
        const firstBlock = Array.from(this.ship.blocks.values())[0];
        const connectedBlocks = this.ship.getConnectedBlocks(firstBlock);
        const isolatedBlocks = Array.from(this.ship.blocks.values()).filter(block => !connectedBlocks.has(block));

        console.log(`Found ${isolatedBlocks.length} isolated blocks to reconnect`);

        let repairsAttempted = 0;
        let repairsSuccessful = 0;

        // Try to connect each isolated block to the main structure
        for (const isolatedBlock of isolatedBlocks) {
            let connected = false;

            // Try to connect to any block in the main structure
            for (const mainBlock of connectedBlocks) {
                if (connected) break;

                const isolatedPos = isolatedBlock.gridPosition;
                const mainPos = mainBlock.gridPosition;

                // Check if blocks are close enough to connect
                const distance = Vector.magnitude(Vector.sub(isolatedPos, mainPos));
                const maxConnectionDistance = this.options.gridSize * 2; // Allow up to 2 grid units

                if (distance <= maxConnectionDistance) {
                    repairsAttempted++;

                    // Find best connection points
                    const isolatedPoints = isolatedBlock.getAvailableConnectionPoints();
                    const mainPoints = mainBlock.getAvailableConnectionPoints();

                    if (isolatedPoints.length > 0 && mainPoints.length > 0) {
                        // Try first available connection points
                        const success = this.ship.connectBlocks(
                            isolatedBlock,
                            mainBlock,
                            isolatedPoints[0],
                            mainPoints[0]
                        );

                        if (success) {
                            connected = true;
                            repairsSuccessful++;
                            console.log(`  ✅ Connected isolated block to main structure`);
                        }
                    }
                }
            }

            if (!connected) {
                console.log(`  ❌ Could not connect isolated block at (${isolatedBlock.gridPosition.x}, ${isolatedBlock.gridPosition.y})`);
            }
        }

        console.log(`🔧 REPAIR SUMMARY: ${repairsSuccessful}/${repairsAttempted} repairs successful`);
        this.updateStats();
    } private updateStats(): void {
        // Stats update now handled by MUI components - method stubbed out
        console.log("Canvas stats update skipped - using MUI components");
    }

    /**
     * Test method to verify the enhanced connection system is working
     */
    public testConnectionSystem(): void {
        console.log('🧪 TESTING CONNECTION SYSTEM:');

        // Clear existing ship
        this.clearShip();

        // Create test blocks in a simple pattern
        console.log('  Creating test blocks...');

        // Helper function to place a block programmatically
        const placeTestBlock = (x: number, y: number, blockType: string) => {
            const definition = BlockDefinitions.get(blockType)!;
            const properties = BlockDefinitions.getDefaultProperties(blockType);
            const newBlock = new Block(definition, properties, { x, y });

            this.ship.addBlock(newBlock, { x, y });
            newBlock.container.x = x;
            newBlock.container.y = y;
            this.ship.container.addChild(newBlock.container);

            // Try to auto-connect to nearby blocks
            this.autoConnect(newBlock);
        };

        // Place center block
        placeTestBlock(0, 0, 'hull_basic');
        console.log('  Placed center block');

        // Place adjacent blocks that should auto-connect
        placeTestBlock(32, 0, 'hull_basic');  // Right
        console.log('  Placed right block');

        placeTestBlock(-32, 0, 'hull_basic'); // Left
        console.log('  Placed left block');

        placeTestBlock(0, -32, 'weapon_laser'); // Top
        console.log('  Placed top weapon');

        placeTestBlock(0, 32, 'engine_basic'); // Bottom
        console.log('  Placed bottom engine');

        // Check final structural integrity
        const validation = this.ship.validateStructuralIntegrity();
        console.log('🧪 TEST RESULTS:');
        console.log(`  Ship is valid: ${validation.isValid}`);
        console.log(`  Total blocks: ${this.ship.blocks.size}`);

        if (!validation.isValid) {
            console.log('  Issues found:', validation.issues);
            console.log('  Attempting auto-repair...');
            this.repairConnections();
        } else {
            console.log('  ✅ All blocks properly connected!');
        }
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
        } this.container.destroy({ children: true });
    }

    public resize(screenWidth: number, screenHeight: number): void {
        // Update container size
        this.container.width = screenWidth;
        this.container.height = screenHeight;

        // UI layout now handled by MUI components
        console.log(`Canvas resized to: ${screenWidth}x${screenHeight}`);
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
    } private resetCamera(): void {
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.zoom = 1;
        this.updateCameraTransform();
    }

    public worldToScreen(worldPos: { x: number; y: number }): { x: number; y: number } {
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
        areaGraphics.drawRect(startX, startY, areaWidth, areaHeight); areaGraphics.endFill();

        // Add to world container
        this.worldContainer.addChild(areaGraphics);
    }    /**
     * Debug method to visualize UI bounds and help with positioning
     * @note Called conditionally when enableDebugVisualization option is true
     */
    private addDebugVisualization(): void {
        // Create debug graphics to show screen bounds
        const debugGraphics = new Graphics();
        debugGraphics.lineStyle(2, 0xFF0000, 0.5);

        // Draw screen boundaries (for 1600x1000 centered at origin)
        debugGraphics.drawRect(-800, -500, 1600, 1000);

        // Draw center crosshairs
        debugGraphics.moveTo(-50, 0);
        debugGraphics.lineTo(50, 0);
        debugGraphics.moveTo(0, -50);
        debugGraphics.lineTo(0, 50);

        this.container.addChild(debugGraphics);

        console.log('🔍 Debug visualization added - red border shows screen bounds');
    }
}
