import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 min-h-0 overflow-hidden">
                {children}
            </main>
            <Footer />
        </div>
    );
};
