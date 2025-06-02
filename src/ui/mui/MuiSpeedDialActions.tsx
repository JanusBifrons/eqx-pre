import React, { useState } from 'react';
import {
    SpeedDial,
    SpeedDialAction,
    SpeedDialIcon,
    Fab,
    Box,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    FormControlLabel,
    Checkbox,
    Typography,
    styled,
    alpha,
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
    Settings as SettingsIcon,
    Close as CloseIcon,
    BugReport as DebugIcon,
} from '@mui/icons-material';
import { spaceColors } from '../../theme';

interface SpeedDialActionsProps {
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
    // Zoom display
    currentZoom: number;
    // Collision logging controls
    collisionLogging: boolean;
    onCollisionLoggingChange: (enabled: boolean) => void;
}

const StyledSpeedDial = styled(SpeedDial)(() => ({
    position: 'absolute',
    bottom: 20,
    right: 20,
    '& .MuiFab-primary': {
        backgroundColor: alpha(spaceColors.primary.main, 0.9),
        border: `2px solid ${alpha(spaceColors.primary.main, 0.5)}`,
        boxShadow: `0 4px 20px ${alpha(spaceColors.primary.main, 0.4)}`,
        '&:hover': {
            backgroundColor: alpha(spaceColors.primary.main, 1),
            boxShadow: `0 6px 24px ${alpha(spaceColors.primary.main, 0.6)}`,
        },
    },
}));

