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
    private camera: CameraState;
    private debugOptions: DebugOptions;
    private resizeObserver?: ResizeObserver;
    private resizeCallbacks: Array<(width: number, height: number) => void> = [];

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
    }

    async initialize(): Promise<void> {
        try {
            await this.createPixiApplication();
            this.setupContainers();
            this.setupCameraControls();
            this.setupResizeHandling();
            this.createDebugUI();

            console.log('✅ Unified Rendering Engine initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Rendering Engine:', error);
            throw error;
        }
    } private async createPixiApplication(): Promise<void> {
        // Calculate container size
        const containerRect = this.domContainer.getBoundingClientRect();
        const width = Math.max(containerRect.width || window.innerWidth, 1);
        const height = Math.max(containerRect.height || window.innerHeight, 1);

        this.pixiApp = new PixiApplication({
            width,
            height,
            backgroundColor: this.config.backgroundColor,
            antialias: this.config.antialias,
            resolution: this.config.resolution,
            autoDensity: true,
        });

        // Clear container and add canvas
        this.domContainer.innerHTML = '';
        this.domContainer.appendChild(this.pixiApp.view as HTMLCanvasElement);

        // Set canvas to proper display without scaling
        const canvas = this.pixiApp.view as HTMLCanvasElement;
        canvas.style.display = 'block';
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '100%';

        // Prevent scrolling and ensure proper positioning
        this.domContainer.style.overflow = 'hidden';
        this.domContainer.style.position = 'relative';

        console.log(`🎨 Canvas initialized: ${width}x${height} (resolution: ${this.config.resolution})`);
    }

    private setupContainers(): void {
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
    }

    private setupCameraControls(): void {
        if (!this.config.enableCamera || !this.pixiApp) return;

        const stage = this.pixiApp.stage;
        stage.interactive = true;
        stage.eventMode = 'static';

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
    }

    private setupResizeHandling(): void {
        if (!this.pixiApp) return;

        // Use ResizeObserver for better performance
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                this.resize(width, height);
            }
        });

        this.resizeObserver.observe(this.domContainer);
    }

    private createDebugUI(): void {
        if (!this.config.enableDebug) return;

        // Create debug controls UI (outside canvas, in DOM)
        const debugPanel = document.createElement('div');
        debugPanel.style.position = 'absolute';
        debugPanel.style.top = '10px';
        debugPanel.style.right = '10px';
        debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        debugPanel.style.color = 'white';
        debugPanel.style.padding = '10px';
        debugPanel.style.borderRadius = '5px';
        debugPanel.style.fontFamily = 'monospace';
        debugPanel.style.fontSize = '12px';
        debugPanel.style.zIndex = '10000';
        debugPanel.style.minWidth = '200px';

        debugPanel.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 10px;">Debug Controls</div>
            <label style="display: block; margin-bottom: 5px;">
                <input type="checkbox" id="debug-border" style="margin-right: 5px;">
                Show Border
            </label>
            <label style="display: block; margin-bottom: 5px;">
                <input type="checkbox" id="debug-center" style="margin-right: 5px;">
                Show Center
            </label>
            <label style="display: block; margin-bottom: 10px;">
                <input type="checkbox" id="debug-stats" style="margin-right: 5px;">
                Show Stats
            </label>
            <button id="debug-reset-camera" style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #666; border-radius: 3px; cursor: pointer;">
                Reset Camera
            </button>
            <div id="debug-info" style="margin-top: 10px; font-size: 10px; opacity: 0.8;"></div>
        `;

        this.domContainer.appendChild(debugPanel);

        // Setup debug event listeners
        const borderCheckbox = debugPanel.querySelector('#debug-border') as HTMLInputElement;
        const centerCheckbox = debugPanel.querySelector('#debug-center') as HTMLInputElement;
        const statsCheckbox = debugPanel.querySelector('#debug-stats') as HTMLInputElement;
        const resetButton = debugPanel.querySelector('#debug-reset-camera') as HTMLButtonElement;

        borderCheckbox?.addEventListener('change', (e) => {
            this.debugOptions.showBorder = (e.target as HTMLInputElement).checked;
            this.updateDebugVisuals();
        });

        centerCheckbox?.addEventListener('change', (e) => {
            this.debugOptions.showCenter = (e.target as HTMLInputElement).checked;
            this.updateDebugVisuals();
        });

        statsCheckbox?.addEventListener('change', (e) => {
            this.debugOptions.showStats = (e.target as HTMLInputElement).checked;
            this.updateDebugVisuals();
        });

        resetButton?.addEventListener('click', () => {
            this.resetCamera();
        });

        // Update debug info periodically
        if (this.pixiApp) {
            this.pixiApp.ticker.add(() => {
                this.updateDebugInfo();
            });
        }
    }

    private updateDebugVisuals(): void {
        this.debugContainer.removeChildren();

        if (this.debugOptions.showBorder) {
            this.drawDebugBorder();
        }

        if (this.debugOptions.showCenter) {
            this.drawDebugCenter();
        }
    }

    private drawDebugBorder(): void {
        if (!this.pixiApp) return;

        const border = new Graphics();
        border.lineStyle(2, 0xff0000, 0.8);
        border.drawRect(0, 0, this.pixiApp.screen.width, this.pixiApp.screen.height);

        // Add corner markers
        const cornerSize = 20;
        border.lineStyle(3, 0xff0000, 1);

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

        this.debugContainer.addChild(border);
    }

    private drawDebugCenter(): void {
        if (!this.pixiApp) return;

        const centerX = this.pixiApp.screen.width / 2;
        const centerY = this.pixiApp.screen.height / 2;

        const center = new Graphics();
        center.lineStyle(2, 0x00ff00, 0.8);

        // Crosshair
        center.moveTo(centerX - 50, centerY);
        center.lineTo(centerX + 50, centerY);
        center.moveTo(centerX, centerY - 50);
        center.lineTo(centerX, centerY + 50);

        // Center circle
        center.drawCircle(centerX, centerY, 5);

        this.debugContainer.addChild(center);
    } private updateDebugInfo(): void {
        if (!this.config.enableDebug || !this.pixiApp) return;

        const debugInfo = this.domContainer.querySelector('#debug-info');
        if (debugInfo) {
            const canvas = this.pixiApp.view as HTMLCanvasElement;
            const containerRect = this.domContainer.getBoundingClientRect();

            debugInfo.innerHTML = `
                Camera: (${this.camera.x.toFixed(1)}, ${this.camera.y.toFixed(1)})<br>
                Zoom: ${this.camera.zoom.toFixed(2)}x<br>
                Screen: ${this.pixiApp.screen.width}x${this.pixiApp.screen.height}<br>
                Canvas: ${canvas.width}x${canvas.height}<br>
                Container: ${containerRect.width.toFixed(0)}x${containerRect.height.toFixed(0)}<br>
                Resolution: ${this.config.resolution.toFixed(1)}x<br>
                FPS: ${Math.round(this.pixiApp.ticker.FPS)}
            `;
        }
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
    }

    private updateCameraTransform(): void {
        if (!this.pixiApp) return;

        this.worldContainer.x = this.camera.x * this.camera.zoom + this.pixiApp.screen.width / 2;
        this.worldContainer.y = this.camera.y * this.camera.zoom + this.pixiApp.screen.height / 2;
        this.worldContainer.scale.set(this.camera.zoom);
        this.worldContainer.rotation = this.camera.rotation;
    } private resize(width: number, height: number): void {
        if (!this.pixiApp || width <= 0 || height <= 0) return;

        // Resize the renderer to match container dimensions
        this.pixiApp.renderer.resize(width, height);

        // Update camera transform to maintain proper positioning
        this.updateCameraTransform();

        // Update debug visuals to match new size
        this.updateDebugVisuals();

        // Notify all registered resize callbacks
        this.resizeCallbacks.forEach(callback => {
            try {
                callback(width, height);
            } catch (error) {
                console.error('Error in resize callback:', error);
            }
        });

        console.log(`📐 Canvas resized to: ${width}x${height}`);
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
    }

    public destroy(): void {
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
