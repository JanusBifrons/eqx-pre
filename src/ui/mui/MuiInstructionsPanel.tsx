import React, { useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Collapse,
    IconButton,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    styled,
    alpha,
} from '@mui/material';
import {
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon, Mouse as MouseIcon,
    TouchApp as ClickIcon,
    PanTool as DragIcon,
    ZoomIn as ZoomIcon,
    Build as BuildIcon,
    Info as InfoIcon,
    SportsEsports as GamepadIcon,
} from '@mui/icons-material';
import { spaceColors } from '../../theme';

interface InstructionsPanelProps {
    className?: string;
}

const InstructionsContainer = styled(Card)(() => ({
    position: 'fixed',
    bottom: 20,
    left: 20,
    width: 320,
    maxHeight: 400,
    backgroundColor: alpha(spaceColors.background.paper, 0.95),
    backdropFilter: 'blur(10px)',
    border: `2px solid ${alpha(spaceColors.primary.main, 0.3)}`,
    borderRadius: '12px',
    zIndex: 1000,
    overflow: 'hidden',
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

const ContentBox = styled(Box)(() => ({
    maxHeight: 320,
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
        width: 6,
    },
    '&::-webkit-scrollbar-track': {
        backgroundColor: alpha(spaceColors.background.surface, 0.5),
        borderRadius: 3,
    },
    '&::-webkit-scrollbar-thumb': {
        backgroundColor: alpha(spaceColors.primary.main, 0.6),
        borderRadius: 3,
        '&:hover': {
            backgroundColor: alpha(spaceColors.primary.main, 0.8),
        },
    },
}));

const InstructionChip = styled(Chip)(() => ({
    backgroundColor: alpha(spaceColors.info.main, 0.2),
    border: `1px solid ${alpha(spaceColors.info.main, 0.4)}`,
    color: spaceColors.info.main,
    fontSize: '0.75rem',
    height: 24,
    marginBottom: 8,
    '& .MuiChip-icon': {
        color: spaceColors.info.main,
    },
}));

const instructionSections = [
    {
        title: 'Camera Controls',
        icon: <MouseIcon />,
        color: spaceColors.info.main,
        instructions: [
            { icon: <DragIcon />, text: 'Click and drag to pan around the build area' },
            { icon: <ZoomIcon />, text: 'Mouse wheel to zoom in/out' },
            { icon: <ClickIcon />, text: 'Double-click to center view on ship' },
        ],
    },
    {
        title: 'Building',
        icon: <BuildIcon />,
        color: spaceColors.success.main,
        instructions: [
            { icon: <ClickIcon />, text: 'Left-click to select a block type from palette' },
            { icon: <ClickIcon />, text: 'Left-click on grid to place selected block' },
            { icon: <ClickIcon />, text: 'Right-click to deselect current block type' },
            { icon: <ClickIcon />, text: 'Right-click on placed block to remove it' },
        ],
    },
    {
        title: 'Ship Design',
        icon: <InfoIcon />,
        color: spaceColors.warning.main,
        instructions: [
            { icon: <BuildIcon />, text: 'All blocks must be connected for a valid ship' },
            { icon: <BuildIcon />, text: 'Ships need at least one hull and one engine' },
            { icon: <BuildIcon />, text: 'Use "Repair" button to auto-connect isolated blocks' },
            { icon: <GamepadIcon />, text: 'Test valid ships with the "Test Ship" button' },
        ],
    },
];

export const MuiInstructionsPanel: React.FC<InstructionsPanelProps> = ({ className }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <InstructionsContainer className={className}>
            <HeaderBox onClick={toggleExpanded}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon sx={{ color: spaceColors.primary.main }} />
                    <Typography
                        variant="h6"
                        sx={{
                            color: spaceColors.primary.main,
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                        }}
                    >
                        🚀 Ship Builder Guide
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
                    {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>
            </HeaderBox>

            <Collapse in={isExpanded}>
                <ContentBox>
                    <CardContent sx={{ p: 2 }}>
                        {/* Quick Tips */}
                        <Box sx={{ mb: 2 }}>
                            <InstructionChip
                                icon={<InfoIcon />}
                                label="Tip: Start with a hull block, then add engines and weapons"
                                size="small"
                            />
                        </Box>

                        {instructionSections.map((section, sectionIndex) => (
                            <Box key={sectionIndex}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Box sx={{ color: section.color, display: 'flex', alignItems: 'center' }}>
                                        {section.icon}
                                    </Box>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            color: spaceColors.text.primary,
                                            fontWeight: 'bold',
                                            fontSize: '0.95rem',
                                        }}
                                    >
                                        {section.title}
                                    </Typography>
                                </Box>

                                <List dense sx={{ py: 0 }}>
                                    {section.instructions.map((instruction, index) => (
                                        <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <Box sx={{
                                                    color: alpha(section.color, 0.7),
                                                    display: 'flex',
                                                    fontSize: '1rem',
                                                }}>
                                                    {instruction.icon}
                                                </Box>
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={instruction.text}
                                                primaryTypographyProps={{
                                                    fontSize: '0.85rem',
                                                    color: spaceColors.text.secondary,
                                                    lineHeight: 1.3,
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                                </List>

                                {sectionIndex < instructionSections.length - 1 && (
                                    <Divider
                                        sx={{
                                            my: 1.5,
                                            borderColor: alpha(spaceColors.primary.main, 0.2),
                                        }}
                                    />
                                )}
                            </Box>
                        ))}

                        {/* Additional Tips */}
                        <Box sx={{ mt: 2, pt: 1, borderTop: `1px solid ${alpha(spaceColors.primary.main, 0.2)}` }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: spaceColors.text.disabled,
                                    fontSize: '0.75rem',
                                    fontStyle: 'italic',
                                    display: 'block',
                                    textAlign: 'center',
                                }}
                            >
                                💡 Watch the stats panel to monitor your ship's performance
                            </Typography>
                        </Box>
                    </CardContent>
                </ContentBox>
            </Collapse>
        </InstructionsContainer>
    );
};

export default MuiInstructionsPanel;
