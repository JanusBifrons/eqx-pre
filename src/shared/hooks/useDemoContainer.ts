import { useRef, useState, useCallback } from 'react';

export const useDemoContainer = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const demoInstanceRef = useRef<any>(null);

    const clearContainer = useCallback(() => {
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
    }, []);

    const cleanup = useCallback(() => {
        if (demoInstanceRef.current && typeof demoInstanceRef.current.destroy === 'function') {
            console.log('🧹 Cleaning up demo instance...');
            demoInstanceRef.current.destroy();
            demoInstanceRef.current = null;
        }
    }, []); const loadDemo = useCallback(async (demoFunction: (container?: HTMLDivElement) => Promise<any> | any) => {
        console.log('🔧 useDemoContainer: loadDemo called');
        setIsLoading(true);

        // Cleanup any existing demo first
        cleanup();
        clearContainer();

        try {
            // Wait a frame to ensure the container is cleared
            await new Promise(resolve => requestAnimationFrame(resolve));
            console.log('🔧 useDemoContainer: About to call demoFunction with container:', containerRef.current);
            const result = await demoFunction(containerRef.current || undefined);
            console.log('🔧 useDemoContainer: demoFunction completed with result:', result);

            // Store the demo instance if it has a destroy method
            if (result && typeof result.destroy === 'function') {
                demoInstanceRef.current = result;
            }
        } catch (error) {
            console.error('❌ Failed to start demo:', error);
        } finally {
            setIsLoading(false);
            console.log('🔧 useDemoContainer: loadDemo finished, isLoading set to false');
        }
    }, [clearContainer, cleanup]);

    return {
        containerRef,
        isLoading,
        loadDemo,
        clearContainer,
        cleanup,
    };
};
