import { ICamera } from '../interfaces/IUIComponent';
import { Container } from 'pixi.js';

export class CameraController implements ICamera {
    public x: number = 0;
    public y: number = 0;
    public zoom: number = 1.0; // Fixed at 1.0 zoom for simplicity

    private worldContainer: Container;
    private panSpeed: number = 1;

    // Screen dimensions for proper coordinate transformation
    private screenWidth: number = 0;
    private screenHeight: number = 0;

    // Callback for when camera transform changes
    private onTransformChange: (() => void) | null = null;

    constructor(worldContainer: Container) {
        this.worldContainer = worldContainer;
        // Don't apply transform immediately - wait for proper initialization
    }

    // Initialize camera position to center the buildable area (world origin) in the middle of the screen
    initializePosition(screenWidth: number, screenHeight: number): void {
        // Store screen dimensions for coordinate transformations
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;

        // For the buildable area to be centered, we need world origin (0,0) at screen center
        // Since transform: worldContainer.x = this.x and worldContainer.y = this.y
        // We set camera position to screen center so world (0,0) appears at screen center
        this.x = screenWidth / 2;
        this.y = screenHeight / 2;
        this.updateTransform();
        console.log(`🎯 Camera initialized to center buildable area: camera (${this.x}, ${this.y}) with zoom: ${this.zoom}`);
    }

    // Update screen dimensions when canvas resizes
    updateScreenDimensions(screenWidth: number, screenHeight: number): void {
        const oldCenterX = this.screenWidth / 2;
        const oldCenterY = this.screenHeight / 2;

        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;

        // Maintain relative camera position from screen center
        if (oldCenterX > 0 && oldCenterY > 0) {
            const offsetX = this.x - oldCenterX;
            const offsetY = this.y - oldCenterY;

            this.x = (screenWidth / 2) + offsetX;
            this.y = (screenHeight / 2) + offsetY;

            this.updateTransform();
            console.log(`📐 Camera adjusted for new screen size: ${screenWidth}x${screenHeight}, new position: (${this.x}, ${this.y})`);
        }
    }

    pan(deltaX: number, deltaY: number): void {
        this.x += deltaX * this.panSpeed;
        this.y += deltaY * this.panSpeed;
        this.updateTransform();
    }

    // Simplified zoom - just ensure it stays at 1.0
    zoomTo(): void {
        // Keep zoom fixed at 1.0
        this.zoom = 1.0;
        this.updateTransform();
    }

    reset(): void {
        // Reset to center of current screen dimensions
        if (this.screenWidth > 0 && this.screenHeight > 0) {
            this.x = this.screenWidth / 2;
            this.y = this.screenHeight / 2;
        } else {
            // Fallback to origin if screen dimensions not set
            this.x = 0;
            this.y = 0;
        }
        this.zoom = 1.0;
        this.updateTransform();
        console.log(`🔄 Camera reset to center: (${this.x}, ${this.y})`);
    }

    worldToScreen(worldPos: { x: number; y: number }): { x: number; y: number } {
        // Transform world coordinates to screen coordinates
        // World (0,0) should appear at camera position (which is screen center when properly initialized)
        return {
            x: worldPos.x * this.zoom + this.x,
            y: worldPos.y * this.zoom + this.y
        };
    }

    screenToWorld(screenPos: { x: number; y: number }): { x: number; y: number } {
        // Transform screen coordinates to world coordinates
        // Screen coordinates relative to camera position give world coordinates
        const worldPos = {
            x: (screenPos.x - this.x) / this.zoom,
            y: (screenPos.y - this.y) / this.zoom
        };

        return worldPos;
    }

    public updateTransform(): void {
        // Apply camera transform to world container
        this.worldContainer.x = this.x;
        this.worldContainer.y = this.y;
        this.worldContainer.scale.set(this.zoom);

        // Notify callback of transform change
        if (this.onTransformChange) {
            this.onTransformChange();
        }
    }

    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.updateTransform();
    }

    // Center camera on a specific world position
    centerOnWorldPosition(worldX: number, worldY: number): void {
        // Position camera so that the given world position appears at screen center
        this.x = (this.screenWidth / 2) - worldX * this.zoom;
        this.y = (this.screenHeight / 2) - worldY * this.zoom;
        this.updateTransform();
        console.log(`🎯 Camera centered on world position (${worldX}, ${worldY}), camera now at (${this.x}, ${this.y})`);
    }

    // Get current screen dimensions
    getScreenDimensions(): { width: number; height: number } {
        return { width: this.screenWidth, height: this.screenHeight };
    }

    // Set callback for transform changes
    setOnTransformChange(callback: (() => void) | null): void {
        this.onTransformChange = callback;
    }

    // Configuration methods
    setPanSpeed(speed: number): void {
        this.panSpeed = speed;
    }
}
