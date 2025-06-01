import { EventEmitter } from 'eventemitter3';
import { ShipBuilderRefactored } from '../ShipBuilderRefactored';
import { Ship } from '@/entities/Ship';

/**
 * Adapter that bridges MUI React components with PIXI.js ShipBuilder
 * Provides a clean interface for React components to interact with the PIXI.js ship builder
 */
export class ShipBuilderAdapter extends EventEmitter {
    private shipBuilder: ShipBuilderRefactored | null = null;    /**
     * Initialize the adapter with a PIXI.js ShipBuilder instance
     */
    setShipBuilder(shipBuilder: ShipBuilderRefactored): void {
        this.shipBuilder = shipBuilder;
        // Note: Event forwarding would require ShipBuilderRefactored to extend EventEmitter
        // For now, the adapter provides method calls without automatic event forwarding
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
    }

    /**
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
    }    /**
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
     */
    setCollisionLogging(enabled: boolean): void {
        // Access collision manager through service container
        const { serviceContainer } = require('@/core/ServiceContainer');
        const collisionManager = serviceContainer.get('collisionManager');
        if (collisionManager) {
            collisionManager.enableLogging = enabled;
            console.log(`🔧 Collision logging ${enabled ? 'enabled' : 'disabled'}`);
        } else {
            console.warn('⚠️ CollisionManager not found in service container');
        }
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
