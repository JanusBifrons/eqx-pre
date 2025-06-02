import React, { useState, useEffect, useCallback } from 'react';
import { ShipBuilderOverlay } from './ShipBuilderOverlay';
import { shipBuilderAdapter } from './ShipBuilderAdapter';
import { Ship } from '../../entities/Ship';

interface ShipBuilderBridgeProps {
    // This component will manage the connection between the adapter and overlay
}

export const ShipBuilderBridge: React.FC<ShipBuilderBridgeProps> = () => {
    const [ship, setShip] = useState<Ship>(new Ship());
    const [selectedBlockType, setSelectedBlockType] = useState<string | null>(null);
    const [collisionLogging, setCollisionLogging] = useState<boolean>(false);
    const [currentZoom, setCurrentZoom] = useState<number>(1.0);

    // Update ship state when adapter emits changes
    useEffect(() => {
        const handleShipChanged = () => {
            const currentShip = shipBuilderAdapter.getShip();
            if (currentShip) {
                setShip(currentShip);
            }
        };

        const handleBlockSelected = (blockType: string) => {
            setSelectedBlockType(blockType);
        };

        const handleBlockDeselected = () => {
            setSelectedBlockType(null);
        };

        // Listen to adapter events
        shipBuilderAdapter.on('shipChanged', handleShipChanged);
        shipBuilderAdapter.on('blockSelected', handleBlockSelected);
        shipBuilderAdapter.on('blockDeselected', handleBlockDeselected);        // Initial sync
        handleShipChanged();
        setSelectedBlockType(shipBuilderAdapter.getSelectedBlock());
        setCurrentZoom(shipBuilderAdapter.getZoom());

        return () => {
            shipBuilderAdapter.off('shipChanged', handleShipChanged);
            shipBuilderAdapter.off('blockSelected', handleBlockSelected);
            shipBuilderAdapter.off('blockDeselected', handleBlockDeselected);
        };
    }, []);

    // Handler functions that call adapter methods and trigger events
    const handleBlockTypeSelect = useCallback((blockType: string | null) => {
        if (blockType) {
            shipBuilderAdapter.selectBlock(blockType);
            shipBuilderAdapter.triggerBlockSelected(blockType);
        } else {
            shipBuilderAdapter.deselectBlock();
            shipBuilderAdapter.triggerBlockDeselected();
        }
    }, []);

    const handleTestShip = useCallback(() => {
        shipBuilderAdapter.testShip();
    }, []);

    const handleClearShip = useCallback(() => {
        shipBuilderAdapter.clearShip();
        shipBuilderAdapter.triggerShipChanged();
    }, []);

    const handleSaveShip = useCallback(() => {
        const shipData = shipBuilderAdapter.saveShip();
        if (shipData) {
            // In a real app, you might save to localStorage or send to server
            console.log('Ship saved:', shipData);
            // For demo purposes, save to localStorage
            localStorage.setItem('savedShip', JSON.stringify(shipData));
        }
    }, []);

    const handleLoadShip = useCallback(() => {
        // In a real app, you might load from server or file
        const savedData = localStorage.getItem('savedShip');
        if (savedData) {
            try {
                const shipData = JSON.parse(savedData);
                shipBuilderAdapter.loadShip(shipData);
                shipBuilderAdapter.triggerShipChanged();
            } catch (error) {
                console.error('Failed to load ship:', error);
            }
        }
    }, []);

    const handleRepairConnections = useCallback(() => {
        shipBuilderAdapter.repairShip();
        shipBuilderAdapter.triggerShipChanged();
    }, []);    const handleZoomIn = useCallback(() => {
        shipBuilderAdapter.zoomIn();
        setCurrentZoom(shipBuilderAdapter.getZoom());
    }, []);

    const handleZoomOut = useCallback(() => {
        shipBuilderAdapter.zoomOut();
        setCurrentZoom(shipBuilderAdapter.getZoom());
    }, []);    const handleCenterView = useCallback(() => {
        shipBuilderAdapter.centerCamera();
        setCurrentZoom(shipBuilderAdapter.getZoom());
    }, []);const handleCollisionLoggingChange = useCallback((enabled: boolean) => {
        setCollisionLogging(enabled);
        // Enable/disable collision logging in the collision manager
        shipBuilderAdapter.setCollisionLogging(enabled);
    }, []);    return (
        <ShipBuilderOverlay
            ship={ship}
            selectedBlockType={selectedBlockType}
            onBlockTypeSelect={handleBlockTypeSelect}
            onTestShip={handleTestShip}
            onClearShip={handleClearShip}
            onSaveShip={handleSaveShip}
            onLoadShip={handleLoadShip}
            onRepairConnections={handleRepairConnections}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onCenterView={handleCenterView}
            currentZoom={currentZoom}
            collisionLogging={collisionLogging}
            onCollisionLoggingChange={handleCollisionLoggingChange}
        />
    );
};

export default ShipBuilderBridge;
