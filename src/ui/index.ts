// Export all UI components and interfaces
export * from './interfaces/IUIComponent';
export * from './components/BaseUIComponent';
export * from './components/CameraController';
export * from './components/InputHandler';
export * from './components/BlockPlacer';
export * from './components/BlockPreview';

// Export the refactored ShipBuilder
export { ShipBuilderRefactored } from './ShipBuilderRefactored';

// Keep the original for backward compatibility
export { ShipBuilder as ShipBuilderOriginal } from './ShipBuilder';
