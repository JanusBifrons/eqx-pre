import React, { useEffect } from 'react';
import { useDemoContainer } from '../../shared/hooks/useDemoContainer';
import { LoadingOverlay } from '../../shared/components/LoadingOverlay';
import { initializeShipBuilderDemo } from '../../demo/ship-builder-demo';
import { ShipBuilderBridge } from '../../ui/mui/ShipBuilderBridge';
import { shipBuilderAdapter } from '../../ui/mui/ShipBuilderAdapter';

export const ShipBuilderPage: React.FC = () => {
    const { containerRef, isLoading, loadDemo, cleanup } = useDemoContainer();

    console.log('🔧 ShipBuilderPage: Component rendered, isLoading:', isLoading);

    // Add an immediate test to see if JavaScript is running
    if (typeof window !== 'undefined') {
        console.log('🔧 ShipBuilderPage: Window object available, page is running in browser');
        // Try to add a marker to the document title so we can see it
        document.title = `Ship Builder - Debug Mode ${Date.now()}`;
    }

    useEffect(() => {
        console.log('🔧 ShipBuilderPage: useEffect triggered');

        // Initialize the demo and connect the adapter
        const initializeWithAdapter = async (container?: HTMLDivElement) => {
            console.log('🔧 ShipBuilderPage: initializeWithAdapter called with container:', container);
            if (!container) {
                console.log('❌ ShipBuilderPage: No container provided');
                return;
            } console.log('🔧 ShipBuilderPage: About to call initializeShipBuilderDemo');
            const demo = await initializeShipBuilderDemo(container);
            console.log('🔧 ShipBuilderPage: initializeShipBuilderDemo completed, demo:', demo);

            // Connect the adapter to the PIXI.js ShipBuilder
            if (demo && demo.getShipBuilder) {
                const shipBuilder = demo.getShipBuilder();
                shipBuilderAdapter.setShipBuilder(shipBuilder);
                console.log('✅ MUI Adapter connected to PIXI.js ShipBuilder');
            }

            return demo; // Return the demo instance for cleanup
        };

        console.log('🔧 ShipBuilderPage: About to call loadDemo');
        loadDemo(initializeWithAdapter);

        // Cleanup when component unmounts
        return () => {
            cleanup();
        };
    }, []); // Remove loadDemo dependency to prevent infinite loop

    return (
        <div className="relative w-full h-full overflow-hidden">
            <LoadingOverlay isLoading={isLoading} demoName="Ship Builder" />            {/* Canvas Container */}
            <div
                ref={containerRef}
                className="w-full h-full"
                style={{
                    backgroundColor: '#0a0a0a',
                    minHeight: '400px' // Ensure minimum height
                }}
            />

            {/* MUI Overlay - only render when not loading */}
            {!isLoading && (
                <div className="absolute inset-0 pointer-events-none">
                    <ShipBuilderBridge />
                </div>
            )}
        </div>
    );
};