/**
 * Ship Builder Debug Test
 * 
 * This file contains systematic tests to identify the root cause of the hover preview issue.
 * The issue: Hover preview stops working after placing the first block.
 */

export class ShipBuilderTest {
    private shipBuilder: any;
    private testResults: any[] = [];

    constructor(shipBuilder: any) {
        this.shipBuilder = shipBuilder;
    }

    /**
     * Run all tests to identify the hover preview issue
     */
    public async runAllTests(): Promise<void> {
        console.log('🧪 STARTING SHIP BUILDER HOVER PREVIEW TESTS');
        console.log('='.repeat(50));
        
        this.clearResults();
        
        try {
            await this.test1_InitialState();
            await this.test2_SelectBlock();
            await this.test3_HoverBeforePlacement();
            await this.test4_PlaceFirstBlock();
            await this.test5_HoverAfterPlacement();
            await this.test6_GridBoundsValidation();
            await this.test7_CoordinateTransformation();
            await this.test8_PreviewStateValidation();
        } catch (error) {
            console.error('❌ Test suite failed:', error);
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
        if (!passed || details.warnings) {
            console.log('  Details:', details);
        }
    }

    /**
     * Test 1: Check initial system state
     */
    private async test1_InitialState(): Promise<void> {
        const state = {
            hasShipBuilder: !!this.shipBuilder,
            selectedBlockType: this.shipBuilder?.getSelectedBlockType(),
            isBuildingMode: this.shipBuilder?.isBuildingMode(),
            shipBlockCount: this.shipBuilder?.getShip()?.blocks?.size || 0,
            hasPreviewBlock: this.shipBuilder?.blockPreview?.hasPreviewBlock()
        };

        const passed = state.hasShipBuilder && 
                      state.selectedBlockType === null && 
                      state.isBuildingMode === true && 
                      state.shipBlockCount === 0;

        this.addResult('Initial State', passed, state);
    }

    /**
     * Test 2: Select a block type
     */
    private async test2_SelectBlock(): Promise<void> {
        try {
            this.shipBuilder.selectBlockType('hull_basic');
            
            const state = {
                selectedBlockType: this.shipBuilder.getSelectedBlockType(),
                hasPreviewBlock: this.shipBuilder.blockPreview.hasPreviewBlock(),
                isPanMode: this.shipBuilder.inputHandler?.getPanMode()
            };

            const passed = state.selectedBlockType === 'hull_basic' &&
                          state.hasPreviewBlock === true &&
                          state.isPanMode === false;

            this.addResult('Block Selection', passed, state);        } catch (error: any) {
            this.addResult('Block Selection', false, { error: error?.message || String(error) });
        }
    }

    /**
     * Test 3: Test hover preview before placing any blocks
     */
    private async test3_HoverBeforePlacement(): Promise<void> {
        try {
            // Simulate mouse move to center of grid
            const centerPos = { x: 0, y: 0 };
            
            // Get current state before hover
            const stateBefore = {
                hasPreviewBlock: this.shipBuilder.blockPreview.hasPreviewBlock(),
                selectedBlockType: this.shipBuilder.getSelectedBlockType()
            };            // Simulate mouse move (this would normally be called by InputHandler)
            this.shipBuilder.testHandleMouseMove?.(centerPos, centerPos);

            const stateAfter = {
                hasPreviewBlock: this.shipBuilder.blockPreview.hasPreviewBlock(),
                selectedBlockType: this.shipBuilder.getSelectedBlockType()
            };

            const passed = stateBefore.hasPreviewBlock && 
                          stateAfter.hasPreviewBlock &&
                          stateBefore.selectedBlockType === stateAfter.selectedBlockType;

            this.addResult('Hover Before Placement', passed, {
                before: stateBefore,
                after: stateAfter,
                centerPos
            });        } catch (error: any) {
            this.addResult('Hover Before Placement', false, { error: error?.message || String(error) });
        }
    }

    /**
     * Test 4: Place the first block
     */
    private async test4_PlaceFirstBlock(): Promise<void> {
        try {
            const placementPos = { x: 0, y: 0 };
            
            const stateBefore = {
                shipBlockCount: this.shipBuilder.getShip().blocks.size,
                hasPreviewBlock: this.shipBuilder.blockPreview.hasPreviewBlock(),
                selectedBlockType: this.shipBuilder.getSelectedBlockType()
            };            // Simulate left click to place block
            this.shipBuilder.testHandleLeftClick?.(placementPos, placementPos);

            const stateAfter = {
                shipBlockCount: this.shipBuilder.getShip().blocks.size,
                hasPreviewBlock: this.shipBuilder.blockPreview.hasPreviewBlock(),
                selectedBlockType: this.shipBuilder.getSelectedBlockType()
            };

            const passed = stateAfter.shipBlockCount === stateBefore.shipBlockCount + 1 &&
                          stateAfter.hasPreviewBlock === true &&
                          stateAfter.selectedBlockType === stateBefore.selectedBlockType;

            this.addResult('First Block Placement', passed, {
                before: stateBefore,
                after: stateAfter,
                placementPos
            });
        } catch (error: any) {
            this.addResult('First Block Placement', false, { error: error?.message || String(error) });
        }
    }

    /**
     * Test 5: Test hover preview after placing the first block (THIS IS WHERE THE BUG SHOULD MANIFEST)
     */
    private async test5_HoverAfterPlacement(): Promise<void> {
        try {
            // Move to a different position
            const hoverPos = { x: 32, y: 0 };
            
            const stateBefore = {
                hasPreviewBlock: this.shipBuilder.blockPreview.hasPreviewBlock(),
                selectedBlockType: this.shipBuilder.getSelectedBlockType(),
                shipBlockCount: this.shipBuilder.getShip().blocks.size
            };            // Simulate mouse move
            this.shipBuilder.testHandleMouseMove?.(hoverPos, hoverPos);

            const stateAfter = {
                hasPreviewBlock: this.shipBuilder.blockPreview.hasPreviewBlock(),
                selectedBlockType: this.shipBuilder.getSelectedBlockType(),
                shipBlockCount: this.shipBuilder.getShip().blocks.size
            };

            // The critical test: preview should still work after placing a block
            const passed = stateAfter.hasPreviewBlock && 
                          stateAfter.selectedBlockType === stateBefore.selectedBlockType;

            const warnings = [];
            if (!stateAfter.hasPreviewBlock) {
                warnings.push('Preview block is missing after first placement - THIS IS THE BUG!');
            }

            this.addResult('Hover After Placement', passed, {
                before: stateBefore,
                after: stateAfter,
                hoverPos,
                warnings
            });
        } catch (error: any) {
            this.addResult('Hover After Placement', false, { error: error?.message || String(error) });
        }
    }

    /**
     * Test 6: Validate grid bounds configuration
     */
    private async test6_GridBoundsValidation(): Promise<void> {
        try {
            const gridConfig = {
                gridSize: this.shipBuilder.options?.gridSize,
                gridWidth: this.shipBuilder.options?.gridWidth,
                gridHeight: this.shipBuilder.options?.gridHeight
            };

            const buildArea = {
                width: gridConfig.gridWidth * gridConfig.gridSize,
                height: gridConfig.gridHeight * gridConfig.gridSize,
                halfWidth: (gridConfig.gridWidth * gridConfig.gridSize) / 2,
                halfHeight: (gridConfig.gridHeight * gridConfig.gridSize) / 2
            };

            // Test various positions for bounds checking
            const testPositions = [
                { x: 0, y: 0, shouldBeValid: true, name: 'center' },
                { x: buildArea.halfWidth - 16, y: 0, shouldBeValid: true, name: 'right edge' },
                { x: buildArea.halfWidth + 16, y: 0, shouldBeValid: false, name: 'outside right' },
                { x: -buildArea.halfWidth + 16, y: 0, shouldBeValid: true, name: 'left edge' },
                { x: -buildArea.halfWidth - 16, y: 0, shouldBeValid: false, name: 'outside left' }
            ];            const results = testPositions.map(pos => {
                const isWithinBounds = this.shipBuilder.testIsPositionWithinBounds?.(
                    { x: pos.x, y: pos.y }, 
                    { width: 32, height: 32 }
                );
                return {
                    ...pos,
                    actualResult: isWithinBounds,
                    correct: isWithinBounds === pos.shouldBeValid
                };
            });

            const allCorrect = results.every(r => r.correct);

            this.addResult('Grid Bounds Validation', allCorrect, {
                gridConfig,
                buildArea,
                testResults: results
            });
        } catch (error: any) {
            this.addResult('Grid Bounds Validation', false, { error: error?.message || String(error) });
        }
    }

    /**
     * Test 7: Validate coordinate transformation
     */
    private async test7_CoordinateTransformation(): Promise<void> {
        try {
            const camera = this.shipBuilder.getCamera?.();
            if (!camera) {
                this.addResult('Coordinate Transformation', false, { error: 'No camera available' });
                return;
            }

            // Test world-to-screen and screen-to-world conversion
            const testWorldPos = { x: 100, y: 50 };
            const screenPos = camera.worldToScreen?.(testWorldPos);
            const backToWorld = camera.screenToWorld?.(screenPos);

            const transformationAccurate = backToWorld && 
                Math.abs(backToWorld.x - testWorldPos.x) < 0.1 &&
                Math.abs(backToWorld.y - testWorldPos.y) < 0.1;            this.addResult('Coordinate Transformation', transformationAccurate, {
                originalWorld: testWorldPos,
                screenPos,
                backToWorld,
                cameraState: {
                    x: camera.x,
                    y: camera.y,
                    zoom: camera.zoom
                }
            });
        } catch (error: any) {
            this.addResult('Coordinate Transformation', false, { error: error?.message || String(error) });
        }
    }

    /**
     * Test 8: Validate preview state after operations
     */
    private async test8_PreviewStateValidation(): Promise<void> {
        try {
            // Get the preview block instance
            const previewBlock = this.shipBuilder.blockPreview?.getPreviewBlock?.();
              const state = {
                hasPreviewBlock: !!previewBlock,
                previewInWorldContainer: false,
                previewPosition: null as { x: number; y: number } | null,
                previewType: null as string | null
            };

            if (previewBlock) {
                state.previewInWorldContainer = this.shipBuilder.worldContainer?.children?.includes(previewBlock.container);
                state.previewPosition = {
                    x: previewBlock.container.x,
                    y: previewBlock.container.y
                };
                state.previewType = previewBlock.definition?.type;
            }

            // Check if preview is properly attached to world container
            const passed = state.hasPreviewBlock && state.previewInWorldContainer;

            this.addResult('Preview State Validation', passed, state);
        } catch (error: any) {
            this.addResult('Preview State Validation', false, { error: error?.message || String(error) });
        }
    }

    private printResults(): void {
        console.log('\n🧪 TEST RESULTS SUMMARY');
        console.log('='.repeat(50));
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        console.log(`Tests passed: ${passed}/${total}`);
        
        const failed = this.testResults.filter(r => !r.passed);
        if (failed.length > 0) {
            console.log('\n❌ FAILED TESTS:');
            failed.forEach(test => {
                console.log(`- ${test.test}: ${JSON.stringify(test.details, null, 2)}`);
            });
        }
        
        console.log('\n📊 Full test data available in window.testResults');
        (window as any).testResults = this.testResults;
    }
}

// Expose test runner globally
export function createTestRunner(shipBuilder: any): ShipBuilderTest {
    return new ShipBuilderTest(shipBuilder);
}
