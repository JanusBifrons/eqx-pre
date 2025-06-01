import { createTheme, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Space-themed color palette
const spaceColors = {
    primary: {
        main: '#00AAFF',      // Electric blue
        light: '#33BBFF',     // Lighter blue
        dark: '#0088CC',      // Darker blue
        contrastText: '#FFFFFF',
    },
    secondary: {
        main: '#FF6600',      // Orange
        light: '#FF8833',     // Lighter orange
        dark: '#CC4400',      // Darker orange
        contrastText: '#FFFFFF',
    },
    error: {
        main: '#FF3333',      // Red
        light: '#FF6666',     // Lighter red
        dark: '#CC0000',      // Darker red
        contrastText: '#FFFFFF',
    },
    warning: {
        main: '#FFAA00',      // Amber
        light: '#FFCC44',     // Lighter amber
        dark: '#CC8800',      // Darker amber
        contrastText: '#000000',
    },
    success: {
        main: '#44FF44',      // Green
        light: '#66FF66',     // Lighter green
        dark: '#00CC00',      // Darker green
        contrastText: '#000000',
    },
    info: {
        main: '#00DDFF',      // Cyan
        light: '#33EEFF',     // Lighter cyan
        dark: '#00AACC',      // Darker cyan
        contrastText: '#000000',
    },
    background: {
        default: '#0A0A0A',   // Very dark background
        paper: '#1A1A1A',     // Dark paper
        surface: '#222222',   // Surface color
    },
    text: {
        primary: '#FFFFFF',   // White text
        secondary: '#CCCCCC', // Light gray text
        disabled: '#666666',  // Dark gray text
    },
    divider: alpha('#FFFFFF', 0.12),
    action: {
        active: '#FFFFFF',
        hover: alpha('#FFFFFF', 0.08),
        selected: alpha('#00AAFF', 0.12),
        disabled: alpha('#FFFFFF', 0.26),
        disabledBackground: alpha('#FFFFFF', 0.12),
    },
};

// Create the base theme
const createSpaceTheme = (): Theme => {
    return createTheme({
        palette: {
            mode: 'dark',
            ...spaceColors,
        },
        typography: {
            fontFamily: [
                'Orbitron',
                'Roboto',
                'Arial',
                'sans-serif',
            ].join(','),
            h1: {
                fontWeight: 700,
                fontSize: '2.5rem',
                color: spaceColors.primary.main,
                textShadow: `0 0 10px ${alpha(spaceColors.primary.main, 0.5)}`,
            },
            h2: {
                fontWeight: 600,
                fontSize: '2rem',
                color: spaceColors.primary.main,
            },
            h3: {
                fontWeight: 600,
                fontSize: '1.75rem',
                color: spaceColors.text.primary,
            },
            h4: {
                fontWeight: 500,
                fontSize: '1.5rem',
                color: spaceColors.text.primary,
            },
            h5: {
                fontWeight: 500,
                fontSize: '1.25rem',
                color: spaceColors.text.primary,
            },
            h6: {
                fontWeight: 500,
                fontSize: '1rem',
                color: spaceColors.text.primary,
            },
            body1: {
                fontSize: '1rem',
                color: spaceColors.text.primary,
            },
            body2: {
                fontSize: '0.875rem',
                color: spaceColors.text.secondary,
            },
            button: {
                fontWeight: 600,
                textTransform: 'none',
            },
        },
        shape: {
            borderRadius: 8,
        },
        spacing: 8,
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: '8px',
                        padding: '8px 24px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: `0 0 20px ${alpha(spaceColors.primary.main, 0.3)}`,
                        },
                    },
                    containedPrimary: {
                        background: `linear-gradient(45deg, ${spaceColors.primary.main}, ${spaceColors.primary.light})`,
                        border: `1px solid ${spaceColors.primary.dark}`,
                        '&:hover': {
                            background: `linear-gradient(45deg, ${spaceColors.primary.dark}, ${spaceColors.primary.main})`,
                        },
                    },
                    containedSecondary: {
                        background: `linear-gradient(45deg, ${spaceColors.secondary.main}, ${spaceColors.secondary.light})`,
                        border: `1px solid ${spaceColors.secondary.dark}`,
                        '&:hover': {
                            background: `linear-gradient(45deg, ${spaceColors.secondary.dark}, ${spaceColors.secondary.main})`,
                        },
                    },
                    outlined: {
                        border: `2px solid ${spaceColors.primary.main}`,
                        color: spaceColors.primary.main,
                        '&:hover': {
                            border: `2px solid ${spaceColors.primary.light}`,
                            backgroundColor: alpha(spaceColors.primary.main, 0.08),
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundColor: spaceColors.background.paper,
                        border: `1px solid ${alpha(spaceColors.primary.main, 0.3)}`,
                        borderRadius: '12px',
                        backdropFilter: 'blur(10px)',
                        boxShadow: `0 4px 20px ${alpha(spaceColors.primary.main, 0.1)}`,
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundColor: spaceColors.background.paper,
                        backgroundImage: 'none',
                        border: `1px solid ${alpha(spaceColors.primary.main, 0.2)}`,
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        backgroundColor: alpha(spaceColors.primary.main, 0.2),
                        color: spaceColors.text.primary,
                        border: `1px solid ${alpha(spaceColors.primary.main, 0.5)}`,
                        '&:hover': {
                            backgroundColor: alpha(spaceColors.primary.main, 0.3),
                        },
                    },
                },
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        color: spaceColors.text.primary,
                        '&:hover': {
                            backgroundColor: alpha(spaceColors.primary.main, 0.08),
                            color: spaceColors.primary.main,
                        },
                    },
                },
            },
            MuiTextField: {
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: alpha(spaceColors.primary.main, 0.5),
                            },
                            '&:hover fieldset': {
                                borderColor: spaceColors.primary.main,
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: spaceColors.primary.main,
                                borderWidth: '2px',
                            },
                        },
                    },
                },
            },
            MuiSlider: {
                styleOverrides: {
                    root: {
                        color: spaceColors.primary.main,
                        '& .MuiSlider-track': {
                            background: `linear-gradient(90deg, ${spaceColors.primary.main}, ${spaceColors.primary.light})`,
                        },
                        '& .MuiSlider-thumb': {
                            backgroundColor: spaceColors.primary.main,
                            border: `2px solid ${spaceColors.primary.light}`,
                            '&:hover': {
                                boxShadow: `0 0 20px ${alpha(spaceColors.primary.main, 0.5)}`,
                            },
                        },
                    },
                },
            },
            MuiTabs: {
                styleOverrides: {
                    root: {
                        backgroundColor: spaceColors.background.surface,
                        borderRadius: '8px',
                    },
                    indicator: {
                        backgroundColor: spaceColors.primary.main,
                        height: '3px',
                    },
                },
            },
            MuiTab: {
                styleOverrides: {
                    root: {
                        color: spaceColors.text.secondary,
                        '&.Mui-selected': {
                            color: spaceColors.primary.main,
                        },
                        '&:hover': {
                            color: spaceColors.primary.light,
                        },
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        backgroundColor: spaceColors.background.paper,
                        border: `2px solid ${spaceColors.primary.main}`,
                        borderRadius: '16px',
                        backdropFilter: 'blur(20px)',
                    },
                },
            },
            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        backgroundColor: spaceColors.background.surface,
                        color: spaceColors.text.primary,
                        border: `1px solid ${alpha(spaceColors.primary.main, 0.5)}`,
                        fontSize: '0.75rem',
                    },
                    arrow: {
                        color: spaceColors.background.surface,
                    },
                },
            },
        },
    });
};

export const spaceTheme = createSpaceTheme();
export { spaceColors };
export default spaceTheme;
