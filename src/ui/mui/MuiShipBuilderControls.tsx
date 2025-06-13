import React, { useState } from 'react';
import {
    Box,
    Card,
    Typography,
    Tab,
    Tabs,
    Switch,
    FormControlLabel,
    Button,
    styled,
    alpha,
    IconButton,
    Collapse,
    Tooltip,
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Visibility as VisibilityIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    CenterFocusStrong as CenterIcon,
    Grid3x3 as GridIcon,
    Link as ConnectionIcon,
    KeyboardArrowDown as ExpandIcon,
} from '@mui/icons-material';
import { spaceColors } from '../../theme';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`ship-builder-tabpanel-${index}`}
            aria-labelledby={`ship-builder-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 2 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const ControlsContainer = styled(Card)<{ collapsed?: boolean }>(({ collapsed }) => ({
    position: 'absolute',
    bottom: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 400,
    maxWidth: 'calc(100% - 20px)', // Use relative sizing
    maxHeight: collapsed ? '56px' : 'calc(100% - 20px)', // Height when collapsed or expanded
    overflowY: 'auto',
    overflowX: 'hidden',
    backgroundColor: alpha(spaceColors.background.paper, 0.95),
    backdropFilter: 'blur(10px)',
    border: `2px solid ${alpha(spaceColors.primary.main, 0.3)}`,
    borderRadius: '12px',
    zIndex: 10,
    transition: 'max-height 0.3s ease-in-out',
    '&::-webkit-scrollbar': {
        width: 8,
    },
    '&::-webkit-scrollbar-track': {
        backgroundColor: alpha(spaceColors.background.surface, 0.5),
        borderRadius: 4,
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: alpha(spaceColors.primary.main, 0.6),
        borderRadius: 4,
        '&:hover': {
            backgroundColor: alpha(spaceColors.primary.main, 0.8),
        },
    },
}));

const StyledTabs = styled(Tabs)(() => ({
    borderBottom: `1px solid ${alpha(spaceColors.primary.main, 0.3)}`,
    '& .MuiTabs-indicator': {
        backgroundColor: spaceColors.primary.main,
        height: 3,
    },
}));

const StyledTab = styled(Tab)<{ collapsed?: boolean }>(({ collapsed }) => ({
    color: spaceColors.text.secondary,
    fontWeight: 'bold',
    minHeight: collapsed ? '48px' : '48px',
    '& .MuiTab-iconWrapper': {
        marginBottom: collapsed ? '0' : '8px',
    },
    '& .MuiTab-labelIcon': {
        flexDirection: collapsed ? 'row' : 'column',
    },
    '&.Mui-selected': {
        color: spaceColors.primary.main,
    },
    '&:hover': {
        color: spaceColors.primary.light,
    },
}));

const ControlGroup = styled(Box)(() => ({
    marginBottom: 16,
    padding: 12,
    backgroundColor: alpha(spaceColors.background.surface, 0.3),
    borderRadius: 8,
    border: `1px solid ${alpha(spaceColors.primary.main, 0.2)}`,
}));

interface ShipBuilderControlsProps {
    // View Controls
    showGrid: boolean;
    showConnectionPoints: boolean;
    snapToGrid: boolean;
    onShowGridChange: (show: boolean) => void;
    onShowConnectionPointsChange: (show: boolean) => void;
    onSnapToGridChange: (snap: boolean) => void;

    // Camera Controls - zoom is now enabled
    currentZoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onCenterView: () => void;
    onResetCamera: () => void;

    // Debug Controls
    enableDebugVisualization: boolean;
    onDebugVisualizationChange: (enabled: boolean) => void;

    // Extended Debug Props (optional)
    debugInfo?: {
        camera: { x: number; y: number; zoom: number; rotation: number };
        screenSize: { width: number; height: number };
        canvasSize: { width: number; height: number };
        containerSize: { width: number; height: number };
        resolution: number;
        fps: number;
    };
    showDebugBorder?: boolean;
    showDebugCenter?: boolean;
    showDebugStats?: boolean;
    onShowDebugBorderChange?: (show: boolean) => void;
    onShowDebugCenterChange?: (show: boolean) => void;
    onShowDebugStatsChange?: (show: boolean) => void;

    // Other controls can be added here as needed
    className?: string;
}

export const MuiShipBuilderControls: React.FC<ShipBuilderControlsProps> = ({
    showGrid,
    showConnectionPoints,
    snapToGrid,
    onShowGridChange, onShowConnectionPointsChange,
    onSnapToGridChange,
    currentZoom,
    onZoomIn,
    onZoomOut,
    onCenterView,
    onResetCamera,
    enableDebugVisualization,
    onDebugVisualizationChange,
    debugInfo,
    showDebugBorder,
    showDebugCenter,
    showDebugStats,
    onShowDebugBorderChange,
    onShowDebugCenterChange,
    onShowDebugStatsChange,
    className,
}) => {
    const [activeTab, setActiveTab] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(true); const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        // Expand panel when changing tabs
        if (isCollapsed) {
            setIsCollapsed(false);
        }
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    }; return (
        <ControlsContainer className={className} collapsed={isCollapsed}>            <Box sx={{ position: 'relative' }}>            <StyledTabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            aria-label="ship builder controls tabs"
        >
            <StyledTab
                icon={<SettingsIcon />}
                label={isCollapsed ? "" : "View"}
                id="ship-builder-tab-0"
                aria-controls="ship-builder-tabpanel-0"
                collapsed={isCollapsed}
            />
            <StyledTab
                icon={<ZoomInIcon />}
                label={isCollapsed ? "" : "Camera"}
                id="ship-builder-tab-1"
                aria-controls="ship-builder-tabpanel-1"
                collapsed={isCollapsed}
            />
            <StyledTab
                icon={<VisibilityIcon />}
                label={isCollapsed ? "" : "Debug"}
                id="ship-builder-tab-2"
                aria-controls="ship-builder-tabpanel-2"
                collapsed={isCollapsed}
            />
        </StyledTabs>            {/* Collapsed indicator text */}
            {isCollapsed && (
                <Typography
                    variant="caption"
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: spaceColors.primary.main,
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        opacity: 0.7,
                        display: { xs: 'none', sm: 'block' }, // Hide on very small screens
                        whiteSpace: 'nowrap',
                        fontSize: '0.7rem',
                        textShadow: `0 0 4px ${alpha(spaceColors.background.paper, 0.8)}`
                    }}
                >
                    {activeTab === 0 ? 'View Settings' : activeTab === 1 ? 'Camera Controls' : 'Debug Tools'}
                </Typography>
            )}{/* Collapse/Expand Button */}
            <Tooltip title={isCollapsed ? "Expand panel" : "Collapse panel"} arrow>
                <IconButton
                    onClick={toggleCollapse}
                    size="small"
                    sx={{
                        position: 'absolute',
                        right: 4,
                        top: 7,
                        color: spaceColors.text.secondary,
                        '&:hover': {
                            color: spaceColors.primary.main,
                            backgroundColor: alpha(spaceColors.primary.main, 0.1),
                        },
                        transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                    }}
                    aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
                >
                    <ExpandIcon />
                </IconButton>
            </Tooltip>
        </Box>

            <Collapse in={!isCollapsed} timeout={300}>
                <TabPanel value={activeTab} index={0}>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 2,
                            color: spaceColors.primary.main,
                            textAlign: 'center',
                            fontWeight: 'bold',
                            textShadow: `0 0 10px ${alpha(spaceColors.primary.main, 0.5)}`,
                        }}
                    >
                        ⚙️ View Settings
                    </Typography>

                    <ControlGroup>
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, color: spaceColors.text.primary, fontWeight: 'bold' }}
                        >
                            Grid & Snap
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showGrid}
                                    onChange={(e) => onShowGridChange(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <GridIcon fontSize="small" />
                                    Show Grid
                                </Box>
                            }
                            sx={{
                                mb: 1,
                                width: '100%',
                                '& .MuiFormControlLabel-label': {
                                    color: spaceColors.text.primary,
                                }
                            }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={snapToGrid}
                                    onChange={(e) => onSnapToGridChange(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Snap to Grid"
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
                            Block Visualization
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={showConnectionPoints}
                                    onChange={(e) => onShowConnectionPointsChange(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ConnectionIcon fontSize="small" />
                                    Show Connection Points
                                </Box>
                            }
                            sx={{
                                mb: 1,
                                width: '100%',
                                '& .MuiFormControlLabel-label': {
                                    color: spaceColors.text.primary,
                                }
                            }}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={enableDebugVisualization}
                                    onChange={(e) => onDebugVisualizationChange(e.target.checked)}
                                    color="warning"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <VisibilityIcon fontSize="small" />
                                    Debug Visualization
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
                </TabPanel>

                <TabPanel value={activeTab} index={1}>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 2,
                            color: spaceColors.primary.main,
                            textAlign: 'center',
                            fontWeight: 'bold',
                            textShadow: `0 0 10px ${alpha(spaceColors.primary.main, 0.5)}`,
                        }}
                    >
                        📷 Camera Controls
                    </Typography>                    <ControlGroup>
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 2, color: spaceColors.text.primary, fontWeight: 'bold' }}
                        >
                            Zoom Level: {currentZoom.toFixed(1)}x
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                mb: 2,
                                color: spaceColors.text.secondary,
                                fontStyle: 'italic',
                                textAlign: 'center'
                            }}
                        >
                            Use mouse wheel or buttons to zoom in/out
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ZoomOutIcon />}
                                onClick={onZoomOut}
                                disabled={currentZoom <= 0.1}
                                sx={{
                                    flex: 1,
                                    borderColor: currentZoom <= 0.1 ? alpha(spaceColors.primary.main, 0.3) : spaceColors.primary.main,
                                    color: currentZoom <= 0.1 ? alpha(spaceColors.primary.main, 0.3) : spaceColors.primary.main,
                                    '&:hover': currentZoom > 0.1 ? {
                                        borderColor: spaceColors.primary.light,
                                        backgroundColor: alpha(spaceColors.primary.main, 0.1),
                                    } : {},
                                }}
                            >
                                Zoom Out
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<ZoomInIcon />}
                                onClick={onZoomIn}
                                disabled={currentZoom >= 5.0}
                                sx={{
                                    flex: 1,
                                    borderColor: currentZoom >= 5.0 ? alpha(spaceColors.primary.main, 0.3) : spaceColors.primary.main,
                                    color: currentZoom >= 5.0 ? alpha(spaceColors.primary.main, 0.3) : spaceColors.primary.main,
                                    '&:hover': currentZoom < 5.0 ? {
                                        borderColor: spaceColors.primary.light,
                                        backgroundColor: alpha(spaceColors.primary.main, 0.1),
                                    } : {},
                                }}
                            >
                                Zoom In
                            </Button>
                        </Box>
                    </ControlGroup>

                    <ControlGroup>
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 2, color: spaceColors.text.primary, fontWeight: 'bold' }}
                        >
                            Camera Position
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<CenterIcon />}
                                onClick={onCenterView}
                                sx={{
                                    flex: 1,
                                    borderColor: spaceColors.success.main,
                                    color: spaceColors.success.main,
                                    '&:hover': {
                                        borderColor: spaceColors.success.light,
                                        backgroundColor: alpha(spaceColors.success.main, 0.1),
                                    },
                                }}
                            >
                                Center View
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={onResetCamera}
                                sx={{
                                    flex: 1,
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
                        </Box>                </ControlGroup>
                </TabPanel>

                <TabPanel value={activeTab} index={2}>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 2,
                            color: spaceColors.warning.main,
                            textAlign: 'center',
                            fontWeight: 'bold',
                            textShadow: `0 0 10px ${alpha(spaceColors.warning.main, 0.5)}`,
                        }}
                    >
                        🐛 Debug Tools
                    </Typography>

                    <ControlGroup>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={enableDebugVisualization}
                                    onChange={(e) => onDebugVisualizationChange(e.target.checked)}
                                    color="warning"
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <VisibilityIcon fontSize="small" />
                                    Enable Debug Mode
                                </Box>
                            }
                            sx={{
                                mb: 1,
                                width: '100%',
                                '& .MuiFormControlLabel-label': {
                                    color: spaceColors.text.primary,
                                }
                            }}
                        />

                        {enableDebugVisualization && (
                            <>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={showDebugBorder || false}
                                            onChange={(e) => onShowDebugBorderChange?.(e.target.checked)}
                                            color="warning"
                                            size="small"
                                        />
                                    }
                                    label="Show Borders"
                                    sx={{
                                        mb: 1,
                                        width: '100%',
                                        '& .MuiFormControlLabel-label': {
                                            color: spaceColors.text.secondary,
                                            fontSize: '0.875rem',
                                        }
                                    }}
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={showDebugCenter || false}
                                            onChange={(e) => onShowDebugCenterChange?.(e.target.checked)}
                                            color="warning"
                                            size="small"
                                        />
                                    }
                                    label="Show Centers"
                                    sx={{
                                        mb: 1,
                                        width: '100%',
                                        '& .MuiFormControlLabel-label': {
                                            color: spaceColors.text.secondary,
                                            fontSize: '0.875rem',
                                        }
                                    }}
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={showDebugStats || false}
                                            onChange={(e) => onShowDebugStatsChange?.(e.target.checked)}
                                            color="warning"
                                            size="small"
                                        />
                                    }
                                    label="Show Stats"
                                    sx={{
                                        mb: 1,
                                        width: '100%',
                                        '& .MuiFormControlLabel-label': {
                                            color: spaceColors.text.secondary,
                                            fontSize: '0.875rem',
                                        }
                                    }}
                                />

                                {(showDebugStats && debugInfo) && (
                                    <Box sx={{ mt: 2, p: 1, backgroundColor: alpha(spaceColors.background.surface, 0.5), borderRadius: 1 }}>
                                        <Typography variant="caption" sx={{ color: spaceColors.text.secondary }}>
                                            System Info
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: spaceColors.text.primary, fontSize: '0.75rem' }}>
                                            FPS: {Math.round(debugInfo.fps)} | Zoom: {debugInfo.camera.zoom.toFixed(1)}x<br />
                                            Canvas: {debugInfo.canvasSize.width}×{debugInfo.canvasSize.height}
                                        </Typography>
                                    </Box>
                                )}                        </>
                        )}
                    </ControlGroup>
                </TabPanel>
            </Collapse>
        </ControlsContainer>
    );
};

export default MuiShipBuilderControls;
