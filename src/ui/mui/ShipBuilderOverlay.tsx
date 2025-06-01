import * as React from 'react';
import { Box } from '@mui/material';
import { Ship } from '../../entities/Ship';
import { MuiBlockPalette } from './MuiBlockPalette';
import { MuiStatsPanel } from './MuiStatsPanel';
import { MuiSpeedDialActions } from './MuiSpeedDialActions';
import { MuiInstructionsPanel } from './MuiInstructionsPanel';

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
    collisionLogging,
    onCollisionLoggingChange,
}) => {
    // Calculate ship validation status for action buttons
    const validation = ship.validateStructuralIntegrity();
    const canTest = validation.isValid;
    const hasBlocks = ship.blocks.size > 0;

    return (
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
        >
            {/* Block Palette - Left Side */}
            <MuiBlockPalette
                selectedBlockType={selectedBlockType}
                onBlockSelect={onBlockTypeSelect}
            />

            {/* Ship Statistics - Right Side */}
            <MuiStatsPanel ship={ship} />

            {/* Speed Dial Actions - Bottom Right */}
            <MuiSpeedDialActions
                onTestShip={onTestShip}
                onClearShip={onClearShip}
                onSaveShip={onSaveShip}
                onLoadShip={onLoadShip}
                onRepairConnections={onRepairConnections}
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onCenterView={onCenterView}
                canTest={canTest}
                hasBlocks={hasBlocks}
                collisionLogging={collisionLogging}
                onCollisionLoggingChange={onCollisionLoggingChange}
            />

            {/* Instructions Panel - Bottom Left */}
            <MuiInstructionsPanel />
        </Box>
    );
};

export default ShipBuilderOverlay;
