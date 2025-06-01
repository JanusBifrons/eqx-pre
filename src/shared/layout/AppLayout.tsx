import React from 'react';
import { Link, useRouter } from '@tanstack/react-router';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const router = useRouter();
    const currentPath = router.state.location.pathname;

    const isActive = (path: string) => currentPath === path;

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-gray-800 shadow-lg">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-center mb-6 text-blue-400">
                        EQX Game Engine Demo
                    </h1>
                    <nav className="flex justify-center space-x-4">
                        <Link
                            to="/ship-builder"
                            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-md ${isActive('/ship-builder')
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            🚀 Ship Builder
                        </Link>
                        <Link
                            to="/asteroids"
                            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-md ${isActive('/asteroids')
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            🌌 Asteroids Demo
                        </Link>
                        <Link
                            to="/enhanced"
                            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:shadow-md ${isActive('/enhanced')
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            ✨ Enhanced Demo
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 relative min-h-[calc(100vh-200px)]">
                {children}
            </main>
        </div>
    );
};
