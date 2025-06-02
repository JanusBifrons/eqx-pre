import * as React from 'react';
import { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    ButtonBase,
    Collapse,
    IconButton,
    Tooltip,
    styled,
    alpha,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Build as BuildIcon,
    Speed as SpeedIcon,
    Security as SecurityIcon,
    Engineering as EngineeringIcon,
} from '@mui/icons-material';
import { BlockDefinitions } from '../../entities/BlockDefinitions';
import { BlockType } from '../../entities/Block';
import { spaceColors } from '../../theme';

interface BlockPaletteProps {
    onBlockSelect: (blockId: string) => void;
    selectedBlockType: string | null;
    className?: string;
}

const PaletteContainer = styled(Card)(() => ({
    position: 'absolute',
    left: 10,
    top: 10,
    width: 240,
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

const CategoryHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(0.5, 1),
    cursor: 'pointer',
    borderRadius: theme.shape.borderRadius,
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: alpha(spaceColors.primary.main, 0.1),
    },
}));

const BlockButton = styled(ButtonBase)<{ selected?: boolean }>(({ theme, selected }) => ({
    width: '100%',
    padding: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius,
    border: `2px solid ${selected ? spaceColors.primary.main : 'transparent'}`,
    backgroundColor: selected
        ? alpha(spaceColors.primary.main, 0.2)
        : alpha(spaceColors.background.surface, 0.8),
    marginBottom: theme.spacing(0.5),
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
        backgroundColor: alpha(spaceColors.primary.main, 0.15),
        border: `2px solid ${alpha(spaceColors.primary.main, 0.7)}`,
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 20px ${alpha(spaceColors.primary.main, 0.3)}`,
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: selected
            ? `linear-gradient(45deg, ${alpha(spaceColors.primary.main, 0.1)}, ${alpha(spaceColors.primary.light, 0.1)})`
            : 'none',
        pointerEvents: 'none',
    },
}));

const BlockPreview = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'blockColor' && prop !== 'shape',
})<{ blockColor: string; shape?: string }>(({ blockColor, shape }) => ({
    width: 32,
    height: 32,
    border: `2px solid ${blockColor}`,
    borderRadius: shape === 'circle' ? '50%' : '8px',
    backgroundColor: alpha(blockColor, 0.3),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    boxShadow: `0 0 10px ${alpha(blockColor, 0.5)}`,
    transition: 'all 0.3s ease',
}));

const BlockInfo = styled(Box)(() => ({
    flex: 1,
    textAlign: 'left',
}));

const StatChip = styled(Chip)(({ theme }) => ({
    margin: theme.spacing(0.25),
    fontSize: '0.7rem',
    height: 20,
}));

export const MuiBlockPalette: React.FC<BlockPaletteProps> = ({
    onBlockSelect,
    selectedBlockType,
    className,
}) => {
    const [expandedCategories, setExpandedCategories] = useState<Set<BlockType>>(
        new Set() // Start with all categories collapsed
    );

    const categories = [
        {
            type: BlockType.HULL,
            label: 'Hull Blocks',
            icon: <SecurityIcon />,
            color: spaceColors.info.main,
        },
        {
            type: BlockType.ENGINE,
            label: 'Engines',
            icon: <SpeedIcon />,
            color: spaceColors.warning.main,
        },
        {
            type: BlockType.WEAPON,
            label: 'Weapons',
            icon: <BuildIcon />,
            color: spaceColors.error.main,
        },
        {
            type: BlockType.UTILITY,
            label: 'Utilities',
            icon: <EngineeringIcon />,
            color: spaceColors.success.main,
        },
    ];

    const toggleCategory = (categoryType: BlockType) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryType)) {
            newExpanded.delete(categoryType);
        } else {
            newExpanded.add(categoryType);
        }
        setExpandedCategories(newExpanded);
    }; const getCategoryIcon = (categoryType: BlockType) => {
        const category = categories.find(c => c.type === categoryType);
        return category?.icon || <BuildIcon />;
    };

    const formatBlockName = (blockId: string) => {
        return blockId
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (<PaletteContainer className={className}>
        <CardContent sx={{ p: 1 }}>
            <Typography
                variant="h6"
                sx={{
                    mb: 1,
                    color: spaceColors.primary.main,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    textShadow: `0 0 10px ${alpha(spaceColors.primary.main, 0.5)}`,
                    fontSize: '1rem',
                }}
            >
                🛠️ Block Palette
            </Typography>

            {categories.map((category) => {
                const isExpanded = expandedCategories.has(category.type);
                const blocksOfType = BlockDefinitions.getByType(category.type);

                return (<Box key={category.type} sx={{ mb: 0.5 }}>
                    <CategoryHeader onClick={() => toggleCategory(category.type)}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ color: category.color }}>
                                {category.icon}
                            </Box>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 600,
                                    color: spaceColors.text.primary,
                                }}
                            >
                                {category.label}
                            </Typography>
                            <Chip
                                label={blocksOfType.length}
                                size="small"
                                sx={{
                                    backgroundColor: alpha(category.color, 0.2),
                                    color: category.color,
                                    border: `1px solid ${alpha(category.color, 0.5)}`,
                                    fontWeight: 'bold',
                                }}
                            />
                        </Box>
                        <IconButton size="small" sx={{ color: spaceColors.text.secondary }}>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </CategoryHeader>                            <Collapse in={isExpanded} timeout={300}>
                        <Box sx={{ mt: 0.5, pl: 0.5 }}>
                            {blocksOfType.map(({ id, definition }) => (
                                <Tooltip
                                    key={id}
                                    title={
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                {formatBlockName(id)}
                                            </Typography>                                                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                                {formatBlockName(id)} block for ship construction
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                <Chip label={`Mass: ${definition.mass}`} size="small" />
                                                <Chip label={`HP: ${definition.maxHealth}`} size="small" />
                                                {(() => {
                                                    const properties = BlockDefinitions.getDefaultProperties(id);
                                                    const chips = [];
                                                    if (properties.thrust) {
                                                        chips.push(<Chip key="thrust" label={`Thrust: ${properties.thrust}`} size="small" />);
                                                    }
                                                    if (properties.damage) {
                                                        chips.push(<Chip key="damage" label={`Damage: ${properties.damage}`} size="small" />);
                                                    }
                                                    if (properties.armor) {
                                                        chips.push(<Chip key="armor" label={`Armor: ${properties.armor}`} size="small" />);
                                                    }
                                                    return chips;
                                                })()}
                                            </Box>
                                        </Box>
                                    }
                                    placement="right"
                                    arrow
                                >
                                    <BlockButton
                                        selected={selectedBlockType === id}
                                        onClick={() => onBlockSelect(id)}
                                    >                                                <BlockPreview
                                        blockColor={`#${definition.color.toString(16).padStart(6, '0')}`}
                                        shape={definition.shape}
                                    >
                                            <Box sx={{ color: `#${definition.color.toString(16).padStart(6, '0')}`, opacity: 0.8 }}>
                                                {getCategoryIcon(category.type)}
                                            </Box>
                                        </BlockPreview>

                                        <BlockInfo>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: spaceColors.text.primary,
                                                    mb: 0.5,
                                                }}
                                            >
                                                {formatBlockName(id)}
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
                                                <StatChip
                                                    label={`${definition.mass}kg`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ color: spaceColors.info.main }}
                                                />
                                                <StatChip
                                                    label={`${definition.maxHealth}HP`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ color: spaceColors.success.main }}
                                                />
                                            </Box>
                                        </BlockInfo>
                                    </BlockButton>
                                </Tooltip>
                            ))}
                        </Box>
                    </Collapse>
                </Box>
                );
            })}
        </CardContent>
    </PaletteContainer>
    );
};

export default MuiBlockPalette;
