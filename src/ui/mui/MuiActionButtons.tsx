import React from 'react';
import {
    Box,
    Button,
    ButtonGroup,
    Fab,
    Tooltip,
    styled,
    alpha,
    FormControlLabel,
    Checkbox,
    Paper,
    Typography,
} from '@mui/material';
import {
    PlayArrow as TestIcon,
    Clear as ClearIcon,
    Save as SaveIcon,
    FolderOpen as LoadIcon,
    Build as RepairIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    CenterFocusStrong as CenterIcon,
} from '@mui/icons-material';
import { spaceColors } from '../../theme';

interface ActionButtonsProps {
    onTestShip: () => void;
    onClearShip: () => void;
    onSaveShip: () => void;
    onLoadShip: () => void;
    onRepairConnections: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onCenterView: () => void;
    canTest: boolean;
    hasBlocks: boolean;
    className?: string;
    // Collision logging controls
    collisionLogging: boolean;
    onCollisionLoggingChange: (enabled: boolean) => void;
}

const ActionContainer = styled(Box)(() => ({
    position: 'fixed',
    bottom: 20,
    right: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    zIndex: 1000,
}));

const MainActionsGroup = styled(ButtonGroup)(() => ({
    '& .MuiButton-root': {
        minWidth: 120,
        height: 48,
        backgroundColor: alpha(spaceColors.background.paper, 0.95),
        backdropFilter: 'blur(10px)',
        border: `2px solid ${alpha(spaceColors.primary.main, 0.3)}`,
        color: spaceColors.text.primary,
        fontWeight: 'bold',
        fontSize: '0.9rem',
        textTransform: 'none',
        '&:hover': {
            backgroundColor: alpha(spaceColors.primary.main, 0.2),
            border: `2px solid ${alpha(spaceColors.primary.main, 0.6)}`,
            boxShadow: `0 0 20px ${alpha(spaceColors.primary.main, 0.4)}`,
        },
        '&:disabled': {
            backgroundColor: alpha(spaceColors.background.surface, 0.5),
            border: `2px solid ${alpha(spaceColors.text.disabled, 0.3)}`,
            color: spaceColors.text.disabled,
        },
    },
}));

const UtilityActionsGroup = styled(ButtonGroup)(() => ({
    '& .MuiButton-root': {
        minWidth: 80,
        height: 40,
        backgroundColor: alpha(spaceColors.background.surface, 0.8),
        backdropFilter: 'blur(8px)',
        border: `1px solid ${alpha(spaceColors.secondary.main, 0.3)}`,
        color: spaceColors.text.secondary,
        fontSize: '0.8rem',
        textTransform: 'none',
        '&:hover': {
            backgroundColor: alpha(spaceColors.secondary.main, 0.2),
            border: `1px solid ${alpha(spaceColors.secondary.main, 0.6)}`,
            color: spaceColors.text.primary,
        },
    },
}));

