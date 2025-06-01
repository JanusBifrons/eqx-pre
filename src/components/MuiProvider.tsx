import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { spaceTheme } from '../theme';

interface MuiProviderProps {
    children: React.ReactNode;
}

export const MuiProvider: React.FC<MuiProviderProps> = ({ children }) => {
    return (
        <ThemeProvider theme={spaceTheme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
};

export default MuiProvider;
