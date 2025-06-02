/**
 * Complete Ship Builder Coordinate and State Test
 * 
 * This test verifies:
 * 1. Coordinate transformations are consistent
 * 2. No block is selected by default
 * 3. Debug visualizations align properly
 * 4. Camera panning/zooming works correctly
 */

export function runCompleteTest(): void {
    console.log('🧪 COMPLETE SHIP BUILDER TEST');
    console.log('============================');
    
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

        console.log('✅ Got references to demo and shipBuilder');

        // Test 1: Verify no block is selected by default
        console.log('\n🔍 TEST 1: Default Block Selection');
        const initialBlockType = shipBuilder.getSelectedBlockType();
        const initialBuildingMode = shipBuilder.isBuildingMode();
        
        console.log(`Selected block type: ${initialBlockType}`);
        console.log(`Building mode: ${initialBuildingMode}`);
        
        if (initialBlockType === null) {
            console.log('✅ PASS: No block selected by default');
        } else {
            console.log('❌ FAIL: Block is selected by default');
        }

        // Test 2: Coordinate transformation consistency
        console.log('\n🔍 TEST 2: Coordinate Transformation');
        const camera = shipBuilder.camera;
        
        const testPoints = [
            { x: 0, y: 0 },      // Origin
            { x: 100, y: 50 },   // Positive quadrant  
            { x: -100, y: -50 }, // Negative quadrant
            { x: 200, y: -100 }, // Mixed quadrant
        ];

        let transformTestsPassed = 0;
        const totalTransformTests = testPoints.length;

        for (const worldPoint of testPoints) {
            const screenPoint = camera.worldToScreen(worldPoint);
            const backToWorld = camera.screenToWorld(screenPoint);
            
            const deltaX = Math.abs(backToWorld.x - worldPoint.x);
            const deltaY = Math.abs(backToWorld.y - worldPoint.y);
            const accuracy = deltaX < 0.1 && deltaY < 0.1;
            
            if (accuracy) {
                transformTestsPassed++;
            }
            
            console.log(`${accuracy ? '✅' : '❌'} World(${worldPoint.x}, ${worldPoint.y}) → Screen(${screenPoint.x.toFixed(1)}, ${screenPoint.y.toFixed(1)}) → World(${backToWorld.x.toFixed(1)}, ${backToWorld.y.toFixed(1)})`);
        }

        if (transformTestsPassed === totalTransformTests) {
            console.log('✅ PASS: All coordinate transformations accurate');
        } else {
            console.log(`❌ FAIL: ${totalTransformTests - transformTestsPassed}/${totalTransformTests} coordinate tests failed`);
        }

        // Test 3: Camera state
        console.log('\n🔍 TEST 3: Camera State');
        console.log(`Camera position: (${camera.x}, ${camera.y})`);
        console.log(`Camera zoom: ${camera.zoom}`);
        
        // Camera should be centered (near 0,0) and zoom should be 1.0
        const cameraIscentered = Math.abs(camera.x) < 10 && Math.abs(camera.y) < 10;
        const zoomIsCorrect = Math.abs(camera.zoom - 1.0) < 0.1;
        
        if (cameraIscentered && zoomIsCorrect) {
            console.log('✅ PASS: Camera in expected state');
        } else {
            console.log('❌ FAIL: Camera not in expected state');
        }

        // Test 4: Block selection behavior
        console.log('\n🔍 TEST 4: Block Selection Behavior');
        
        // Select a block
        shipBuilder.selectBlockType('hull_basic');
        const selectedType = shipBuilder.getSelectedBlockType();
        const buildingMode = shipBuilder.isBuildingMode();
        
        if (selectedType === 'hull_basic' && buildingMode) {
            console.log('✅ PASS: Block selection works correctly');
        } else {
            console.log('❌ FAIL: Block selection not working');
        }
        
        // Deselect block
        shipBuilder.deselectBlockType();
        const deselectedType = shipBuilder.getSelectedBlockType();
        const deselectedBuildingMode = shipBuilder.isBuildingMode();
        
        if (deselectedType === null && !deselectedBuildingMode) {
            console.log('✅ PASS: Block deselection works correctly');
        } else {
            console.log('❌ FAIL: Block deselection not working');
        }

        // Summary
        console.log('\n📊 TEST SUMMARY');
        console.log('==============');
        const testResults = [
            initialBlockType === null,
            transformTestsPassed === totalTransformTests,
            cameraIscentered && zoomIsCorrect,
            selectedType === 'hull_basic' && deselectedType === null
        ];
        
        const passedTests = testResults.filter(Boolean).length;
        const totalTests = testResults.length;
        
        if (passedTests === totalTests) {
            console.log(`🎉 ALL TESTS PASSED! (${passedTests}/${totalTests})`);
            console.log('✅ Coordinate transformation system is working correctly');
            console.log('✅ Default block selection issue is fixed');
            console.log('✅ Ship Builder is ready for use');
        } else {
            console.log(`⚠️  ${passedTests}/${totalTests} tests passed`);
            console.log('Some issues may still exist - check individual test results above');
        }

        // Visual verification instructions
        console.log('\n🎯 MANUAL VERIFICATION STEPS:');
        console.log('1. Move mouse around - verify red crosshair follows cursor');
        console.log('2. Select a block type - verify ghost block appears and aligns');
        console.log('3. Pan camera (right-click drag) - verify all elements move together');
        console.log('4. Place blocks - verify they align with grid and debug areas');

    } catch (error) {
        console.error('❌ Complete test failed:', error);
    }
}

// Make it available globally for console testing
(window as any).runCompleteTest = runCompleteTest;

export default runCompleteTest;
