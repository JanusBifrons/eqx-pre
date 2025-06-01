import { EventEmitter } from 'eventemitter3';
import { ShipBuilderRefactored } from '../ShipBuilderRefactored';
import { Ship } from '@/entities/Ship';
import { serviceContainer } from '@/core/ServiceContainer';

/**
 * Adapter that bridges MUI React components with PIXI.js ShipBuilder
 * Provides a clean interface for React components to interact with the PIXI.js ship builder
 */
export class ShipBuilderAdapter extends EventEmitter {
    private shipBuilder: ShipBuilderRefactored | null = null;/**
     * Initialize the adapter with a PIXI.js ShipBuilder instance
     */
    setShipBuilder(shipBuilder: ShipBuilderRefactored): void {
        this.shipBuilder = shipBuilder;

        // Register callbacks to bridge PIXI.js events to EventEmitter events
        this.shipBuilder.setOnShipChanged(() => {
            this.emit('shipChanged');
        });

        this.shipBuilder.setOnBlockDeselected(() => {
            this.emit('blockDeselected');
        });
    }

    /**
     * Get the current ship instance
     */
    getShip(): Ship | null {
        return this.shipBuilder?.getShip() || null;
    }

    /**
     * Block selection methods
     */
    selectBlock(blockType: string): void {
        if (this.shipBuilder) {
            this.shipBuilder.selectBlockType(blockType);
        }
    }

    deselectBlock(): void {
        if (this.shipBuilder) {
            this.shipBuilder.deselectBlockType();
        }
    }

    getSelectedBlock(): string | null {
        return this.shipBuilder?.getSelectedBlockType() || null;
    }

    /**
     * Ship management methods
     */
    clearShip(): void {
        if (this.shipBuilder) {
            this.shipBuilder.clearShip();
            this.emit('shipChanged');
        }
    } testShip(): void {
        if (this.shipBuilder) {
            // Use the public testConnectionSystem method instead of private testShip
            this.shipBuilder.testConnectionSystem();
        }
    }

    repairShip(): void {
        if (this.shipBuilder) {
            this.shipBuilder.repairConnections();
            this.emit('shipChanged');
        }
    } saveShip(): any | null {
        if (this.shipBuilder) {
            return this.shipBuilder.saveShip();
        }
        return null;
    } loadShip(shipData: any): void {
        if (this.shipBuilder) {
            try {
                this.shipBuilder.loadShip(shipData);
                this.emit('shipChanged');
            } catch (error) {
                console.error('Failed to load ship:', error);
            }
        }
    }/**
     * Camera control methods
     */
    zoomIn(): void {
        if (this.shipBuilder) {
            this.shipBuilder.zoomIn();
        }
    }

    zoomOut(): void {
        if (this.shipBuilder) {
            this.shipBuilder.zoomOut();
        }
    }

    centerCamera(): void {
        if (this.shipBuilder) {
            this.shipBuilder.centerOnShip();
        }
    }

    resetZoom(): void {
        if (this.shipBuilder) {
            this.shipBuilder.resetZoom();
        }
    }

    /**
     * Building mode control
     */
    setBuildingMode(isBuilding: boolean): void {
        if (this.shipBuilder) {
            this.shipBuilder.setBuildingMode(isBuilding);
        }
    }

    isBuildingMode(): boolean {
        return this.shipBuilder?.isBuildingMode() || false;
    }    /**
     * Grid and visualization controls
     */
    toggleGrid(): void {
        if (this.shipBuilder) {
            this.shipBuilder.toggleGrid();
        }
    }

    toggleConnectionPoints(): void {
        if (this.shipBuilder) {
            this.shipBuilder.toggleConnectionPoints();
        }
    }

    setShowGrid(show: boolean): void {
        if (this.shipBuilder) {
            // Add method to set grid visibility directly
            this.shipBuilder.setShowGrid(show);
        }
    }

    getShowGrid(): boolean {
        return this.shipBuilder?.getShowGrid() || false;
    }

    setShowConnectionPoints(show: boolean): void {
        if (this.shipBuilder) {
            this.shipBuilder.setShowConnectionPoints(show);
        }
    }

    getShowConnectionPoints(): boolean {
        return this.shipBuilder?.getShowConnectionPoints() || false;
    }

    setSnapToGrid(snap: boolean): void {
        if (this.shipBuilder) {
            this.shipBuilder.setSnapToGrid(snap);
        }
    }

    getSnapToGrid(): boolean {
        return this.shipBuilder?.getSnapToGrid() || false;
    }

    // Camera state getters
    getZoom(): number {
        return this.shipBuilder?.getZoom() || 1.0;
    }