const StyledSpeedDialAction = styled(SpeedDialAction)<{ variant?: 'success' | 'error' | 'warning' | 'info' }>(
    ({ variant = 'info' }) => {
        const colorMap = {
            success: spaceColors.success.main,
            error: spaceColors.error.main,
            warning: spaceColors.warning.main,
            info: spaceColors.info.main,
        };
        const color = colorMap[variant];

        return {
            '& .MuiFab-root': {
                backgroundColor: alpha(spaceColors.background.paper, 0.95),
                backdropFilter: 'blur(10px)',
                border: `2px solid ${alpha(color, 0.4)}`,
                color: color,
                boxShadow: `0 2px 10px ${alpha(color, 0.3)}`,
                '&:hover': {
                    backgroundColor: alpha(color, 0.1),
                    border: `2px solid ${alpha(color, 0.7)}`,
                    boxShadow: `0 4px 16px ${alpha(color, 0.5)}`,
                    transform: 'scale(1.05)',
                },
                '&:disabled': {
                    backgroundColor: alpha(spaceColors.background.surface, 0.5),
                    border: `2px solid ${alpha(spaceColors.text.disabled, 0.3)}`,
                    color: spaceColors.text.disabled,
                },
            },
            '& .MuiSpeedDialAction-staticTooltipLabel': {
                backgroundColor: alpha(spaceColors.background.paper, 0.95),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(color, 0.3)}`,
                color: spaceColors.text.primary,
                fontWeight: 'bold',
                fontSize: '0.8rem',
            },
        };
    }
);

const ViewControlsContainer = styled(Box)(() => ({
    position: 'absolute',
    top: 20,
    right: 20,
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
}));

const ZoomDisplay = styled(Box)(() => ({
    backgroundColor: alpha(spaceColors.background.paper, 0.9),
    backdropFilter: 'blur(8px)',
    border: `2px solid ${alpha(spaceColors.info.main, 0.4)}`,
    color: spaceColors.info.main,
    borderRadius: '8px',
    padding: '4px 8px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    minWidth: '50px',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const ViewControlFab = styled(Fab)(() => ({
    width: 40,
    height: 40,
    backgroundColor: alpha(spaceColors.background.paper, 0.9),
    backdropFilter: 'blur(8px)',
    border: `2px solid ${alpha(spaceColors.info.main, 0.4)}`,
    color: spaceColors.info.main,
    boxShadow: `0 4px 20px ${alpha(spaceColors.info.main, 0.3)}`,
    '&:hover': {
        backgroundColor: alpha(spaceColors.info.main, 0.2),
        border: `2px solid ${alpha(spaceColors.info.main, 0.7)}`,
        boxShadow: `0 6px 24px ${alpha(spaceColors.info.main, 0.5)}`,
        transform: 'scale(1.05)',
    },
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const DebugDialog = styled(Dialog)(() => ({
    '& .MuiDialog-paper': {
        backgroundColor: alpha(spaceColors.background.paper, 0.95),
        backdropFilter: 'blur(20px)',
        border: `2px solid ${alpha(spaceColors.warning.main, 0.3)}`,
        borderRadius: 12,
    },
}));

export const MuiSpeedDialActions: React.FC<SpeedDialActionsProps> = ({
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
    currentZoom,
    collisionLogging,
    onCollisionLoggingChange,
}) => {
    const [open, setOpen] = useState(false);
    const [debugDialogOpen, setDebugDialogOpen] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const actions = [
        {
            icon: <TestIcon />,
            name: canTest ? 'Test Ship' : 'Ship needs repair to test',
            onClick: onTestShip,
            disabled: !canTest,
            variant: 'success' as const,
        },
        {
            icon: <ClearIcon />,
            name: 'Clear Ship',
            onClick: onClearShip,
            disabled: !hasBlocks,
            variant: 'error' as const,
        },
        {
            icon: <RepairIcon />,
            name: 'Repair Connections',
            onClick: onRepairConnections,
            disabled: !hasBlocks,
            variant: 'warning' as const,
        },
        {
            icon: <SaveIcon />,
            name: 'Save Ship',
            onClick: onSaveShip,
            disabled: !hasBlocks,
            variant: 'info' as const,
        },
        {
            icon: <LoadIcon />,
            name: 'Load Ship',
            onClick: onLoadShip,
            disabled: false,
            variant: 'info' as const,
        },
        {
            icon: <DebugIcon />,
            name: 'Debug Controls',
            onClick: () => setDebugDialogOpen(true),
            disabled: false,
            variant: 'warning' as const,
        },
    ];

    return (
        <Box className={className}>            {/* View Controls - Always visible */}
            <ViewControlsContainer>
                <Tooltip title="Zoom In" placement="bottom">
                    <ViewControlFab onClick={onZoomIn} size="small">
                        <ZoomInIcon />
                    </ViewControlFab>
                </Tooltip>

                <Tooltip title="Zoom Out" placement="bottom">
                    <ViewControlFab onClick={onZoomOut} size="small">
                        <ZoomOutIcon />
                    </ViewControlFab>
                </Tooltip>                <Tooltip title="Center View" placement="bottom">
                    <ViewControlFab onClick={onCenterView} size="small">
                        <CenterIcon />
                    </ViewControlFab>
                </Tooltip>

                <ZoomDisplay>
                    {currentZoom.toFixed(1)}x
                </ZoomDisplay>
            </ViewControlsContainer>

            {/* Main SpeedDial */}
            <StyledSpeedDial
                ariaLabel="Ship Builder Actions"
                icon={<SpeedDialIcon icon={<SettingsIcon />} openIcon={<CloseIcon />} />}
                onClose={handleClose}
                onOpen={handleOpen}
                open={open}
                direction="up"
            >
                {actions.map((action) => (
                    <StyledSpeedDialAction
                        key={action.name}
                        icon={action.icon}
                        tooltipTitle={action.name}
                        onClick={() => {
                            if (!action.disabled) {
                                action.onClick();
                                handleClose();
                            }
                        }}
                        variant={action.variant}
                        FabProps={{
                            disabled: action.disabled,
                        }}
                    />
                ))}
            </StyledSpeedDial>

            {/* Debug Controls Dialog */}
            <DebugDialog
                open={debugDialogOpen}
                onClose={() => setDebugDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle
                    sx={{
                        color: spaceColors.warning.main,
                        fontWeight: 'bold',
                        borderBottom: `1px solid ${alpha(spaceColors.warning.main, 0.3)}`,
                    }}
                >
                    Debug Controls
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
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
                                }}
                            />
                        }
                        label={
                            <Typography
                                variant="body2"
                                sx={{
                                    color: spaceColors.text.primary,
                                    fontWeight: 'medium',
                                }}
                            >
                                Enable Collision Logging
                            </Typography>
                        }
                    />
                    <Typography
                        variant="caption"
                        sx={{
                            color: spaceColors.text.secondary,
                            display: 'block',
                            mt: 1,
                        }}
                    >
                        When enabled, collision events will be logged to the console for debugging purposes.
                    </Typography>
                </DialogContent>
            </DebugDialog>
        </Box>
    );
};

export default MuiSpeedDialActions;
