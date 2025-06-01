import React from 'react';
import { Box } from '@mui/material';
import { Ship } from '../../entities/Ship';
import { MuiBlockPalette } from './MuiBlockPalette';
import { MuiStatsPanel } from './MuiStatsPanel';
import { MuiActionButtons } from './MuiActionButtons';
import { MuiInstructionsPanel } from './MuiInstructionsPanel';
import { MuiShipBuilderControls } from './MuiShipBuilderControls';
import { MuiDebugControls } from './MuiDebugControls';

interface ShipBuilderOverlayProps {
    ship: Ship;
    selectedBlockType: string | null;
    onBlockTypeSelect: (blockType: string | null) => void;
    onTestShip: () => void;
    onClearShip: () => void;
    onSaveShip: () => void;
    onLoadShip: () => void;
    onRepairConnections: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onCenterView: () => void;
    onResetCamera: () => void;

    // View controls
    showGrid: boolean;
    showConnectionPoints: boolean;
    snapToGrid: boolean; onShowGridChange: (show: boolean) => void;
    onShowConnectionPointsChange: (show: boolean) => void;
    onSnapToGridChange: (snap: boolean) => void;

    // Zoom controls
    zoom: number;
    onZoomChange: (zoom: number) => void;

    // Debug controls
    debugEnabled: boolean;
    onDebugEnabledChange: (enabled: boolean) => void;
    enableDebugVisualization: boolean;
    onDebugVisualizationChange: (enabled: boolean) => void;
    showDebugBorder: boolean;
    showDebugCenter: boolean;
    showDebugStats: boolean;
    onShowDebugBorderChange: (show: boolean) => void;
    onShowDebugCenterChange: (show: boolean) => void;
    onShowDebugStatsChange: (show: boolean) => void;
    debugInfo: any;

    // Collision logging controls
    collisionLogging: boolean;
    onCollisionLoggingChange: (enabled: boolean) => void;
}

export const ShipBuilderOverlay: React.FC<ShipBuilderOverlayProps> = ({
    ship,
    selectedBlockType,
    onBlockTypeSelect,
    onTestShip,
    onClearShip,
    onSaveShip,
    onLoadShip,
    onRepairConnections,
    onZoomIn,
    onZoomOut,
    onCenterView,
    onResetCamera,
    showGrid,
    showConnectionPoints,
    snapToGrid, onShowGridChange,
    onShowConnectionPointsChange,
    onSnapToGridChange,
    zoom,
    onZoomChange,
    debugEnabled,
    onDebugEnabledChange,
    enableDebugVisualization,
    onDebugVisualizationChange,
    showDebugBorder,
    showDebugCenter,
    showDebugStats,
    onShowDebugBorderChange,
    onShowDebugCenterChange,
    onShowDebugStatsChange,
    debugInfo,
    collisionLogging,
    onCollisionLoggingChange,
}) => {
    // Calculate ship validation status for action buttons
    const validation = ship.validateStructuralIntegrity();
    const canTest = validation.isValid;
    const hasBlocks = ship.blocks.size > 0; return (
        <Box
            sx={{
                position: 'absolute',
                inset: 0, // Shorthand for top, right, bottom, left = 0
                pointerEvents: 'none', // Allow clicks to pass through to PIXI canvas
                display: 'flex',
                flexDirection: 'column',
                '& > *': {
                    pointerEvents: 'auto', // Re-enable pointer events for child components
                },
            }}
        >{/* Block Palette - Left Side */}
            <MuiBlockPalette
                selectedBlockType={selectedBlockType}
                onBlockSelect={onBlockTypeSelect}
            />

            {/* Ship Statistics - Right Side */}
            <MuiStatsPanel ship={ship} />

            {/* Action Buttons - Bottom Right */}
            <MuiActionButtons
                onTestShip={onTestShip}
                onClearShip={onClearShip}
                onSaveShip={onSaveShip}
                onLoadShip={onLoadShip}
                onRepairConnections={onRepairConnections}
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onCenterView={onCenterView}
                canTest={canTest}
                hasBlocks={hasBlocks} collisionLogging={collisionLogging}
                onCollisionLoggingChange={onCollisionLoggingChange}
            />

            {/* Instructions Panel - Bottom Left */}
            <MuiInstructionsPanel />

            {/* Ship Builder Controls - Bottom Center */}
            <MuiShipBuilderControls
                showGrid={showGrid}
                showConnectionPoints={showConnectionPoints}
                snapToGrid={snapToGrid}
                onShowGridChange={onShowGridChange}
                onShowConnectionPointsChange={onShowConnectionPointsChange}
                onSnapToGridChange={onSnapToGridChange}
                zoom={zoom}
                onZoomChange={onZoomChange}
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onCenterView={onCenterView}
                onResetCamera={onResetCamera}
                enableDebugVisualization={enableDebugVisualization}
                onDebugVisualizationChange={onDebugVisualizationChange}
                debugInfo={debugInfo}
                showDebugBorder={showDebugBorder}
                showDebugCenter={showDebugCenter}
                showDebugStats={showDebugStats}
                onShowDebugBorderChange={onShowDebugBorderChange} onShowDebugCenterChange={onShowDebugCenterChange}
                onShowDebugStatsChange={onShowDebugStatsChange}
            />

            {/* Debug Controls */}
            <MuiDebugControls
                enabled={debugEnabled}
                onEnabledChange={onDebugEnabledChange}
                showBorder={showDebugBorder}
                showCenter={showDebugCenter}
                showStats={showDebugStats}
                onShowBorderChange={onShowDebugBorderChange}
                onShowCenterChange={onShowDebugCenterChange}
                onShowStatsChange={onShowDebugStatsChange}
                onResetCamera={onResetCamera}
                debugInfo={debugInfo}
            />
        </Box>
    );
};

export default ShipBuilderOverlay;
