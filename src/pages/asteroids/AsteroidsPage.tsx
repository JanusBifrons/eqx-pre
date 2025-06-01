import React, { useEffect } from 'react';
import { useDemoContainer } from '../../shared/hooks/useDemoContainer';
import { LoadingOverlay } from '../../shared/components/LoadingOverlay';
import { runAsteroidsDemo } from '../../demo/asteroids-demo';

export const AsteroidsPage: React.FC = () => {
    const { containerRef, isLoading, loadDemo } = useDemoContainer();

    useEffect(() => {
        loadDemo((container) => {
            runAsteroidsDemo(container);
            return Promise.resolve();
        });
    }, []); return (
        <div className="relative w-full h-full overflow-hidden">
            <LoadingOverlay isLoading={isLoading} demoName="Asteroids" />
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
};
