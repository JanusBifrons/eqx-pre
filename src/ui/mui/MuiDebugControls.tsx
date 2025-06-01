import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Switch,
    FormControlLabel,
    Button,
    Chip,
    Divider,
    styled,
    alpha,
} from '@mui/material';
import {
    BugReport as BugIcon,
    CenterFocusStrong as CenterIcon,
    CropFree as BorderIcon,
    Assessment as StatsIcon,
    RestartAlt as ResetIcon,
} from '@mui/icons-material';
import { spaceColors } from '../../theme';

const DebugContainer = styled(Card)(() => ({
    position: 'absolute',
    top: 10,
    right: 350, // Position it to the left of the stats panel
    width: 280,
    maxWidth: 'calc(100% - 20px)', // Use relative sizing
    maxHeight: 'calc(100% - 20px)', // Use relative sizing
    overflowY: 'auto',
    backgroundColor: alpha(spaceColors.background.paper, 0.95), backdropFilter: 'blur(10px)',
    border: `2px solid ${alpha(spaceColors.warning.main, 0.3)}`,
    borderRadius: '12px',
    zIndex: 10,
    '&::-webkit-scrollbar': {
        width: 8,
    },
    '&::-webkit-scrollbar-track': {
        backgroundColor: alpha(spaceColors.background.surface, 0.5),
        borderRadius: 4,
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: alpha(spaceColors.warning.main, 0.6),
        borderRadius: 4,
        '&:hover': {
            backgroundColor: alpha(spaceColors.warning.main, 0.8),
        },
    },
}));

const ControlGroup = styled(Box)(() => ({
    marginBottom: 16,
    padding: 12,
    backgroundColor: alpha(spaceColors.background.surface, 0.3),
    borderRadius: 8,
    border: `1px solid ${alpha(spaceColors.warning.main, 0.2)}`,
}));

const InfoChip = styled(Chip)(() => ({
    marginBottom: 4,
    fontSize: '0.75rem',
    backgroundColor: alpha(spaceColors.background.surface, 0.8),
    color: spaceColors.text.secondary,
    '& .MuiChip-label': {
        fontFamily: 'monospace',
    },
}));

interface CameraState {
    x: number;
    y: number;
    zoom: number;
    rotation: number;
}

interface DebugInfo {
    camera: CameraState;
    screenSize: { width: number; height: number };
    canvasSize: { width: number; height: number };
    containerSize: { width: number; height: number };
    resolution: number;
    fps: number;
}

interface MuiDebugControlsProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;

    // Debug visualization options
    showBorder: boolean;
    showCenter: boolean;
    showStats: boolean;
    onShowBorderChange: (show: boolean) => void;
    onShowCenterChange: (show: boolean) => void;
    onShowStatsChange: (show: boolean) => void;

    // Camera controls
    onResetCamera: () => void;

    // Debug info
    debugInfo?: DebugInfo;

    className?: string;
}

