import React, { useState, useRef, useEffect } from 'react';
import { initializeShipBuilderDemo } from './demo/ship-builder-demo';
import { runAsteroidsDemo } from './demo/asteroids-demo';
import { runEnhancedDemo } from './enhanced-demo';
import './index.css';

type DemoType = 'ship-builder' | 'asteroids' | 'enhanced' | null;

function App() {
    const [currentDemo, setCurrentDemo] = useState<DemoType>('ship-builder');
    const [isLoading, setIsLoading] = useState(false);
    const gameContainerRef = useRef<HTMLDivElement>(null);    const loadDemo = async (demoType: DemoType) => {
        if (currentDemo === demoType) return;
        
        setIsLoading(true);
        
        // Clear the current demo
        if (gameContainerRef.current) {
            gameContainerRef.current.innerHTML = '';
        }

        try {
            setCurrentDemo(demoType);
            
            // Wait a frame to ensure the container is cleared
            await new Promise(resolve => requestAnimationFrame(resolve));
              switch (demoType) {
                case 'ship-builder':
                    await initializeShipBuilderDemo(gameContainerRef.current || undefined);
                    break;
                case 'asteroids':
                    runAsteroidsDemo(gameContainerRef.current || undefined);
                    break;
                case 'enhanced':
                    runEnhancedDemo(gameContainerRef.current || undefined);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error(`❌ Failed to start ${demoType} demo:`, error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load default demo on mount
    useEffect(() => {
        loadDemo('ship-builder');
    }, []);    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="bg-gray-800 shadow-lg">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-center mb-6 text-blue-400">
                        EQX Game Engine Demo
                    </h1>
                    <nav className="flex justify-center space-x-4">
                        <button
                            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                                currentDemo === 'ship-builder' 
                                    ? 'bg-blue-600 text-white shadow-lg' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                            onClick={() => loadDemo('ship-builder')}
                            disabled={isLoading}
                        >
                            🚀 Ship Builder
                        </button>
                        <button
                            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                                currentDemo === 'asteroids' 
                                    ? 'bg-blue-600 text-white shadow-lg' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                            onClick={() => loadDemo('asteroids')}
                            disabled={isLoading}
                        >
                            🌌 Asteroids Demo
                        </button>
                        <button
                            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                                currentDemo === 'enhanced' 
                                    ? 'bg-blue-600 text-white shadow-lg' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                            onClick={() => loadDemo('enhanced')}
                            disabled={isLoading}
                        >
                            ✨ Enhanced Demo
                        </button>
                    </nav>
                </div>
            </header>
            
            <main className="container mx-auto px-4 py-8 relative min-h-[calc(100vh-200px)]" ref={gameContainerRef}>
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
                            <p className="text-lg text-gray-300">Loading {currentDemo} demo...</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
