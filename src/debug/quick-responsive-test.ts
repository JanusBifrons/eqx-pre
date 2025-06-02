/**
 * Quick Responsive Test
 * 
 * A simple test to quickly validate the responsive camera and canvas improvements.
 * This can be run from the browser console for immediate feedback.
 */

export function quickResponsiveTest(): void {
    console.log('🧪 QUICK RESPONSIVE TEST');
    console.log('='.repeat(30));

    // Check if we have access to the global objects
    const demo = (window as any).shipBuilderDemo;
    if (!demo) {
        console.error('❌ Ship builder demo not found. Make sure you\'re on the ship builder page.');
        return;
    }

    try {
        // Test 1: Check canvas dimensions
        const pixiApp = demo.getShip ? demo.getShip().getPixiApp?.() : null;
        if (!pixiApp) {
            console.error('❌ Could not access PIXI app');
            return;
        }

        console.log(`✅ Canvas Size: ${pixiApp.screen.width}x${pixiApp.screen.height}`);

        // Test 2: Check camera positioning
        const shipBuilder = demo.getShip ? demo.getShip() : null;
        const camera = shipBuilder?.getCamera?.();

        if (camera) {
            console.log(`✅ Camera Position: (${camera.x}, ${camera.y})`);
            console.log(`✅ Camera Zoom: ${camera.zoom}`);

            // Test 3: Coordinate transformation
            const worldOrigin = { x: 0, y: 0 };
            const screenPos = camera.worldToScreen(worldOrigin);
            const backToWorld = camera.screenToWorld(screenPos);

            console.log(`✅ World origin (0,0) appears at screen: (${screenPos.x}, ${screenPos.y})`);
            console.log(`✅ Transformation accuracy: (${backToWorld.x}, ${backToWorld.y})`);

            const accurate = Math.abs(backToWorld.x) < 0.1 && Math.abs(backToWorld.y) < 0.1;
            console.log(`${accurate ? '✅' : '❌'} Coordinate transformation: ${accurate ? 'ACCURATE' : 'INACCURATE'}`);

        } else {
            console.warn('⚠️ Camera not accessible');
        }

        // Test 4: Canvas responsiveness
        const canvas = pixiApp.view as HTMLCanvasElement;
        const canvasRect = canvas.getBoundingClientRect();
        const container = canvas.parentElement;
        const containerRect = container?.getBoundingClientRect();

        if (containerRect) {
            const fillsWidth = Math.abs(canvasRect.width - containerRect.width) < 2;
            const fillsHeight = Math.abs(canvasRect.height - containerRect.height) < 2;

            console.log(`${fillsWidth ? '✅' : '❌'} Canvas fills container width: ${fillsWidth}`);
            console.log(`${fillsHeight ? '✅' : '❌'} Canvas fills container height: ${fillsHeight}`);
            console.log(`📐 Container: ${containerRect.width}x${containerRect.height}`);
            console.log(`📐 Canvas: ${canvasRect.width}x${canvasRect.height}`);
        }

        console.log('\n🎯 Quick test complete!');
        console.log('For comprehensive testing, run: shipBuilderDemo.runResponsiveTests()');

    } catch (error) {
        console.error('❌ Quick test failed:', error);
    }
}

// Make it available globally
(window as any).quickResponsiveTest = quickResponsiveTest;
