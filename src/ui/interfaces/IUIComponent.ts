// Base interface for all UI components
export interface IUIComponent {
    destroy(): void;
    resize(width: number, height: number): void;
}

// Event interface for UI interactions
export interface IUIEvents {
    on(event: string, callback: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): void;
}

// Camera interface for viewport management
export interface ICamera {
    x: number;
    y: number;
    zoom: number;
    pan(deltaX: number, deltaY: number): void;
    zoomTo(zoom?: number, centerX?: number, centerY?: number): void;
    reset(): void;
    worldToScreen(worldPos: { x: number; y: number }): { x: number; y: number };
    screenToWorld(screenPos: { x: number; y: number }): { x: number; y: number };

    // Extended methods for compatibility and advanced functionality
    setOnTransformChange?(callback: (() => void) | null): void;
    updateTransform?(): void;
    initializePosition?(screenWidth: number, screenHeight: number): void;
    updateScreenDimensions?(screenWidth: number, screenHeight: number): void;
    centerOnWorldPosition?(worldX: number, worldY: number): void;
    getScreenDimensions?(): { width: number; height: number };
}

// Block placement interface
export interface IBlockPlacer {
    canPlaceBlock(position: { x: number; y: number }, blockType: string): boolean;
    placeBlock(position: { x: number; y: number }, blockType: string): boolean;
    removeBlock(position: { x: number; y: number }): boolean;
}

// Ship builder configuration
export interface IShipBuilderConfig {
    gridSize: number;
    gridWidth: number;
    gridHeight: number;
    snapToGrid: boolean;
    showGrid: boolean;
    showConnectionPoints: boolean;
    enableDebugVisualization?: boolean;
}
