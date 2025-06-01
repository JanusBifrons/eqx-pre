import { useRef, useEffect, useState } from 'react';

export const useDemoContainer = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    const clearContainer = () => {
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
    };

    const loadDemo = async (demoFunction: (container?: HTMLDivElement) => Promise<void> | void) => {
        setIsLoading(true);
        clearContainer();

        try {
            // Wait a frame to ensure the container is cleared
            await new Promise(resolve => requestAnimationFrame(resolve));
            await demoFunction(containerRef.current || undefined);
        } catch (error) {
            console.error('❌ Failed to start demo:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        containerRef,
        isLoading,
        loadDemo,
        clearContainer,
    };
};
