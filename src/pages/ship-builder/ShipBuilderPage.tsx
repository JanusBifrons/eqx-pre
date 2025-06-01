import React, { useEffect } from 'react';
import { useDemoContainer } from '../../shared/hooks/useDemoContainer';
import { LoadingOverlay } from '../../shared/components/LoadingOverlay';
import { initializeShipBuilderDemo } from '../../demo/ship-builder-demo';

export const ShipBuilderPage: React.FC = () => {
    const { containerRef, isLoading, loadDemo } = useDemoContainer();

    useEffect(() => {
        loadDemo(initializeShipBuilderDemo);
    }, []); return (
        <div className="relative w-full h-full overflow-hidden">
            <LoadingOverlay isLoading={isLoading} demoName="Ship Builder" />
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
};