export const MuiDebugControls: React.FC<MuiDebugControlsProps> = ({
    enabled,
    onEnabledChange,
    showBorder,
    showCenter,
    showStats,
    onShowBorderChange,
    onShowCenterChange,
    onShowStatsChange,
    onResetCamera,
    debugInfo,
    className,
}) => {
    if (!enabled) {
        return null;
    }

    return (
        <DebugContainer className={className}>
            <CardContent sx={{ p: 2 }}>
                <Typography
                    variant="h6"
                    sx={{
                        mb: 2,
                        color: spaceColors.warning.main,
                        textAlign: 'center',
                        fontWeight: 'bold',
                        textShadow: `0 0 10px ${alpha(spaceColors.warning.main, 0.5)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                    }}
                >
                    <BugIcon />
                    Debug Controls
                </Typography>

                <ControlGroup>
                    <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, color: spaceColors.text.primary, fontWeight: 'bold' }}
                    >
                        Master Control
                    </Typography>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={enabled}
                                onChange={(e) => onEnabledChange(e.target.checked)}
                                color="warning"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BugIcon fontSize="small" />
                                Enable Debug Mode
                            </Box>
                        }
                        sx={{
                            width: '100%',
                            '& .MuiFormControlLabel-label': {
                                color: spaceColors.text.primary,
                            }
                        }}
                    />
                </ControlGroup>

                <ControlGroup>
                    <Typography
                        variant="subtitle2"
                        sx={{ mb: 1, color: spaceColors.text.primary, fontWeight: 'bold' }}
                    >
                        Visual Overlays
                    </Typography>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={showBorder}
                                onChange={(e) => onShowBorderChange(e.target.checked)}
                                color="warning"
                                size="small"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BorderIcon fontSize="small" />
                                Show Border
                            </Box>
                        }
                        sx={{
                            mb: 1,
                            width: '100%',
                            '& .MuiFormControlLabel-label': {
                                color: spaceColors.text.primary,
                                fontSize: '0.875rem',
                            }
                        }}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={showCenter}
                                onChange={(e) => onShowCenterChange(e.target.checked)}
                                color="warning"
                                size="small"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CenterIcon fontSize="small" />
                                Show Center
                            </Box>
                        }
                        sx={{
                            mb: 1,
                            width: '100%',
                            '& .MuiFormControlLabel-label': {
                                color: spaceColors.text.primary,
                                fontSize: '0.875rem',
                            }
                        }}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={showStats}
                                onChange={(e) => onShowStatsChange(e.target.checked)}
                                color="warning"
                                size="small"
                            />
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <StatsIcon fontSize="small" />
                                Show Stats
                            </Box>
                        }
                        sx={{
                            width: '100%',
                            '& .MuiFormControlLabel-label': {
                                color: spaceColors.text.primary,
                                fontSize: '0.875rem',
                            }
                        }}
                    />
                </ControlGroup>

                <ControlGroup>
                    <Typography
                        variant="subtitle2"
                        sx={{ mb: 2, color: spaceColors.text.primary, fontWeight: 'bold' }}
                    >
                        Camera Control
                    </Typography>

                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ResetIcon />}
                        onClick={onResetCamera}
                        fullWidth
                        sx={{
                            borderColor: spaceColors.warning.main,
                            color: spaceColors.warning.main,
                            '&:hover': {
                                borderColor: spaceColors.warning.light,
                                backgroundColor: alpha(spaceColors.warning.main, 0.1),
                            },
                        }}
                    >
                        Reset Camera
                    </Button>
                </ControlGroup>

                {debugInfo && (
                    <ControlGroup>
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 2, color: spaceColors.text.primary, fontWeight: 'bold' }}
                        >
                            System Information
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <InfoChip
                                label={`Camera: (${debugInfo.camera.x.toFixed(1)}, ${debugInfo.camera.y.toFixed(1)})`}
                                size="small"
                            />
                            <InfoChip
                                label={`Zoom: ${debugInfo.camera.zoom.toFixed(2)}x`}
                                size="small"
                            />
                            <InfoChip
                                label={`Screen: ${debugInfo.screenSize.width}×${debugInfo.screenSize.height}`}
                                size="small"
                            />
                            <InfoChip
                                label={`Canvas: ${debugInfo.canvasSize.width}×${debugInfo.canvasSize.height}`}
                                size="small"
                            />
                            <InfoChip
                                label={`Container: ${debugInfo.containerSize.width.toFixed(0)}×${debugInfo.containerSize.height.toFixed(0)}`}
                                size="small"
                            />
                            <InfoChip
                                label={`Resolution: ${debugInfo.resolution.toFixed(1)}x`}
                                size="small"
                            />
                            <InfoChip
                                label={`FPS: ${Math.round(debugInfo.fps)}`}
                                size="small"
                                sx={{
                                    backgroundColor: debugInfo.fps > 55
                                        ? alpha(spaceColors.success.main, 0.2)
                                        : debugInfo.fps > 30
                                            ? alpha(spaceColors.warning.main, 0.2)
                                            : alpha(spaceColors.error.main, 0.2),
                                }}
                            />
                        </Box>
                    </ControlGroup>
                )}

                <Divider sx={{ my: 2, borderColor: alpha(spaceColors.warning.main, 0.3) }} />

                <Typography
                    variant="caption"
                    sx={{
                        color: spaceColors.text.secondary,
                        fontSize: '0.75rem',
                        textAlign: 'center',
                        display: 'block',
                        fontStyle: 'italic',
                    }}
                >
                    Debug mode provides visual overlays and system information for development purposes.
                </Typography>
            </CardContent>
        </DebugContainer>
    );
};

export default MuiDebugControls;
