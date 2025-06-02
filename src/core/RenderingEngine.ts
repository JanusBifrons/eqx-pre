import { Application as PixiApplication, Container, Graphics, FederatedPointerEvent } from 'pixi.js';

export interface CameraState {
    x: number;
    y: number;
    zoom: number;
    rotation: number;
}

export interface RenderingEngineConfig {
    backgroundColor?: number;
    antialias?: boolean;
    resolution?: number;
    enableDebug?: boolean;
    enableCamera?: boolean;
    minZoom?: number;
    maxZoom?: number;
    panSpeed?: number;
    zoomSpeed?: number;
}

export interface DebugOptions {
    showBorder: boolean;
    showCenter: boolean;
    showStats: boolean;
}

export class RenderingEngine {
    private pixiApp?: PixiApplication;
    private domContainer: HTMLElement;
    private worldContainer: Container;
    private uiContainer: Container;
    private debugContainer: Container;
    private config: Required<RenderingEngineConfig>;
    private camera: CameraState; private debugOptions: DebugOptions;
    private resizeObserver?: ResizeObserver;
    private resizeCallbacks: Array<(width: number, height: number) => void> = [];
    private resizeTimeout?: NodeJS.Timeout;

    // Camera control state
    private isDragging = false;
    private lastPointerPosition: { x: number; y: number } | null = null;

    constructor(container: HTMLElement, config: RenderingEngineConfig = {}) {
        this.domContainer = container; this.config = {
            backgroundColor: 0x1a1a2e,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            enableDebug: false,  // Disable debug by default
            enableCamera: true,
            minZoom: 0.1,
            maxZoom: 5.0,
            panSpeed: 1.0,
            zoomSpeed: 0.1,
            ...config
        };

        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            rotation: 0
        };

        this.debugOptions = {
            showBorder: false,
            showCenter: false,
            showStats: false
        };