const ViewControlsFab = styled(Fab, {
    shouldForwardProp: (prop) => prop !== 'customVariant' && prop !== 'onClick',
})<{ customVariant?: 'primary' | 'secondary' }>(({ customVariant = 'primary' }) => ({
    width: 48,
    height: 48,
    backgroundColor: alpha(spaceColors.background.paper, 0.9),
    backdropFilter: 'blur(8px)',
    border: `2px solid ${alpha(
        customVariant === 'primary' ? spaceColors.primary.main : spaceColors.info.main,
        0.4
    )}`,
    color: customVariant === 'primary' ? spaceColors.primary.main : spaceColors.info.main,
    boxShadow: `0 4px 20px ${alpha(
        customVariant === 'primary' ? spaceColors.primary.main : spaceColors.info.main,
        0.3
    )}`, '&:hover': {
        backgroundColor: alpha(
            customVariant === 'primary' ? spaceColors.primary.main : spaceColors.info.main,
            0.2
        ),
        border: `2px solid ${alpha(
            customVariant === 'primary' ? spaceColors.primary.main : spaceColors.info.main,
            0.7
        )}`,
        boxShadow: `0 6px 24px ${alpha(
            customVariant === 'primary' ? spaceColors.primary.main : spaceColors.info.main,
            0.5
        )}`,
        transform: 'scale(1.05)',
    },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

export const MuiActionButtons: React.FC<ActionButtonsProps> = ({
    onTestShip,
    onClearShip,
    onSaveShip,
    onLoadShip,
    onRepairConnections,
    onZoomIn,
    onZoomOut,
    onCenterView,
    canTest,
    hasBlocks,
    className,
    collisionLogging,
    onCollisionLoggingChange,
}) => {
    return (
        <ActionContainer className={className}>
            {/* View Controls */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>                <Tooltip title="Zoom In" placement="left">
                <ViewControlsFab
                    customVariant="secondary"
                    onClick={onZoomIn}
                >
                    <ZoomInIcon />
                </ViewControlsFab>
            </Tooltip>

                <Tooltip title="Zoom Out" placement="left">
                    <ViewControlsFab
                        customVariant="secondary"
                        onClick={onZoomOut}
                    >
                        <ZoomOutIcon />
                    </ViewControlsFab>
                </Tooltip>

                <Tooltip title="Center View" placement="left">
                    <ViewControlsFab
                        customVariant="secondary"
                        onClick={onCenterView}
                    >
                        <CenterIcon />
                    </ViewControlsFab>
                </Tooltip>
            </Box>

            {/* Utility Actions */}
            <UtilityActionsGroup variant="contained" orientation="vertical">
                <Tooltip title="Repair disconnected blocks" placement="left">
                    <Button
                        startIcon={<RepairIcon />}
                        onClick={onRepairConnections}
                        disabled={!hasBlocks}
                    >
                        Repair
                    </Button>
                </Tooltip>

                <Tooltip title="Save ship design" placement="left">
                    <Button
                        startIcon={<SaveIcon />}
                        onClick={onSaveShip}
                        disabled={!hasBlocks}
                    >
                        Save
                    </Button>
                </Tooltip>

                <Tooltip title="Load ship design" placement="left">
                    <Button
                        startIcon={<LoadIcon />}
                        onClick={onLoadShip}
                    >
                        Load
                    </Button>
                </Tooltip>
            </UtilityActionsGroup>

            {/* Main Actions */}
            <MainActionsGroup variant="contained" orientation="vertical">
                <Tooltip
                    title={canTest ? "Test ship in physics simulation" : "Fix structural issues to test"}
                    placement="left"
                >
                    <Button
                        startIcon={<TestIcon />}
                        onClick={onTestShip}
                        disabled={!canTest}
                        sx={{
                            '&:not(:disabled)': {
                                backgroundColor: alpha(spaceColors.success.main, 0.2),
                                border: `2px solid ${alpha(spaceColors.success.main, 0.5)}`,
                                color: spaceColors.success.main,
                                '&:hover': {
                                    backgroundColor: alpha(spaceColors.success.main, 0.3),
                                    border: `2px solid ${alpha(spaceColors.success.main, 0.8)}`,
                                    boxShadow: `0 0 20px ${alpha(spaceColors.success.main, 0.6)}`,
                                },
                            },
                        }}
                    >
                        Test Ship
                    </Button>
                </Tooltip>

                <Tooltip title="Clear all blocks from ship" placement="left">
                    <Button
                        startIcon={<ClearIcon />}
                        onClick={onClearShip}
                        disabled={!hasBlocks}
                        sx={{
                            '&:not(:disabled)': {
                                backgroundColor: alpha(spaceColors.error.main, 0.2),
                                border: `2px solid ${alpha(spaceColors.error.main, 0.5)}`,
                                color: spaceColors.error.main,
                                '&:hover': {
                                    backgroundColor: alpha(spaceColors.error.main, 0.3),
                                    border: `2px solid ${alpha(spaceColors.error.main, 0.8)}`,
                                    boxShadow: `0 0 20px ${alpha(spaceColors.error.main, 0.6)}`,
                                },
                            },
                        }}                    >
                        Clear Ship
                    </Button>
                </Tooltip>
            </MainActionsGroup>

            {/* Debug Controls */}
            <Paper
                elevation={3}
                sx={{
                    p: 2,
                    backgroundColor: alpha(spaceColors.background.surface, 0.9),
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(spaceColors.warning.main, 0.3)}`,
                    borderRadius: 2,
                }}
            >
                <Typography
                    variant="caption"
                    sx={{
                        color: spaceColors.text.secondary,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        mb: 1,
                        display: 'block',
                    }}
                >
                    DEBUG CONTROLS
                </Typography>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={collisionLogging}
                            onChange={(e) => onCollisionLoggingChange(e.target.checked)}
                            sx={{
                                color: spaceColors.warning.main,
                                '&.Mui-checked': {
                                    color: spaceColors.warning.main,
                                },
                                '& .MuiSvgIcon-root': {
                                    fontSize: 16,
                                },
                            }}
                        />
                    }
                    label={
                        <Typography
                            variant="caption"
                            sx={{
                                color: spaceColors.text.secondary,
                                fontSize: '0.7rem',
                            }}
                        >
                            Collision Logging
                        </Typography>
                    }
                    sx={{ m: 0 }}
                />            </Paper>
        </ActionContainer>
    );
};

export default MuiActionButtons;
