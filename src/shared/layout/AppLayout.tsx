import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <Header />
            <main className="container mx-auto px-6 py-6 flex-1">
                {children}
            </main>
            <Footer />
        </div>
    );
};
