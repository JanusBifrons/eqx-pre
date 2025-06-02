import { ICamera } from '../interfaces/IUIComponent';
import { RenderingEngine } from '@/core/RenderingEngine';

/**
 * CameraAdapter - Unified camera system that bridges RenderingEngine camera
 * functionality with the ICamera interface for consistent usage across all demos.
 * 
 * This adapter wraps the RenderingEngine's camera system and provides:
 * - Consistent ICamera interface implementation
 * - Coordinate transformation methods
 * - Camera state management
 * - Event-driven updates for UI components
 */
export class CameraAdapter implements ICamera {
    private renderingEngine: RenderingEngine;
    private onTransformChange: (() => void) | null = null;

    constructor(renderingEngine: RenderingEngine) {
        this.renderingEngine = renderingEngine;
    }

    // ICamera interface implementation
    get x(): number {
        return this.renderingEngine.getCamera().x;
    }

    get y(): number {
        return this.renderingEngine.getCamera().y;
    }

    get zoom(): number {
        return this.renderingEngine.getCamera().zoom;
    }

    pan(deltaX: number, deltaY: number): void {
        this.renderingEngine.panCamera(deltaX, deltaY);
        this.notifyTransformChange();
    }

    zoomTo(zoom?: number, centerX?: number, centerY?: number): void {
        if (zoom !== undefined) {
            const currentCamera = this.renderingEngine.getCamera();
            const zoomDelta = (zoom - currentCamera.zoom) / currentCamera.zoom;
            this.renderingEngine.zoomCamera(zoomDelta, centerX, centerY);
        }
        this.notifyTransformChange();
    }

    reset(): void {
        this.renderingEngine.resetCamera();
        this.notifyTransformChange();
    }

    worldToScreen(worldPos: { x: number; y: number }): { x: number; y: number } {
        return this.renderingEngine.worldToScreen(worldPos.x, worldPos.y);
    }

    screenToWorld(screenPos: { x: number; y: number }): { x: number; y: number } {
        return this.renderingEngine.screenToWorld(screenPos.x, screenPos.y);
    }

    // Extended methods for camera control
    setCamera(x: number, y: number, zoom?: number): void {
        this.renderingEngine.setCamera({
            x,
            y,
            zoom: zoom || this.renderingEngine.getCamera().zoom
        });
        this.notifyTransformChange();
    }

    centerCamera(): void {
        this.renderingEngine.centerCamera();
        this.notifyTransformChange();
    }

    zoomCamera(zoomDelta: number, centerX?: number, centerY?: number): void {
        this.renderingEngine.zoomCamera(zoomDelta, centerX, centerY);
        this.notifyTransformChange();
    }

    // Center camera on a specific world position
    centerOnWorldPosition(worldX: number, worldY: number): void {
        // Calculate camera position to center the world position on screen
        const pixiApp = this.renderingEngine.getPixiApp(); if (!pixiApp) return;

        // Convert world position to where camera should be positioned
        const cameraX = -worldX;
        const cameraY = -worldY;

        this.renderingEngine.setCamera({ x: cameraX, y: cameraY });
        this.notifyTransformChange();

        console.log(`🎯 Camera centered on world position (${worldX}, ${worldY}), camera now at (${cameraX}, ${cameraY})`);
    }

    // Get current screen dimensions
    getScreenDimensions(): { width: number; height: number } {
        const pixiApp = this.renderingEngine.getPixiApp();
        return {
            width: pixiApp?.screen.width || 0,
            height: pixiApp?.screen.height || 0
        };
    }

    // Set callback for transform changes
    setOnTransformChange(callback: (() => void) | null): void {
        this.onTransformChange = callback;
    }

    // Get the underlying camera state
    getCameraState() {
        return this.renderingEngine.getCamera();
    }

    // Check if camera system is ready
    isReady(): boolean {
        return !!this.renderingEngine.getPixiApp();
    }

    private notifyTransformChange(): void {
        if (this.onTransformChange) {
            this.onTransformChange();
        }
    }

    // Configuration methods for compatibility
    setPanSpeed(_speed: number): void {
        // Pan speed is handled by RenderingEngine config
        console.log('Pan speed configuration is handled by RenderingEngine config');
    }

    // Initialize position for compatibility with existing code
    initializePosition(screenWidth: number, screenHeight: number): void {
        // Center the camera for buildable area at screen center
        this.renderingEngine.centerCamera();
        this.notifyTransformChange();
        console.log(`🎯 Camera initialized to center buildable area for screen: ${screenWidth}x${screenHeight}`);
    }

    // Update screen dimensions for compatibility
    updateScreenDimensions(screenWidth: number, screenHeight: number): void {
        // RenderingEngine handles screen dimension updates automatically via ResizeObserver
        console.log(`📐 Screen dimensions updated: ${screenWidth}x${screenHeight} (handled by RenderingEngine)`);
        this.notifyTransformChange();
    }
}
