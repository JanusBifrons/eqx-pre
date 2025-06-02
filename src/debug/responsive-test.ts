/**
 * Responsive Camera and Canvas Test
 * 
 * Tests the new responsive camera and canvas system to ensure:
 * - Proper aspect ratio maintenance
 * - Accurate coordinate transformations
 * - Correct resize behavior
 * - Mouse coordinate translation across different screen sizes
 */

export class ResponsiveTest {
    private renderingEngine: any;
    private shipBuilder: any;
    private testResults: any[] = [];

    constructor(renderingEngine: any, shipBuilder: any) {
        this.renderingEngine = renderingEngine;
        this.shipBuilder = shipBuilder;
    }

    /**
     * Run all responsive tests
     */
    public async runAllTests(): Promise<void> {
        console.log('🧪 STARTING RESPONSIVE CAMERA & CANVAS TESTS');
        console.log('='.repeat(60));

        this.clearResults();

        try {
            await this.test1_InitialCanvasSize();
            await this.test2_CoordinateTransformation();
            await this.test3_CameraPositioning();
            await this.test4_ResizeBehavior();
            await this.test5_AspectRatioMaintenance();
            await this.test6_MouseCoordinateAccuracy();
            await this.test7_ViewportBounds();
        } catch (error) {
            console.error('❌ Responsive test suite failed:', error);
        }

        this.printResults();
    }

    private clearResults(): void {
        this.testResults = [];
    }