        this.worldContainer = new Container();
        this.uiContainer = new Container();
        this.debugContainer = new Container();
    } async initialize(): Promise<void> {
        try {
            await this.createPixiApplication();
            this.setupContainers();
            this.setupCameraControls();
            this.setupResizeHandling();
            this.createDebugUI();

            // Initialize debug visuals
            this.updateDebugVisuals();

            console.log('✅ Unified Rendering Engine initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Rendering Engine:', error);
            throw error;
        }
    } private async createPixiApplication(): Promise<void> {
        // Ensure container has layout before measuring - wait multiple frames
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Calculate container size with fallbacks
        const containerRect = this.domContainer.getBoundingClientRect();
        let width = containerRect.width;
        let height = containerRect.height;

        console.log(`🔍 DEBUG: Container rect - width: ${width}, height: ${height}`);
        console.log(`🔍 DEBUG: Container clientWidth/Height: ${this.domContainer.clientWidth}x${this.domContainer.clientHeight}`);
        console.log(`🔍 DEBUG: Container offsetWidth/Height: ${this.domContainer.offsetWidth}x${this.domContainer.offsetHeight}`);

        // More robust size detection
        if (width === 0 || height === 0) {
            // Try client dimensions first
            width = this.domContainer.clientWidth || this.domContainer.offsetWidth;
            height = this.domContainer.clientHeight || this.domContainer.offsetHeight;

            console.log(`🔍 DEBUG: Using client/offset dimensions - width: ${width}, height: ${height}`);

            // If still zero, use parent container or window
            if (width === 0 || height === 0) {
                const parent = this.domContainer.parentElement;
                if (parent) {
                    const parentRect = parent.getBoundingClientRect();
                    width = parentRect.width || window.innerWidth;
                    height = parentRect.height || window.innerHeight;
                    console.log(`🔍 DEBUG: Using parent dimensions - width: ${width}, height: ${height}`);
                } else {
                    width = window.innerWidth;
                    height = window.innerHeight;
                    console.log(`🔍 DEBUG: Using window dimensions - width: ${width}, height: ${height}`);
                }
            }
        }        // Ensure minimum size but allow flexible dimensions
        width = Math.max(width, 320); // Minimum width for mobile compatibility
        height = Math.max(height, 240); // Minimum height for mobile compatibility

        console.log(`🎨 Creating responsive canvas with dimensions: ${width}x${height}`);

        try {
            this.pixiApp = new PixiApplication({
                width,
                height,
                backgroundColor: this.config.backgroundColor,
                antialias: this.config.antialias,
                resolution: this.config.resolution,
                autoDensity: true,
                resizeTo: this.domContainer, // Let PIXI handle responsive resizing
            });

            console.log(`✅ PIXI Application created successfully with resizeTo option`);

            // Clear container and add canvas
            this.domContainer.innerHTML = '';
            this.domContainer.appendChild(this.pixiApp.view as HTMLCanvasElement);            // Set canvas to fill container exactly without any scaling or distortion
            const canvas = this.pixiApp.view as HTMLCanvasElement;
            canvas.style.display = 'block';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.margin = '0';
            canvas.style.padding = '0';
            canvas.style.outline = 'none';
            canvas.style.boxSizing = 'border-box';

            console.log(`✅ Canvas appended to container with responsive styling`);
            console.log(`🔍 Canvas actual dimensions: ${canvas.width}x${canvas.height}`);

            // Ensure container is properly configured for responsive layout
            this.domContainer.style.overflow = 'hidden';
            this.domContainer.style.position = 'relative';
            this.domContainer.style.width = '100%';
            this.domContainer.style.height = '100%';
            this.domContainer.style.boxSizing = 'border-box';

            console.log(`🎨 Canvas initialized: ${width}x${height} (resolution: ${this.config.resolution})`);

            // Force a render to ensure canvas is visible
            this.pixiApp.renderer.render(this.pixiApp.stage);
            console.log(`✅ Initial render forced`);

            // Add a timeout to check canvas visibility
            setTimeout(() => {
                console.log(`🔍 Post-init canvas check:`);
                console.log(`  - Canvas in DOM:`, document.contains(canvas));
                console.log(`  - Canvas visible:`, canvas.offsetWidth > 0 && canvas.offsetHeight > 0);
                console.log(`  - Canvas computed style:`, window.getComputedStyle(canvas));
            }, 100);

        } catch (error) {
            console.error(`❌ Error creating PIXI Application:`, error);
            throw error;
        }
    } private setupContainers(): void {
        if (!this.pixiApp) return;

        // World container - affected by camera
        this.worldContainer.sortableChildren = true;
        this.pixiApp.stage.addChild(this.worldContainer);

        // UI container - fixed position, not affected by camera
        this.uiContainer.sortableChildren = true;
        this.uiContainer.zIndex = 1000;
        this.pixiApp.stage.addChild(this.uiContainer);

        // Debug container - highest priority
        this.debugContainer.sortableChildren = true;
        this.debugContainer.zIndex = 2000;
        this.pixiApp.stage.addChild(this.debugContainer);

        this.pixiApp.stage.sortableChildren = true;

        console.log(`🔧 Containers setup - Stage children: ${this.pixiApp.stage.children.length}`);
        console.log(`🔧 Debug container zIndex: ${this.debugContainer.zIndex}`);
    }

    private setupCameraControls(): void {
        if (!this.config.enableCamera || !this.pixiApp) return;

        const stage = this.pixiApp.stage;
        stage.eventMode = 'static'; // Use static event mode for better performance

        // Pan controls
        stage.on('pointerdown', this.onPointerDown.bind(this));
        stage.on('pointermove', this.onPointerMove.bind(this));
        stage.on('pointerup', this.onPointerUp.bind(this));
        stage.on('pointerupoutside', this.onPointerUp.bind(this));

        // Zoom controls
        stage.on('wheel', this.onWheel.bind(this));

        // Center camera initially
        this.centerCamera();
    }

    private onPointerDown(event: FederatedPointerEvent): void {
        // Only pan with middle mouse button or right mouse button
        if (event.button === 1 || event.button === 2) {
            this.isDragging = true;
            this.lastPointerPosition = { x: event.globalX, y: event.globalY };
        }
    }

    private onPointerMove(event: FederatedPointerEvent): void {
        if (this.isDragging && this.lastPointerPosition) {
            const deltaX = event.globalX - this.lastPointerPosition.x;
            const deltaY = event.globalY - this.lastPointerPosition.y;

            this.panCamera(deltaX * this.config.panSpeed, deltaY * this.config.panSpeed);

            this.lastPointerPosition = { x: event.globalX, y: event.globalY };
        }
    }

    private onPointerUp(): void {
        this.isDragging = false;
        this.lastPointerPosition = null;
    }

    private onWheel(event: any): void {
        event.preventDefault();

        const zoomDelta = -event.deltaY * this.config.zoomSpeed * 0.01;
        const mouseX = event.offsetX || event.layerX;
        const mouseY = event.offsetY || event.layerY;

        this.zoomCamera(zoomDelta, mouseX, mouseY);
    } private setupResizeHandling(): void {
        if (!this.pixiApp) return;

        // Use ResizeObserver for better performance and more accurate resize detection
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Use content box size for more accurate dimensions
                let width: number, height: number;

                if (entry.contentBoxSize && entry.contentBoxSize.length > 0) {
                    // Modern browsers with contentBoxSize support
                    width = entry.contentBoxSize[0].inlineSize;
                    height = entry.contentBoxSize[0].blockSize;
                } else {
                    // Fallback for older browsers
                    width = entry.contentRect.width;
                    height = entry.contentRect.height;
                }

                // Debounce resize calls to avoid excessive updates
                if (this.resizeTimeout) {
                    clearTimeout(this.resizeTimeout);
                }

                this.resizeTimeout = setTimeout(() => {
                    this.resize(width, height);
                }, 16); // ~60fps
            }
        });

        this.resizeObserver.observe(this.domContainer);
    } private createDebugUI(): void {
        // Debug UI is now handled by MUI components
        // No need for DOM-based debug controls
        console.log('🎨 Debug UI - using MUI overlay system');
    } private updateDebugVisuals(): void {
        this.debugContainer.removeChildren();

        if (this.debugOptions.showBorder) {
            console.log('🎨 Drawing debug border');
            this.drawDebugBorder();
        }

        if (this.debugOptions.showCenter) {
            console.log('🎨 Drawing debug center');
            this.drawDebugCenter();
        }
    } private drawDebugBorder(): void {
        if (!this.pixiApp) return;

        console.log(`🎨 Drawing border - screen: ${this.pixiApp.screen.width}x${this.pixiApp.screen.height}`);

        const border = new Graphics();
        border.lineStyle(4, 0xff0000, 1.0); // Make it thicker and fully opaque
        border.drawRect(0, 0, this.pixiApp.screen.width, this.pixiApp.screen.height);

        // Add corner markers
        const cornerSize = 30; // Make corners bigger
        border.lineStyle(6, 0xff0000, 1);

        // Top-left
        border.moveTo(0, cornerSize);
        border.lineTo(0, 0);
        border.lineTo(cornerSize, 0);

        // Top-right
        border.moveTo(this.pixiApp.screen.width - cornerSize, 0);
        border.lineTo(this.pixiApp.screen.width, 0);
        border.lineTo(this.pixiApp.screen.width, cornerSize);

        // Bottom-right
        border.moveTo(this.pixiApp.screen.width, this.pixiApp.screen.height - cornerSize);
        border.lineTo(this.pixiApp.screen.width, this.pixiApp.screen.height);
        border.lineTo(this.pixiApp.screen.width - cornerSize, this.pixiApp.screen.height);

        // Bottom-left
        border.moveTo(cornerSize, this.pixiApp.screen.height);
        border.lineTo(0, this.pixiApp.screen.height);
        border.lineTo(0, this.pixiApp.screen.height - cornerSize);

        // Add a test rectangle in the center to make sure graphics are visible
        border.lineStyle(2, 0xff0000, 1.0);
        border.drawRect(this.pixiApp.screen.width / 2 - 50, this.pixiApp.screen.height / 2 - 50, 100, 100);

        this.debugContainer.addChild(border);
        console.log(`✅ Debug border added to container, children count: ${this.debugContainer.children.length}`);
    } private drawDebugCenter(): void {
        if (!this.pixiApp) return;

        const centerX = this.pixiApp.screen.width / 2;
        const centerY = this.pixiApp.screen.height / 2;

        console.log(`🎨 Drawing center crosshair at: ${centerX}, ${centerY}`);

        const center = new Graphics();
        center.lineStyle(4, 0x00ff00, 1.0); // Make it thicker and fully opaque

        // Larger crosshair
        center.moveTo(centerX - 100, centerY);
        center.lineTo(centerX + 100, centerY);
        center.moveTo(centerX, centerY - 100);
        center.lineTo(centerX, centerY + 100);

        // Center circle - filled for better visibility
        center.beginFill(0x00ff00, 1.0);
        center.drawCircle(centerX, centerY, 10);
        center.endFill(); this.debugContainer.addChild(center);
        console.log(`✅ Debug center added to container, children count: ${this.debugContainer.children.length}`);
    }

    // Public camera methods
    public panCamera(deltaX: number, deltaY: number): void {
        this.camera.x += deltaX / this.camera.zoom;
        this.camera.y += deltaY / this.camera.zoom;
        this.updateCameraTransform();
    }

    public zoomCamera(zoomDelta: number, centerX?: number, centerY?: number): void {
        const oldZoom = this.camera.zoom;
        const newZoom = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, oldZoom * (1 + zoomDelta)));

        if (newZoom !== oldZoom && this.pixiApp) {
            // Zoom towards mouse position if provided
            if (centerX !== undefined && centerY !== undefined) {
                const worldX = (centerX - this.pixiApp.screen.width / 2) / oldZoom - this.camera.x;
                const worldY = (centerY - this.pixiApp.screen.height / 2) / oldZoom - this.camera.y;

                this.camera.x += worldX * (oldZoom - newZoom) / newZoom;
                this.camera.y += worldY * (oldZoom - newZoom) / newZoom;
            }

            this.camera.zoom = newZoom;
            this.updateCameraTransform();
        }
    }

    public centerCamera(): void {
        if (!this.pixiApp) return;

        this.camera.x = -this.pixiApp.screen.width / 2;
        this.camera.y = -this.pixiApp.screen.height / 2;
        this.camera.zoom = 1;
        this.updateCameraTransform();
    }

    public resetCamera(): void {
        this.camera.x = 0;
        this.camera.y = 0;
        this.camera.zoom = 1;
        this.camera.rotation = 0;
        this.updateCameraTransform();
    }

    public setCamera(camera: Partial<CameraState>): void {
        Object.assign(this.camera, camera);
        this.updateCameraTransform();
    }

    public getCamera(): CameraState {
        return { ...this.camera };
    }

    public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
        if (!this.pixiApp) return { x: worldX, y: worldY };

        return {
            x: (worldX + this.camera.x) * this.camera.zoom + this.pixiApp.screen.width / 2,
            y: (worldY + this.camera.y) * this.camera.zoom + this.pixiApp.screen.height / 2
        };
    }

    public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        if (!this.pixiApp) return { x: screenX, y: screenY };

        return {
            x: (screenX - this.pixiApp.screen.width / 2) / this.camera.zoom - this.camera.x,
            y: (screenY - this.pixiApp.screen.height / 2) / this.camera.zoom - this.camera.y
        };
    } private updateCameraTransform(): void {
        if (!this.pixiApp) return;

        this.worldContainer.x = this.camera.x * this.camera.zoom + this.pixiApp.screen.width / 2;
        this.worldContainer.y = this.camera.y * this.camera.zoom + this.pixiApp.screen.height / 2;
        this.worldContainer.scale.set(this.camera.zoom);
        this.worldContainer.rotation = this.camera.rotation;

        // Update debug visuals when camera changes
        this.updateDebugVisuals();
    } private resize(width: number, height: number): void {
        if (!this.pixiApp || width <= 0 || height <= 0) return;

        // Round dimensions to avoid sub-pixel issues
        const roundedWidth = Math.round(width);
        const roundedHeight = Math.round(height);

        // Only resize if dimensions actually changed
        if (this.pixiApp.screen.width === roundedWidth && this.pixiApp.screen.height === roundedHeight) {
            return;
        }

        // Resize the renderer to match container dimensions
        this.pixiApp.renderer.resize(roundedWidth, roundedHeight);

        // Ensure canvas maintains proper styling after resize
        const canvas = this.pixiApp.view as HTMLCanvasElement;
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        // Update camera transform to maintain proper positioning
        this.updateCameraTransform();

        // Update debug visuals to match new size
        this.updateDebugVisuals();

        // Notify all registered resize callbacks
        this.resizeCallbacks.forEach(callback => {
            try {
                callback(roundedWidth, roundedHeight);
            } catch (error) {
                console.error('Error in resize callback:', error);
            }
        });

        console.log(`📐 Canvas resized to: ${roundedWidth}x${roundedHeight}`);
    }

    // Resize callback management
    public addResizeCallback(callback: (width: number, height: number) => void): void {
        this.resizeCallbacks.push(callback);
    }

    public removeResizeCallback(callback: (width: number, height: number) => void): void {
        const index = this.resizeCallbacks.indexOf(callback);
        if (index > -1) {
            this.resizeCallbacks.splice(index, 1);
        }
    }

    // Public accessors
    public getPixiApp(): PixiApplication {
        if (!this.pixiApp) {
            throw new Error('PixiJS application not initialized');
        }
        return this.pixiApp;
    }

    public getWorldContainer(): Container {
        return this.worldContainer;
    }

    public getUIContainer(): Container {
        return this.uiContainer;
    }

    public getDebugContainer(): Container {
        return this.debugContainer;
    }

    // Enable/disable debug mode at runtime
    public setDebugMode(enabled: boolean): void {
        this.config.enableDebug = enabled;

        if (enabled) {
            this.createDebugUI();
        } else {
            // Remove debug UI
            const debugPanel = this.domContainer.querySelector('div:last-child');
            if (debugPanel && debugPanel.innerHTML.includes('Debug Controls')) {
                debugPanel.remove();
            }
            this.debugContainer.removeChildren();
        }
    }    // Debug visualization control methods for MUI integration
    public setShowDebugBorder(show: boolean): void {
        console.log(`🔧 Debug border ${show ? 'enabled' : 'disabled'}`);
        this.debugOptions.showBorder = show;
        this.updateDebugVisuals();
    }

    public getShowDebugBorder(): boolean {
        return this.debugOptions.showBorder;
    } public setShowDebugCenter(show: boolean): void {
        console.log(`🔧 Debug center ${show ? 'enabled' : 'disabled'}`);
        this.debugOptions.showCenter = show;
        this.updateDebugVisuals();
    }

    public getShowDebugCenter(): boolean {
        return this.debugOptions.showCenter;
    }

    public setShowDebugStats(show: boolean): void {
        this.debugOptions.showStats = show;
        this.updateDebugVisuals();
    }

    public getShowDebugStats(): boolean {
        return this.debugOptions.showStats;
    }

    public getDebugInfo(): any {
        if (!this.pixiApp) return null;

        const canvas = this.pixiApp.view as HTMLCanvasElement;
        const containerRect = this.domContainer.getBoundingClientRect();

        return {
            camera: {
                x: this.camera.x,
                y: this.camera.y,
                zoom: this.camera.zoom,
                rotation: this.camera.rotation
            },
            screenSize: {
                width: this.pixiApp.screen.width,
                height: this.pixiApp.screen.height
            },
            canvasSize: {
                width: canvas.width,
                height: canvas.height
            },
            containerSize: {
                width: containerRect.width,
                height: containerRect.height
            },
            resolution: this.config.resolution,
            fps: Math.round(this.pixiApp.ticker.FPS)
        };
    } public destroy(): void {
        // Clean up resize timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = undefined;
        }

        this.resizeObserver?.disconnect();

        if (this.pixiApp) {
            this.pixiApp.destroy(true);
            this.pixiApp = undefined;
        }

        // Clean up DOM
        this.domContainer.innerHTML = '';

        console.log('✅ Rendering Engine destroyed');
    }
}
