import { FederatedPointerEvent, Container } from 'pixi.js';
import { ICamera } from '../interfaces/IUIComponent';
import { BaseUIComponent } from './BaseUIComponent';

export class InputHandler extends BaseUIComponent {
    private camera: ICamera;
    private isDragging: boolean = false;
    private lastDragPosition: { x: number; y: number } | null = null;
    private zoomSpeed: number = 0.1;

    constructor(container: Container, camera: ICamera) {
        super(container);
        this.camera = camera;
        this.setupEventListeners();
        this.setupKeyboardControls();
    }

    private setupEventListeners(): void {
        this.container.interactive = true;
        this.container.eventMode = 'static';

        // Mouse events
        this.container.on('pointermove', (event: FederatedPointerEvent) => this.onPointerMove(event));
        this.container.on('pointerdown', (event: FederatedPointerEvent) => this.onPointerDown(event));
        this.container.on('pointerup', (event: FederatedPointerEvent) => this.onPointerUp(event));
        this.container.on('pointerupoutside', (event: FederatedPointerEvent) => this.onPointerUp(event));
        this.container.on('wheel', (event: any) => this.onWheel(event));
    }

    private setupKeyboardControls(): void {
        document.addEventListener('keydown', (event) => {
            if (event.target !== document.body) return;

            const panDistance = 20 / this.camera.zoom;

            switch (event.code) {
                case 'Escape':
                    this.emit('escapePressed');
                    event.preventDefault();
                    break;
                case 'ArrowUp':
                case 'KeyW':
                    if (event.shiftKey) {
                        this.camera.pan(0, panDistance);
                        event.preventDefault();
                    }
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    if (event.shiftKey) {
                        this.camera.pan(0, -panDistance);
                        event.preventDefault();
                    }
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    if (event.shiftKey) {
                        this.camera.pan(panDistance, 0);
                        event.preventDefault();
                    }
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    if (event.shiftKey) {
                        this.camera.pan(-panDistance, 0);
                        event.preventDefault();
                    }
                    break;
                case 'KeyR':
                    if (event.ctrlKey) {
                        this.camera.reset();
                        event.preventDefault();
                    }
                    break;
                case 'Equal':
                case 'NumpadAdd':
                    if (event.ctrlKey) {
                        this.camera.zoomTo(this.zoomSpeed);
                        event.preventDefault();
                    }
                    break;
                case 'Minus':
                case 'NumpadSubtract':
                    if (event.ctrlKey) {
                        this.camera.zoomTo(-this.zoomSpeed);
                        event.preventDefault();
                    }
                    break;
            }
        });
    }

    private onPointerMove(event: FederatedPointerEvent): void {
        const localPosition = event.data.getLocalPosition(this.container);

        // Handle camera dragging
        if (this.isDragging && this.lastDragPosition) {
            const deltaX = localPosition.x - this.lastDragPosition.x;
            const deltaY = localPosition.y - this.lastDragPosition.y;
            this.camera.pan(deltaX, deltaY);
            this.lastDragPosition = { x: localPosition.x, y: localPosition.y };
            return;
        }

        // Emit mouse move event for other components
        const worldPosition = this.camera.screenToWorld(localPosition);
        this.emit('mouseMove', worldPosition, localPosition);
    }

    private onPointerDown(event: FederatedPointerEvent): void {
        const localPosition = event.data.getLocalPosition(this.container);

        // Check for camera panning (middle mouse button or right mouse with shift)
        if (event.data.button === 1 || (event.data.button === 2 && event.shiftKey)) {
            this.isDragging = true;
            this.lastDragPosition = { x: localPosition.x, y: localPosition.y };
            return;
        }

        // Right-click events
        if (event.data.button === 2) {
            this.emit('rightClick', localPosition);
            return;
        }

        // Left-click events
        if (event.data.button === 0) {
            const worldPosition = this.camera.screenToWorld(localPosition);
            this.emit('leftClick', worldPosition, localPosition);
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
        this.camera.zoomTo(zoomDelta, localPosition.x, localPosition.y);
    }

    resize(_width: number, _height: number): void {
        // Input handler doesn't need resize handling
    }
}