    setZoom(zoom: number): void {
        if (this.shipBuilder) {
            this.shipBuilder.setZoom(zoom);
        }
    }

    resetCamera(): void {
        if (this.shipBuilder) {
            this.shipBuilder.resetCamera();
        }
    }

    // Debug visualization controls
    setDebugVisualization(enabled: boolean): void {
        if (this.shipBuilder) {
            this.shipBuilder.setDebugVisualization(enabled);
        }
    }

    getDebugVisualization(): boolean {
        return this.shipBuilder?.getDebugVisualization() || false;
    }/**
     * Statistics and ship data
     */
    getShipStats(): any {
        const ship = this.getShip();
        if (ship) {
            return ship.calculateStats();
        }
        return null;
    }

    /**
     * Manual event triggering methods for React components
     * Since ShipBuilderRefactored doesn't have EventEmitter, 
     * React components should call these methods to trigger updates
     */
    triggerShipChanged(): void {
        this.emit('shipChanged');
    }

    triggerBlockSelected(blockType: string): void {
        this.emit('blockSelected', blockType);
    } triggerBlockDeselected(): void {
        this.emit('blockDeselected');
    }

    /**
     * Debug controls
     */    setCollisionLogging(enabled: boolean): void {
        // Access collision manager through service container
        const collisionManager = serviceContainer.get('collisionManager') as any;
        if (collisionManager) {
            collisionManager.enableLogging = enabled;
            console.log(`🔧 Collision logging ${enabled ? 'enabled' : 'disabled'}`);
        } else {
            console.warn('⚠️ CollisionManager not found in service container');
        }
    }

    /**
     * Debug controls - RenderingEngine integration
     */    setShowDebugBorder(show: boolean): void {
        console.log(`🔧 ShipBuilderAdapter: setShowDebugBorder(${show})`);
        try {
            const application = serviceContainer.get('application') as any;
            if (application) {
                const renderingEngine = application.getRenderingEngine();
                renderingEngine.setShowDebugBorder(show);
                console.log(`✅ Successfully called renderingEngine.setShowDebugBorder(${show})`);
            } else {
                console.warn('⚠️ Application not found in service container');
            }
        } catch (error) {
            console.warn('⚠️ Failed to set debug border:', error);
        }
    } getShowDebugBorder(): boolean {
        try {
            const application = serviceContainer.get('application') as any;
            if (application) {
                const renderingEngine = application.getRenderingEngine();
                return renderingEngine.getShowDebugBorder();
            }
        } catch (error) {
            console.warn('⚠️ Failed to get debug border state:', error);
        }
        return false;
    } setShowDebugCenter(show: boolean): void {
        console.log(`🔧 ShipBuilderAdapter: setShowDebugCenter(${show})`);
        try {
            const application = serviceContainer.get('application') as any;
            if (application) {
                const renderingEngine = application.getRenderingEngine();
                renderingEngine.setShowDebugCenter(show);
                console.log(`✅ Successfully called renderingEngine.setShowDebugCenter(${show})`);
            } else {
                console.warn('⚠️ Application not found in service container');
            }
        } catch (error) {
            console.warn('⚠️ Failed to set debug center:', error);
        }
    } getShowDebugCenter(): boolean {
        try {
            const application = serviceContainer.get('application') as any;
            if (application) {
                const renderingEngine = application.getRenderingEngine();
                return renderingEngine.getShowDebugCenter();
            }
        } catch (error) {
            console.warn('⚠️ Failed to get debug center state:', error);
        }
        return false;
    } setShowDebugStats(show: boolean): void {
        try {
            const application = serviceContainer.get('application') as any;
            if (application) {
                const renderingEngine = application.getRenderingEngine();
                renderingEngine.setShowDebugStats(show);
            }
        } catch (error) {
            console.warn('⚠️ Failed to set debug stats:', error);
        }
    } getShowDebugStats(): boolean {
        try {
            const application = serviceContainer.get('application') as any;
            if (application) {
                const renderingEngine = application.getRenderingEngine();
                return renderingEngine.getShowDebugStats();
            }
        } catch (error) {
            console.warn('⚠️ Failed to get debug stats state:', error);
        }
        return false;
    } getDebugInfo(): any {
        try {
            const application = serviceContainer.get('application') as any;
            if (application) {
                const renderingEngine = application.getRenderingEngine();
                return renderingEngine.getDebugInfo();
            }
        } catch (error) {
            console.warn('⚠️ Failed to get debug info:', error);
        }
        return null;
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this.removeAllListeners();
        this.shipBuilder = null;
    }
}

// Singleton instance for use across React components
export const shipBuilderAdapter = new ShipBuilderAdapter();
