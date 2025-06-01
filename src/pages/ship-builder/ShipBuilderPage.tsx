import React, { useEffect } from 'react';
import { useDemoContainer } from '../../shared/hooks/useDemoContainer';
import { LoadingOverlay } from '../../shared/components/LoadingOverlay';
import { initializeShipBuilderDemo } from '../../demo/ship-builder-demo';
import { ShipBuilderBridge } from '../../ui/mui/ShipBuilderBridge';
import { shipBuilderAdapter } from '../../ui/mui/ShipBuilderAdapter';

export const ShipBuilderPage: React.FC = () => {
    const { containerRef, isLoading, loadDemo, cleanup } = useDemoContainer();

    useEffect(() => {
        // Initialize the demo and connect the adapter
        const initializeWithAdapter = async (container?: HTMLDivElement) => {
            if (!container) return;

            const demo = await initializeShipBuilderDemo(container);

            // Connect the adapter to the PIXI.js ShipBuilder
            if (demo && demo.getShipBuilder) {
                const shipBuilder = demo.getShipBuilder();
                shipBuilderAdapter.setShipBuilder(shipBuilder);
                console.log('✅ MUI Adapter connected to PIXI.js ShipBuilder');
            }

            return demo; // Return the demo instance for cleanup
        };

        loadDemo(initializeWithAdapter);

        // Cleanup when component unmounts
        return () => {
            cleanup();
        };
    }, []); // Remove loadDemo dependency to prevent infinite loop

    return (
        <div className="relative w-full h-full overflow-hidden">
            <LoadingOverlay isLoading={isLoading} demoName="Ship Builder" />
            {/* Canvas Container */}
            <div ref={containerRef} className="w-full h-full" />

            {/* MUI Overlay - only render when not loading */}
            {!isLoading && (<div className="absolute inset-0 pointer-events-none">
                <ShipBuilderBridge />
            </div>
            )}
        </div>
    );
};
