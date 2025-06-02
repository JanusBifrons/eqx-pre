/**
 * Comprehensive Responsive Validation
 * 
 * This script validates all aspects of the responsive camera and canvas system:
 * - Canvas sizing and responsiveness
 * - Camera positioning and transforms
 * - Coordinate transformations
 * - Resize behavior
 * - Mouse coordinate accuracy
 */

export class ResponsiveValidation {
    private results: any[] = [];

    public async runCompleteValidation(): Promise<boolean> {
        console.log('🔬 COMPREHENSIVE RESPONSIVE VALIDATION');
        console.log('='.repeat(50));

        this.results = [];

        try {
            await this.validateCanvasSetup();
            await this.validateCameraSystem();
            await this.validateCoordinateTransforms();
            await this.validateResizeBehavior();
            await this.validateMouseAccuracy();
            await this.validateAspectRatio();

            return this.reportResults();
        } catch (error) {
            console.error('❌ Validation failed:', error);
            return false;
        }
    }

    private async validateCanvasSetup(): Promise<void> {
        console.log('\n📐 Validating Canvas Setup...');

        // Check if we can access the demo
        const demo = (window as any).shipBuilderDemo;
        if (!demo) {
            this.addResult('Canvas Access', false, 'Demo not available');
            return;
        }

        try {
            const app = demo.getApplication();
            const pixiApp = app.getPixiApp();
            const canvas = pixiApp.view as HTMLCanvasElement;
            const container = canvas.parentElement;

            // Test 1: Canvas exists and has proper dimensions
            const hasValidDimensions = pixiApp.screen.width > 0 && pixiApp.screen.height > 0;
            this.addResult('Canvas Dimensions', hasValidDimensions, {
                width: pixiApp.screen.width,
                height: pixiApp.screen.height
            });

            // Test 2: Canvas styling
            const hasResponsiveStyles = canvas.style.width === '100%' && canvas.style.height === '100%';
            this.addResult('Canvas Styling', hasResponsiveStyles, {
                width: canvas.style.width,
                height: canvas.style.height,
                boxSizing: canvas.style.boxSizing
            });

            // Test 3: Container setup
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const hasValidContainer = containerRect.width > 0 && containerRect.height > 0;
                this.addResult('Container Setup', hasValidContainer, {
                    width: containerRect.width,
                    height: containerRect.height
                });
            } else {
                this.addResult('Container Setup', false, 'No container found');
            }

        } catch (error) {
            this.addResult('Canvas Setup', false, error);
        }
    }

    private async validateCameraSystem(): Promise<void> {
        console.log('\n📹 Validating Camera System...');

        try {
            const demo = (window as any).shipBuilderDemo;
            const shipBuilder = demo.getShipBuilder();
            const camera = shipBuilder.getCamera();

            // Test 1: Camera exists and is properly initialized
            const cameraExists = !!camera;
            this.addResult('Camera Exists', cameraExists, camera ? {
                x: camera.x,
                y: camera.y,
                zoom: camera.zoom
            } : null);

            if (!camera) return;

            // Test 2: Camera zoom is fixed at 1.0
            const zoomFixed = Math.abs(camera.zoom - 1.0) < 0.001;
            this.addResult('Zoom Fixed at 1.0', zoomFixed, { zoom: camera.zoom });

            // Test 3: Camera has screen dimensions
            const screenDims = camera.getScreenDimensions?.();
            const hasDimensions = screenDims && screenDims.width > 0 && screenDims.height > 0;
            this.addResult('Screen Dimensions Tracked', hasDimensions, screenDims);

            // Test 4: Camera positioning (should center world origin at screen center)
            const app = demo.getApplication();
            const pixiApp = app.getPixiApp();
            const expectedX = pixiApp.screen.width / 2;
            const expectedY = pixiApp.screen.height / 2;

            const positionCorrect = Math.abs(camera.x - expectedX) < 1 && Math.abs(camera.y - expectedY) < 1;
            this.addResult('Camera Positioning', positionCorrect, {
                actual: { x: camera.x, y: camera.y },
                expected: { x: expectedX, y: expectedY },
                delta: { x: Math.abs(camera.x - expectedX), y: Math.abs(camera.y - expectedY) }
            });

        } catch (error) {
            this.addResult('Camera System', false, error);
        }
    }

    private async validateCoordinateTransforms(): Promise<void> {
        console.log('\n🎯 Validating Coordinate Transforms...');

        try {
            const demo = (window as any).shipBuilderDemo;
            const camera = demo.getShipBuilder().getCamera();

            if (!camera) {
                this.addResult('Coordinate Transforms', false, 'No camera available');
                return;
            }

            // Test multiple coordinate pairs for accuracy
            const testPoints = [
                { x: 0, y: 0, name: 'Origin' },
                { x: 100, y: 50, name: 'Positive' },
                { x: -100, y: -50, name: 'Negative' },
                { x: 32, y: -32, name: 'Grid Cell' }
            ];

            let allAccurate = true;
            const transformResults: any[] = [];

            for (const point of testPoints) {
                const screenPos = camera.worldToScreen(point);
                const backToWorld = camera.screenToWorld(screenPos);

                const deltaX = Math.abs(backToWorld.x - point.x);
                const deltaY = Math.abs(backToWorld.y - point.y);
                const accurate = deltaX < 0.01 && deltaY < 0.01;

                if (!accurate) allAccurate = false;

                transformResults.push({
                    name: point.name,
                    original: point,
                    screen: screenPos,
                    backToWorld,
                    delta: { x: deltaX, y: deltaY },
                    accurate
                });
            }

            this.addResult('Coordinate Transform Accuracy', allAccurate, transformResults);

        } catch (error) {
            this.addResult('Coordinate Transforms', false, error);
        }
    }

    private async validateResizeBehavior(): Promise<void> {
        console.log('\n📏 Validating Resize Behavior...');

        try {
            const demo = (window as any).shipBuilderDemo;
            const shipBuilder = demo.getShipBuilder();
            const camera = shipBuilder.getCamera();
            const app = demo.getApplication();
            const pixiApp = app.getPixiApp();

            // Record initial state
            const initialState = {
                cameraPos: { x: camera.x, y: camera.y },
                screenSize: { width: pixiApp.screen.width, height: pixiApp.screen.height },
                worldOriginOnScreen: camera.worldToScreen({ x: 0, y: 0 })
            };

            // Test resize to smaller dimensions
            const newWidth = Math.max(400, initialState.screenSize.width * 0.7);
            const newHeight = Math.max(300, initialState.screenSize.height * 0.7);

            // Perform resize
            shipBuilder.resize(newWidth, newHeight);

            // Wait for resize to settle
            await new Promise(resolve => setTimeout(resolve, 100));

            // Check post-resize state
            const afterResize = {
                cameraPos: { x: camera.x, y: camera.y },
                screenSize: { width: newWidth, height: newHeight },
                worldOriginOnScreen: camera.worldToScreen({ x: 0, y: 0 })
            };

            // Validate that world origin is still centered
            const newCenter = { x: newWidth / 2, y: newHeight / 2 };
            const deltaX = Math.abs(afterResize.worldOriginOnScreen.x - newCenter.x);
            const deltaY = Math.abs(afterResize.worldOriginOnScreen.y - newCenter.y);

            const resizeCorrect = deltaX < 2 && deltaY < 2;
            this.addResult('Resize Behavior', resizeCorrect, {
                initial: initialState,
                afterResize,
                newCenter,
                delta: { x: deltaX, y: deltaY }
            });

            // Restore original size
            shipBuilder.resize(initialState.screenSize.width, initialState.screenSize.height);
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            this.addResult('Resize Behavior', false, error);
        }
    }

    private async validateMouseAccuracy(): Promise<void> {
        console.log('\n🖱️ Validating Mouse Coordinate Accuracy...');

        try {
            const demo = (window as any).shipBuilderDemo;
            const camera = demo.getShipBuilder().getCamera();
            const app = demo.getApplication();
            const pixiApp = app.getPixiApp();

            // Test mouse coordinates at key screen positions
            const testPositions = [
                { x: 0, y: 0, name: 'Top-Left' },
                { x: pixiApp.screen.width / 2, y: pixiApp.screen.height / 2, name: 'Center' },
                { x: pixiApp.screen.width, y: pixiApp.screen.height, name: 'Bottom-Right' },
                { x: pixiApp.screen.width / 4, y: pixiApp.screen.height / 4, name: 'Quarter' }
            ];

            let allAccurate = true;
            const mouseResults: any[] = [];

            for (const screenPos of testPositions) {
                const worldPos = camera.screenToWorld(screenPos);
                const backToScreen = camera.worldToScreen(worldPos);

                const deltaX = Math.abs(backToScreen.x - screenPos.x);
                const deltaY = Math.abs(backToScreen.y - screenPos.y);
                const accurate = deltaX < 0.1 && deltaY < 0.1;

                if (!accurate) allAccurate = false;

                mouseResults.push({
                    name: screenPos.name,
                    originalScreen: screenPos,
                    world: worldPos,
                    backToScreen,
                    delta: { x: deltaX, y: deltaY },
                    accurate
                });
            }

            this.addResult('Mouse Coordinate Accuracy', allAccurate, mouseResults);

        } catch (error) {
            this.addResult('Mouse Accuracy', false, error);
        }
    }

    private async validateAspectRatio(): Promise<void> {
        console.log('\n📺 Validating Aspect Ratio Maintenance...');

        try {
            const demo = (window as any).shipBuilderDemo;
            const app = demo.getApplication();
            const pixiApp = app.getPixiApp();
            const canvas = pixiApp.view as HTMLCanvasElement;
            const container = canvas.parentElement;

            if (!container) {
                this.addResult('Aspect Ratio', false, 'No container found');
                return;
            }

            const canvasRect = canvas.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // Check if canvas fills container properly
            const widthMatch = Math.abs(canvasRect.width - containerRect.width) < 2;
            const heightMatch = Math.abs(canvasRect.height - containerRect.height) < 2;
            const aspectRatioMaintained = widthMatch && heightMatch;

            this.addResult('Aspect Ratio Maintenance', aspectRatioMaintained, {
                canvas: {
                    width: canvasRect.width,
                    height: canvasRect.height,
                    ratio: canvasRect.width / canvasRect.height
                },
                container: {
                    width: containerRect.width,
                    height: containerRect.height,
                    ratio: containerRect.width / containerRect.height
                },
                pixiScreen: {
                    width: pixiApp.screen.width,
                    height: pixiApp.screen.height,
                    ratio: pixiApp.screen.width / pixiApp.screen.height
                },
                differences: {
                    width: Math.abs(canvasRect.width - containerRect.width),
                    height: Math.abs(canvasRect.height - containerRect.height)
                }
            });

        } catch (error) {
            this.addResult('Aspect Ratio', false, error);
        }
    }

    private addResult(testName: string, passed: boolean, details: any): void {
        this.results.push({ testName, passed, details });
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
        if (!passed && details) {
            console.log(`     Details:`, details);
        }
    }

    private reportResults(): boolean {
        console.log('\n' + '='.repeat(50));
        console.log('📊 VALIDATION SUMMARY');
        console.log('='.repeat(50));

        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        const allPassed = passed === total;

        console.log(`Overall Result: ${passed}/${total} tests passed ${allPassed ? '✅' : '❌'}`);

        if (!allPassed) {
            console.log('\n❌ FAILED TESTS:');
            this.results.filter(r => !r.passed).forEach(result => {
                console.log(`  • ${result.testName}`);
                if (result.details) {
                    console.log(`    Details:`, result.details);
                }
            });
        } else {
            console.log('\n🎉 All responsive features are working correctly!');
            console.log('✅ Canvas sizing and responsiveness');
            console.log('✅ Camera positioning and transforms');
            console.log('✅ Coordinate transformations');
            console.log('✅ Resize behavior');
            console.log('✅ Mouse coordinate accuracy');
            console.log('✅ Aspect ratio maintenance');
        }

        return allPassed;
    }
}

// Make it globally available
(window as any).ResponsiveValidation = ResponsiveValidation;
(window as any).validateResponsive = () => {
    const validator = new ResponsiveValidation();
    return validator.runCompleteValidation();
};
