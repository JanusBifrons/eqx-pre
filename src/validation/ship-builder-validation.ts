/**
 * Validation script to test all components of the refactored ShipBuilder
 */
import { Container } from 'pixi.js';
import { ShipBuilderRefactored } from '@/ui/ShipBuilderRefactored';
import { Ship } from '@/entities/Ship';

export class ShipBuilderValidation {
    private shipBuilder: ShipBuilderRefactored;
    private testContainer: Container;
    private validationResults: { [key: string]: boolean } = {};

    constructor() {
        this.testContainer = new Container();
        this.shipBuilder = new ShipBuilderRefactored(this.testContainer, {
            gridSize: 32,
            gridWidth: 25,
            gridHeight: 15,
            snapToGrid: true,
            showGrid: false,
            showConnectionPoints: true,
            enableDebugVisualization: true
        });
    }

    public async runAllValidations(): Promise<{ success: boolean; results: { [key: string]: boolean } }> {
        console.log('🧪 STARTING SHIPBUILDER VALIDATION TESTS');

        // Test 1: Component Initialization
        this.validationResults['component_initialization'] = this.testComponentInitialization();

        // Test 2: UI Component Creation
        this.validationResults['ui_components'] = this.testUIComponents();

        // Test 3: Event System
        this.validationResults['event_system'] = this.testEventSystem();

        // Test 4: Block Placement
        this.validationResults['block_placement'] = await this.testBlockPlacement();

        // Test 5: Ship Management
        this.validationResults['ship_management'] = this.testShipManagement();

        // Test 6: Resizing and Responsiveness
        this.validationResults['responsiveness'] = this.testResponsiveness();

        // Test 7: Cleanup and Destruction
        this.validationResults['cleanup'] = this.testCleanup();

        const allPassed = Object.values(this.validationResults).every(result => result);

        console.log('🧪 VALIDATION RESULTS:');
        Object.entries(this.validationResults).forEach(([test, result]) => {
            console.log(`  ${result ? '✅' : '❌'} ${test}: ${result ? 'PASS' : 'FAIL'}`);
        });

        console.log(`🧪 OVERALL: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

        return { success: allPassed, results: this.validationResults };
    }

    private testComponentInitialization(): boolean {
        try {
            // Test that ShipBuilder can be instantiated
            const testBuilder = new ShipBuilderRefactored(new Container());

            // Test that it has all required properties
            const hasShip = testBuilder.getShip() instanceof Ship;

            testBuilder.destroy();
            return hasShip;
        } catch (error) {
            console.error('Component initialization failed:', error);
            return false;
        }
    }

    private testUIComponents(): boolean {
        try {
            // Test that resize works without errors
            this.shipBuilder.resize(1600, 1000);
            return true;
        } catch (error) {
            console.error('UI components test failed:', error);
            return false;
        }
    }

    private testEventSystem(): boolean {
        try {
            // Test that we can get the ship (indicates internal wiring works)
            const ship = this.shipBuilder.getShip();
            return ship instanceof Ship;
        } catch (error) {
            console.error('Event system test failed:', error);
            return false;
        }
    }

    private async testBlockPlacement(): Promise<boolean> {
        try {
            // Test the connection system
            this.shipBuilder.testConnectionSystem();

            // Verify ship has blocks after test
            const ship = this.shipBuilder.getShip();
            const hasBlocks = ship.blocks.size > 0;

            return hasBlocks;
        } catch (error) {
            console.error('Block placement test failed:', error);
            return false;
        }
    }

    private testShipManagement(): boolean {
        try {
            // Test clear ship functionality
            this.shipBuilder.clearShip();
            const ship = this.shipBuilder.getShip();
            const isCleared = ship.blocks.size === 0;

            // Test repair connections (should handle empty ship gracefully)
            this.shipBuilder.repairConnections();

            return isCleared;
        } catch (error) {
            console.error('Ship management test failed:', error);
            return false;
        }
    }

    private testResponsiveness(): boolean {
        try {
            // Test multiple resize operations
            this.shipBuilder.resize(800, 600);
            this.shipBuilder.resize(1920, 1080);
            this.shipBuilder.resize(1600, 1000);
            return true;
        } catch (error) {
            console.error('Responsiveness test failed:', error);
            return false;
        }
    }

    private testCleanup(): boolean {
        try {
            // Test that destroy works without errors
            const testBuilder = new ShipBuilderRefactored(new Container());
            testBuilder.destroy();
            return true;
        } catch (error) {
            console.error('Cleanup test failed:', error);
            return false;
        }
    }
}

// Export function to run validation from browser console
(window as any).runShipBuilderValidation = async () => {
    const validator = new ShipBuilderValidation();
    return await validator.runAllValidations();
};
