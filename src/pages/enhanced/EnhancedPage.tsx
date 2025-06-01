import React, { useEffect } from 'react';
import { useDemoContainer } from '../../shared/hooks/useDemoContainer';
import { LoadingOverlay } from '../../shared/components/LoadingOverlay';
import { runEnhancedDemo } from '../../enhanced-demo';

export const EnhancedPage: React.FC = () => {
    const { containerRef, isLoading, loadDemo } = useDemoContainer();

    useEffect(() => {
        loadDemo((container) => {
            runEnhancedDemo(container);
            return Promise.resolve();
        });
    }, []); return (
        <div className="relative w-full h-full overflow-hidden">
            <LoadingOverlay isLoading={isLoading} demoName="Enhanced" />
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
};
