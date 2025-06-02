import * as React from 'react';
import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    LinearProgress,
    Chip,
    Divider,
    IconButton,
    Collapse,
    styled,
    alpha,
} from '@mui/material';
import {
    Speed as SpeedIcon,
    FitnessCenter as MassIcon,
    Security as ArmorIcon,
    FlashOn as PowerIcon,
    Build as BuildIcon,
    Visibility as VisibilityIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    Assessment as StatsIcon,
} from '@mui/icons-material';
import { Ship } from '../../entities/Ship';
import { spaceColors } from '../../theme';

interface StatsDisplayProps {
    ship: Ship;
    className?: string;
}

const StatsContainer = styled(Card)(() => ({
    position: 'absolute',
    right: 10,
    top: 10,
    width: 320,
    maxWidth: 'calc(100% - 20px)', // Use relative sizing
    maxHeight: 'calc(100% - 20px)', // Use relative sizing
    overflowY: 'auto',
    backgroundColor: alpha(spaceColors.background.paper, 0.95), backdropFilter: 'blur(10px)',
    border: `2px solid ${alpha(spaceColors.primary.main, 0.3)}`,
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
        backgroundColor: alpha(spaceColors.primary.main, 0.6),
        borderRadius: 4,
        '&:hover': {
            backgroundColor: alpha(spaceColors.primary.main, 0.8),
        },
    },
}));

const HeaderBox = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: alpha(spaceColors.primary.main, 0.1),
    borderBottom: `1px solid ${alpha(spaceColors.primary.main, 0.2)}`,
    cursor: 'pointer',
    '&:hover': {
        backgroundColor: alpha(spaceColors.primary.main, 0.15),
    },
    transition: 'background-color 0.2s ease',
}));

const StatRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(1, 0),
    '&:not(:last-child)': {
        borderBottom: `1px solid ${alpha(spaceColors.primary.main, 0.2)}`,
    },
}));

const StatIcon = styled(Box)<{ color?: string }>(({ color = spaceColors.primary.main }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: alpha(color, 0.2),
    border: `1px solid ${alpha(color, 0.5)}`,
    color,
    marginRight: 12,
}));

const ProgressBar = styled(LinearProgress, {
    shouldForwardProp: (prop) => prop !== 'barColor',
})<{ barColor?: string }>(({ barColor = spaceColors.primary.main }) => ({
    height: 8,
    borderRadius: 4,
    backgroundColor: alpha(barColor, 0.2),
    '& .MuiLinearProgress-bar': {
        backgroundColor: barColor,
        borderRadius: 4,
    },
}));

const StatValue = styled(Typography)(() => ({
    fontWeight: 'bold',
    fontSize: '1rem',
    color: spaceColors.text.primary,
    textShadow: `0 0 5px ${alpha(spaceColors.primary.main, 0.3)}`,
}));

const StatLabel = styled(Typography)(() => ({
    fontSize: '0.875rem',
    color: spaceColors.text.secondary,
    fontWeight: 500,
}));

