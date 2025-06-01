import React from 'react';

interface LoadingOverlayProps {
    isLoading: boolean;
    demoName: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, demoName }) => {
    if (!isLoading) return null;

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-lg text-gray-300">Loading {demoName} demo...</p>
            </div>
        </div>
    );
};
