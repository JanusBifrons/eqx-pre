import React from 'react';

export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-800/30 backdrop-blur-sm border-t border-gray-700/30 mt-auto">
            <div className="container mx-auto px-6 py-3">
                <div className="flex items-center justify-between text-xs text-gray-400">
                    <p className="font-medium">
                        EQX Engine Demo
                    </p>
                    <p>
                        © {currentYear} • Experimental Game Engine Technology
                    </p>
                </div>
            </div>
        </footer>
    );
};