    private addResult(testName: string, passed: boolean, details: any): void {
        this.testResults.push({
            test: testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        });

        const status = passed ? '✅' : '❌';
        console.log(`${status} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
        if (!passed || details) {
            console.log('   Details:', details);
        }
    }

    /**
     * Test 1: Validate initial canvas size and setup
     */
    private async test1_InitialCanvasSize(): Promise<void> {
        try {
            const pixiApp = this.renderingEngine.getPixiApp();
            const debugInfo = this.renderingEngine.getDebugInfo();

            const canvasElement = pixiApp.view as HTMLCanvasElement;
            const containerRect = canvasElement.parentElement?.getBoundingClientRect();

            const hasValidSize = pixiApp.screen.width > 0 && pixiApp.screen.height > 0; const hasProperStyling = canvasElement.style.width === '100%' && canvasElement.style.height === '100%';
            const isResponsive = !!(containerRect && containerRect.width > 0 && containerRect.height > 0);

            this.addResult('Initial Canvas Size', hasValidSize && hasProperStyling && isResponsive, {
                screenSize: `${pixiApp.screen.width}x${pixiApp.screen.height}`,
                canvasSize: `${canvasElement.width}x${canvasElement.height}`,
                containerSize: containerRect ? `${containerRect.width}x${containerRect.height}` : 'N/A',
                canvasStyle: {
                    width: canvasElement.style.width,
                    height: canvasElement.style.height,
                    boxSizing: canvasElement.style.boxSizing
                },
                debugInfo
            });
        } catch (error: any) {
            this.addResult('Initial Canvas Size', false, { error: error?.message || String(error) });
        }
    }

    /**
     * Test 2: Validate coordinate transformation accuracy
     */
    private async test2_CoordinateTransformation(): Promise<void> {
        try {
            const camera = this.shipBuilder.getCamera?.();
            if (!camera) {
                this.addResult('Coordinate Transformation', false, { error: 'No camera available' });
                return;
            }

            // Test multiple coordinate transformations
            const testPoints = [
                { x: 0, y: 0 },       // World origin
                { x: 100, y: 50 },    // Positive quadrant
                { x: -100, y: -50 },  // Negative quadrant
                { x: 200, y: -100 }   // Mixed quadrant
            ];

            let allAccurate = true;
            const transformResults: any[] = [];

            for (const worldPos of testPoints) {
                const screenPos = camera.worldToScreen(worldPos);
                const backToWorld = camera.screenToWorld(screenPos);

                const deltaX = Math.abs(backToWorld.x - worldPos.x);
                const deltaY = Math.abs(backToWorld.y - worldPos.y);
                const accurate = deltaX < 0.1 && deltaY < 0.1;

                if (!accurate) allAccurate = false;

                transformResults.push({
                    original: worldPos,
                    screen: screenPos,
                    backToWorld,
                    delta: { x: deltaX, y: deltaY },
                    accurate
                });
            }

            this.addResult('Coordinate Transformation', allAccurate, {
                cameraState: {
                    x: camera.x,
                    y: camera.y,
                    zoom: camera.zoom,
                    screenDimensions: camera.getScreenDimensions?.()
                },
                transformResults
            });
        } catch (error: any) {
            this.addResult('Coordinate Transformation', false, { error: error?.message || String(error) });
        }
    }

    /**
     * Test 3: Validate camera positioning and centering
     */
    private async test3_CameraPositioning(): Promise<void> {
        try {
            const camera = this.shipBuilder.getCamera?.();
            const pixiApp = this.renderingEngine.getPixiApp();

            if (!camera || !pixiApp) {
                this.addResult('Camera Positioning', false, { error: 'Missing camera or PIXI app' });
                return;
            }

            const screenCenter = {
                x: pixiApp.screen.width / 2,
                y: pixiApp.screen.height / 2
            };

            // Test if world origin (0,0) appears at screen center
            const worldOriginOnScreen = camera.worldToScreen({ x: 0, y: 0 });
            const deltaX = Math.abs(worldOriginOnScreen.x - screenCenter.x);
            const deltaY = Math.abs(worldOriginOnScreen.y - screenCenter.y);

            const properlyPositioned = deltaX < 1 && deltaY < 1;

            this.addResult('Camera Positioning', properlyPositioned, {
                screenCenter,
                worldOriginOnScreen,
                delta: { x: deltaX, y: deltaY },
                cameraPosition: { x: camera.x, y: camera.y },
                screenDimensions: { width: pixiApp.screen.width, height: pixiApp.screen.height }
            });
        } catch (error: any) {
            this.addResult('Camera Positioning', false, { error: error?.message || String(error) });
        }
    }

    /**
     * Test 4: Simulate resize behavior
     */
    private async test4_ResizeBehavior(): Promise<void> {
        try {
            const camera = this.shipBuilder.getCamera?.();
            const pixiApp = this.renderingEngine.getPixiApp();

            if (!camera || !pixiApp) {
                this.addResult('Resize Behavior', false, { error: 'Missing camera or PIXI app' });
                return;
            }

            // Record initial state
            const initialState = {
                cameraPos: { x: camera.x, y: camera.y },
                screenSize: { width: pixiApp.screen.width, height: pixiApp.screen.height },
                worldOriginOnScreen: camera.worldToScreen({ x: 0, y: 0 })
            };

            // Simulate a resize (smaller screen)
            const newWidth = Math.max(400, pixiApp.screen.width * 0.8);
            const newHeight = Math.max(300, pixiApp.screen.height * 0.8);

            this.shipBuilder.resize(newWidth, newHeight);

            // Wait for resize to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Check state after resize
            const afterResizeState = {
                cameraPos: { x: camera.x, y: camera.y },
                screenSize: { width: newWidth, height: newHeight },
                worldOriginOnScreen: camera.worldToScreen({ x: 0, y: 0 })
            };

            // Validate that world origin is still centered after resize
            const newScreenCenter = { x: newWidth / 2, y: newHeight / 2 };
            const deltaX = Math.abs(afterResizeState.worldOriginOnScreen.x - newScreenCenter.x);
            const deltaY = Math.abs(afterResizeState.worldOriginOnScreen.y - newScreenCenter.y);

            const resizeBehaviorCorrect = deltaX < 1 && deltaY < 1;

            this.addResult('Resize Behavior', resizeBehaviorCorrect, {
                initialState,
                afterResizeState,
                newScreenCenter,
                delta: { x: deltaX, y: deltaY }
            });

            // Restore original size
            this.shipBuilder.resize(initialState.screenSize.width, initialState.screenSize.height);

        } catch (error: any) {
            this.addResult('Resize Behavior', false, { error: error?.message || String(error) });
        }
    }

    /**
     * Test 5: Validate aspect ratio maintenance
     */
    private async test5_AspectRatioMaintenance(): Promise<void> {
        try {
            const pixiApp = this.renderingEngine.getPixiApp();
            const canvasElement = pixiApp.view as HTMLCanvasElement;
            const container = canvasElement.parentElement;

            if (!container) {
                this.addResult('Aspect Ratio Maintenance', false, { error: 'No container found' });
                return;
            }

            const containerRect = container.getBoundingClientRect();
            const canvasRect = canvasElement.getBoundingClientRect();

            // Check if canvas fills container properly
            const fillsWidth = Math.abs(canvasRect.width - containerRect.width) < 2;
            const fillsHeight = Math.abs(canvasRect.height - containerRect.height) < 2;
            const maintainsAspectRatio = fillsWidth && fillsHeight;

            this.addResult('Aspect Ratio Maintenance', maintainsAspectRatio, {
                containerDimensions: {
                    width: containerRect.width,
                    height: containerRect.height
                },
                canvasDimensions: {
                    width: canvasRect.width,
                    height: canvasRect.height
                },
                pixiScreenDimensions: {
                    width: pixiApp.screen.width,
                    height: pixiApp.screen.height
                },
                canvasInternalDimensions: {
                    width: canvasElement.width,
                    height: canvasElement.height
                }
            });
        } catch (error: any) {
            this.addResult('Aspect Ratio Maintenance', false, { error: error?.message || String(error) });
        }
    }

    /**
     * Test 6: Validate mouse coordinate accuracy
     */
    private async test6_MouseCoordinateAccuracy(): Promise<void> {
        try {
            const camera = this.shipBuilder.getCamera?.();
            const pixiApp = this.renderingEngine.getPixiApp();

            if (!camera || !pixiApp) {
                this.addResult('Mouse Coordinate Accuracy', false, { error: 'Missing camera or PIXI app' });
                return;
            }

            // Test mouse coordinates at various screen positions
            const testMousePositions = [
                { x: 0, y: 0 },                                           // Top-left
                { x: pixiApp.screen.width / 2, y: pixiApp.screen.height / 2 }, // Center
                { x: pixiApp.screen.width, y: pixiApp.screen.height },   // Bottom-right
                { x: pixiApp.screen.width / 4, y: pixiApp.screen.height / 4 }  // Quarter point
            ];

            let allAccurate = true;
            const mouseResults: any[] = [];

            for (const screenPos of testMousePositions) {
                const worldPos = camera.screenToWorld(screenPos);
                const backToScreen = camera.worldToScreen(worldPos);

                const deltaX = Math.abs(backToScreen.x - screenPos.x);
                const deltaY = Math.abs(backToScreen.y - screenPos.y);
                const accurate = deltaX < 0.1 && deltaY < 0.1;

                if (!accurate) allAccurate = false;

                mouseResults.push({
                    original: screenPos,
                    world: worldPos,
                    backToScreen,
                    delta: { x: deltaX, y: deltaY },
                    accurate
                });
            }

            this.addResult('Mouse Coordinate Accuracy', allAccurate, {
                mouseResults,
                screenSize: { width: pixiApp.screen.width, height: pixiApp.screen.height }
            });
        } catch (error: any) {
            this.addResult('Mouse Coordinate Accuracy', false, { error: error?.message || String(error) });
        }
    }

    /**
     * Test 7: Validate viewport bounds
     */
    private async test7_ViewportBounds(): Promise<void> {
        try {
            const pixiApp = this.renderingEngine.getPixiApp();
            const debugInfo = this.renderingEngine.getDebugInfo();

            // Check if screen dimensions are reasonable
            const hasReasonableWidth = pixiApp.screen.width >= 320 && pixiApp.screen.width <= 4000;
            const hasReasonableHeight = pixiApp.screen.height >= 240 && pixiApp.screen.height <= 3000;
            const hasPositiveResolution = debugInfo.resolution > 0;

            const validBounds = hasReasonableWidth && hasReasonableHeight && hasPositiveResolution;

            this.addResult('Viewport Bounds', validBounds, {
                screenDimensions: {
                    width: pixiApp.screen.width,
                    height: pixiApp.screen.height
                },
                checks: {
                    reasonableWidth: hasReasonableWidth,
                    reasonableHeight: hasReasonableHeight,
                    positiveResolution: hasPositiveResolution
                },
                debugInfo
            });
        } catch (error: any) {
            this.addResult('Viewport Bounds', false, { error: error?.message || String(error) });
        }
    }

    private printResults(): void {
        console.log('\n' + '='.repeat(60));
        console.log('🧪 RESPONSIVE TEST RESULTS');
        console.log('='.repeat(60));

        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;

        console.log(`Overall: ${passed}/${total} tests passed`);

        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.test}`);
        });

        const failedTests = this.testResults.filter(r => !r.passed);
        if (failedTests.length > 0) {
            console.log('\n❌ FAILED TESTS DETAILS:');
            failedTests.forEach(test => {
                console.log(`\n${test.test}:`);
                console.log(JSON.stringify(test.details, null, 2));
            });
        }
    }
}

// Export function to run tests from console
export function runResponsiveTests(renderingEngine: any, shipBuilder: any): void {
    const tester = new ResponsiveTest(renderingEngine, shipBuilder);
    tester.runAllTests();
}