export const MuiStatsPanel: React.FC<StatsDisplayProps> = ({
    ship,
    className
}) => {
    const [isCollapsed, setIsCollapsed] = useState(true);

    const toggleCollapsed = () => {
        setIsCollapsed(!isCollapsed);
    };

    const stats = ship.calculateStats();
    const blockCount = ship.blocks.size;

    // Calculate derived stats
    const thrustToWeightRatio = stats.totalMass > 0 ? stats.totalThrust / stats.totalMass : 0;
    const armorEfficiency = stats.totalArmor / Math.max(blockCount, 1);
    const weaponDensity = stats.totalWeapons / Math.max(blockCount, 1);

    const statItems = [
        {
            label: 'Total Mass',
            value: `${stats.totalMass.toFixed(1)} kg`,
            icon: <MassIcon />,
            color: spaceColors.info.main,
            progress: Math.min(stats.totalMass / 1000, 1), // Normalize to 1000kg max
        },
        {
            label: 'Thrust Power',
            value: `${stats.totalThrust.toFixed(1)} N`,
            icon: <SpeedIcon />,
            color: spaceColors.warning.main,
            progress: Math.min(stats.totalThrust / 500, 1), // Normalize to 500N max
        },
        {
            label: 'Armor Rating',
            value: `${stats.totalArmor.toFixed(1)}`,
            icon: <ArmorIcon />,
            color: spaceColors.success.main,
            progress: Math.min(stats.totalArmor / 100, 1), // Normalize to 100 armor max
        },
        {
            label: 'Weapon Count',
            value: `${stats.totalWeapons}`,
            icon: <PowerIcon />,
            color: spaceColors.error.main,
            progress: Math.min(stats.totalWeapons / 10, 1), // Normalize to 10 weapons max
        },
    ];
    const derivedStats = [
        {
            label: 'T/W Ratio',
            value: thrustToWeightRatio.toFixed(2),
            description: 'Thrust to Weight Ratio',
            color: thrustToWeightRatio > 0.5 ? spaceColors.success.main : spaceColors.warning.main,
        },
        {
            label: 'Armor Efficiency',
            value: armorEfficiency.toFixed(1),
            description: 'Average armor per block',
            color: armorEfficiency > 5 ? spaceColors.success.main : spaceColors.info.main,
        },
        {
            label: 'Weapon Density',
            value: weaponDensity.toFixed(1),
            description: 'Average weapons per block',
            color: weaponDensity > 0.2 ? spaceColors.error.main : spaceColors.warning.main,
        },
    ];

    return (
        <StatsContainer className={className}>
            <HeaderBox onClick={toggleCollapsed}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StatsIcon sx={{ color: spaceColors.primary.main }} />
                    <Typography
                        variant="h6"
                        sx={{
                            color: spaceColors.primary.main,
                            fontWeight: 'bold',
                            fontSize: '1rem',
                        }}
                    >
                        📊 Ship Statistics
                    </Typography>
                </Box>

                <IconButton
                    size="small"
                    sx={{
                        color: spaceColors.primary.main,
                        '&:hover': {
                            backgroundColor: alpha(spaceColors.primary.main, 0.2),
                        },
                    }}
                >
                    {isCollapsed ? <ExpandIcon /> : <CollapseIcon />}
                </IconButton>
            </HeaderBox>            <Collapse in={!isCollapsed}>
                <CardContent sx={{ p: 2 }}>
                    {/* Block Count */}
                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                        <Chip
                            icon={<BuildIcon />}
                            label={`${blockCount} Blocks`}
                            variant="outlined"
                            sx={{
                                backgroundColor: alpha(spaceColors.primary.main, 0.1),
                                borderColor: spaceColors.primary.main,
                                color: spaceColors.primary.main,
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                            }}
                        />
                    </Box>

                    <Divider sx={{ mb: 2, borderColor: alpha(spaceColors.primary.main, 0.3) }} />

                    {/* Main Stats */}
                    <Typography
                        variant="subtitle1"
                        sx={{
                            mb: 1,
                            color: spaceColors.text.primary,
                            fontWeight: 'bold',
                        }}
                    >
                        Core Statistics
                    </Typography>                {statItems.map((stat, index) => (
                        <StatRow key={index}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                <StatIcon color={stat.color}>
                                    {stat.icon}
                                </StatIcon>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <StatLabel>{stat.label}</StatLabel>
                                        <StatValue>{stat.value}</StatValue>
                                    </Box>
                                    <ProgressBar
                                        variant="determinate"
                                        value={stat.progress * 100}
                                        barColor={stat.color}
                                    />
                                </Box>
                            </Box>
                        </StatRow>
                    ))}

                    <Divider sx={{ my: 2, borderColor: alpha(spaceColors.primary.main, 0.3) }} />

                    {/* Derived Stats */}
                    <Typography
                        variant="subtitle1"
                        sx={{
                            mb: 1,
                            color: spaceColors.text.primary,
                            fontWeight: 'bold',
                        }}
                    >
                        Performance Metrics
                    </Typography>        <Box sx={{ display: 'flex', gap: 1 }}>
                        {derivedStats.map((stat, index) => (
                            <Box key={index} sx={{ flex: 1 }}>
                                <Box
                                    sx={{
                                        textAlign: 'center',
                                        p: 1,
                                        backgroundColor: alpha(stat.color, 0.1),
                                        border: `1px solid ${alpha(stat.color, 0.3)}`,
                                        borderRadius: 2,
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: stat.color,
                                            fontWeight: 'bold',
                                            fontSize: '1.2rem',
                                        }}
                                    >
                                        {stat.value}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: spaceColors.text.secondary,
                                            fontSize: '0.7rem',
                                            display: 'block',
                                        }}
                                    >
                                        {stat.label}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {/* Ship Status */}
                    <Divider sx={{ my: 2, borderColor: alpha(spaceColors.primary.main, 0.3) }} />

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                mb: 1,
                                color: spaceColors.text.primary,
                            }}
                        >
                            Ship Status
                        </Typography>
                        <Chip
                            icon={<VisibilityIcon />}
                            label={blockCount > 0 ? 'Ship Constructed' : 'No Blocks Placed'}
                            color={blockCount > 0 ? 'success' : 'warning'}
                            variant="filled"
                            sx={{
                                fontWeight: 'bold',
                                boxShadow: `0 0 10px ${alpha(
                                    blockCount > 0 ? spaceColors.success.main : spaceColors.warning.main,
                                    0.3
                                )}`,
                            }} />
                    </Box>
                </CardContent>
            </Collapse>
        </StatsContainer>
    );
};

export default MuiStatsPanel;
