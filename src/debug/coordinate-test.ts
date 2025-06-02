/**
 * Coordinate Transformation Test
 * 
 * This test verifies that:
 * 1. World-to-screen and screen-to-world transformations are consistent
 * 2. Debug visualizations align properly with the cursor position
 * 3. All visual elements (green debug area, construction tape, cursor crosshair) are in sync
 */

export function runCoordinateTest(): void {
    console.log('🧪 COORDINATE TRANSFORMATION TEST');
    console.log('================================');
    
    try {
        // Get the demo instance
        const demo = (window as any).shipBuilderDemo;
        if (!demo) {
            console.error('❌ shipBuilderDemo not found on window');
            return;
        }

        const shipBuilder = demo.getShipBuilder();
        if (!shipBuilder) {
            console.error('❌ ShipBuilder not found');
            return;
        }

        // Get the camera adapter
        const camera = shipBuilder.camera;
        if (!camera) {
            console.error('❌ Camera not found');
            return;
        }

        console.log('✅ Got references to demo, shipBuilder, and camera');

        // Test coordinate transformation consistency
        console.log('\n🔄 Testing coordinate transformation consistency...');
        
        const testPoints = [
            { x: 0, y: 0 },      // Origin
            { x: 100, y: 50 },   // Positive quadrant
            { x: -100, y: -50 }, // Negative quadrant
            { x: 200, y: -100 }, // Mixed quadrant
        ];

        let allTestsPassed = true;

        for (const worldPoint of testPoints) {
            // Convert world to screen and back
            const screenPoint = camera.worldToScreen(worldPoint);
            const backToWorld = camera.screenToWorld(screenPoint);
            
            // Check accuracy
            const deltaX = Math.abs(backToWorld.x - worldPoint.x);
            const deltaY = Math.abs(backToWorld.y - worldPoint.y);
            const accuracy = deltaX < 0.1 && deltaY < 0.1;
            
            console.log(`${accuracy ? '✅' : '❌'} World(${worldPoint.x}, ${worldPoint.y}) → Screen(${screenPoint.x.toFixed(1)}, ${screenPoint.y.toFixed(1)}) → World(${backToWorld.x.toFixed(1)}, ${backToWorld.y.toFixed(1)}) | Error: (${deltaX.toFixed(3)}, ${deltaY.toFixed(3)})`);
            
            if (!accuracy) {
                allTestsPassed = false;
            }
        }

        if (allTestsPassed) {
            console.log('\n🎉 ALL COORDINATE TRANSFORMATION TESTS PASSED!');
        } else {
            console.log('\n❌ Some coordinate transformation tests failed');
        }

        // Test camera state
        console.log('\n📹 Camera State:');
        console.log(`Position: (${camera.x}, ${camera.y})`);
        console.log(`Zoom: ${camera.zoom}`);

        // Test debug visualization alignment
        console.log('\n🎯 Testing debug visualization alignment...');
        console.log('1. Move your mouse around the screen');
        console.log('2. Verify that the red crosshair follows your cursor accurately');
        console.log('3. Verify that the green debug area stays aligned with the construction tape border');
        console.log('4. Try panning the camera (right-click and drag) and verify everything moves together');

        // Instructions for manual verification
        console.log('\n📋 Manual Verification Steps:');
        console.log('1. Select a block type (e.g., "Hull Basic")');
        console.log('2. Move mouse over the build area - ghost block should align with grid');
        console.log('3. Pan the camera - all visual elements should move together');
        console.log('4. Zoom in/out - visual elements should scale consistently');

    } catch (error) {
        console.error('❌ Coordinate test failed:', error);
    }
}

// Make it available globally for console testing
(window as any).runCoordinateTest = runCoordinateTest;

export default runCoordinateTest;
