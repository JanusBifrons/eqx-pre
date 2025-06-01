import React from 'react';
import { Link, useRouter } from '@tanstack/react-router';

export const Header: React.FC = () => {
    const router = useRouter();
    const currentPath = router.state.location.pathname;

    const isActive = (path: string) => currentPath === path;

    return (
        <header className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-50">
            <div className="container mx-auto px-6 py-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-blue-400 tracking-wide">
                        EQX Engine
                    </h1>
                    <nav className="flex items-center space-x-1">
                        <Link
                            to="/ship-builder"
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 ${isActive('/ship-builder')
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                }`}
                        >
                            🚀 Ship Builder
                        </Link>
                        <Link
                            to="/asteroids"
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 ${isActive('/asteroids')
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                }`}
                        >
                            🌌 Asteroids
                        </Link>
                        <Link
                            to="/enhanced"
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 ${isActive('/enhanced')
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                }`}
                        >
                            ✨ Enhanced
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
};
