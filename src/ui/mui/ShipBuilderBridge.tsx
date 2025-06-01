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

    // View state
    const [showGrid, setShowGrid] = useState<boolean>(true);
    const [showConnectionPoints, setShowConnectionPoints] = useState<boolean>(false);
    const [snapToGrid, setSnapToGrid] = useState<boolean>(true);

    // Camera state
    const [zoom, setZoom] = useState<number>(1.0);    // Debug state
    const [debugEnabled, setDebugEnabled] = useState<boolean>(false);

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
        shipBuilderAdapter.on('blockDeselected', handleBlockDeselected);

        // Initial sync
        handleShipChanged();
        setSelectedBlockType(shipBuilderAdapter.getSelectedBlock());

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
    }, []);

    const handleZoomIn = useCallback(() => {
        shipBuilderAdapter.zoomIn();
    }, []);

    const handleZoomOut = useCallback(() => {
        shipBuilderAdapter.zoomOut();
    }, []); const handleCenterView = useCallback(() => {
        shipBuilderAdapter.centerCamera();
    }, []);

    const handleResetCamera = useCallback(() => {
        shipBuilderAdapter.resetCamera();
        setZoom(1.0); // Reset zoom state
    }, []);

    const handleZoomChange = useCallback((newZoom: number) => {
        setZoom(newZoom);
        shipBuilderAdapter.setZoom(newZoom);
    }, []);

    // View control handlers
    const handleShowGridChange = useCallback((show: boolean) => {
        setShowGrid(show);
        shipBuilderAdapter.setShowGrid(show);
    }, []);

    const handleShowConnectionPointsChange = useCallback((show: boolean) => {
        setShowConnectionPoints(show);
        shipBuilderAdapter.setShowConnectionPoints(show);
    }, []);

    const handleSnapToGridChange = useCallback((snap: boolean) => {
        setSnapToGrid(snap);
        shipBuilderAdapter.setSnapToGrid(snap);
    }, []);    // Debug control handlers
    const handleDebugEnabledChange = useCallback((enabled: boolean) => {
        setDebugEnabled(enabled);
        shipBuilderAdapter.setDebugVisualization(enabled);
    }, []);

    const handleCollisionLoggingChange = useCallback((enabled: boolean) => {
        setCollisionLogging(enabled);
        // Enable/disable collision logging in the collision manager
        shipBuilderAdapter.setCollisionLogging(enabled);
    }, []);

    // Initialize state from adapter on mount
    useEffect(() => {
        // Sync initial state with adapter
        const syncWithAdapter = () => {
            const currentZoom = shipBuilderAdapter.getZoom();
            if (currentZoom !== undefined) {
                setZoom(currentZoom);
            }

            const gridEnabled = shipBuilderAdapter.getShowGrid();
            if (gridEnabled !== undefined) {
                setShowGrid(gridEnabled);
            }

            const connectionPointsEnabled = shipBuilderAdapter.getShowConnectionPoints();
            if (connectionPointsEnabled !== undefined) {
                setShowConnectionPoints(connectionPointsEnabled);
            }

            const snapEnabled = shipBuilderAdapter.getSnapToGrid();
            if (snapEnabled !== undefined) {
                setSnapToGrid(snapEnabled);
            }            const debugEnabled = shipBuilderAdapter.getDebugVisualization();
            if (debugEnabled !== undefined) {
                setDebugEnabled(debugEnabled);
            }
        };

        // Small delay to ensure adapter is ready
        const timeoutId = setTimeout(syncWithAdapter, 100);

        return () => clearTimeout(timeoutId);
    }, []); return (
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
            onResetCamera={handleResetCamera}
            showGrid={showGrid}
            showConnectionPoints={showConnectionPoints}
            snapToGrid={snapToGrid}            onShowGridChange={handleShowGridChange}
            onShowConnectionPointsChange={handleShowConnectionPointsChange}
            onSnapToGridChange={handleSnapToGridChange}
            zoom={zoom}
            onZoomChange={handleZoomChange}            debugEnabled={debugEnabled}
            onDebugEnabledChange={handleDebugEnabledChange}
            enableDebugVisualization={debugEnabled}
            onDebugVisualizationChange={handleDebugEnabledChange}
            collisionLogging={collisionLogging}
            onCollisionLoggingChange={handleCollisionLoggingChange}
        />
    );
};

export default ShipBuilderBridge;
