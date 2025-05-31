import { runEnhancedDemo } from './enhanced-demo';

async function main() {
    try {
        await runEnhancedDemo();
    } catch (error) {
        console.error('❌ Failed to start enhanced demo:', error);
    }
}

// Start the application
main();
