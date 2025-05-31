import { runAsteroidsDemo } from './demo/asteroids-demo';
import { runEnhancedDemo } from './enhanced-demo';

async function main() {
    try {
        await runAsteroidsDemo();
    } catch (error) {
        console.error('❌ Failed to start enhanced demo:', error);
    }
}

// Start the application
main();
