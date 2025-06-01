import { ICamera } from '../interfaces/IUIComponent';
import { Container } from 'pixi.js';

export class CameraController implements ICamera {
    public x: number = 0;
    public y: number = 0;
    public zoom: number = 1;

    private worldContainer: Container;
    private panSpeed: number = 1;
    private minZoom: number = 0.5;
    private maxZoom: number = 3;

    constructor(worldContainer: Container) {
        this.worldContainer = worldContainer;
    }

    pan(deltaX: number, deltaY: number): void {
        this.x += deltaX * this.panSpeed;
        this.y += deltaY * this.panSpeed;
        this.updateTransform();
    }

    zoomTo(zoomDelta: number, centerX?: number, centerY?: number): void {
        const oldZoom = this.zoom;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + zoomDelta));

        if (centerX !== undefined && centerY !== undefined) {
            const zoomFactor = this.zoom / oldZoom;
            this.x = centerX - (centerX - this.x) * zoomFactor;
            this.y = centerY - (centerY - this.y) * zoomFactor;
        }

        this.updateTransform();
    }

    reset(): void {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.updateTransform();
    }

    worldToScreen(worldPos: { x: number; y: number }): { x: number; y: number } {
        return {
            x: worldPos.x * this.zoom + this.x,
            y: worldPos.y * this.zoom + this.y
        };
    }

    screenToWorld(screenPos: { x: number; y: number }): { x: number; y: number } {
        return {
            x: (screenPos.x - this.x) / this.zoom,
            y: (screenPos.y - this.y) / this.zoom
        };
    }

    private updateTransform(): void {
        this.worldContainer.x = this.x;
        this.worldContainer.y = this.y;
        this.worldContainer.scale.set(this.zoom);
    }

    // Configuration methods
    setPanSpeed(speed: number): void {
        this.panSpeed = speed;
    }

    setZoomLimits(min: number, max: number): void {
        this.minZoom = min;
        this.maxZoom = max;
        this.zoom = Math.max(min, Math.min(max, this.zoom));
        this.updateTransform();
    }
}
