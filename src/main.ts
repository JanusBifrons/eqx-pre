import { runAsteroidsDemo } from './demo/asteroids-demo';
import { runEnhancedDemo } from './enhanced-demo';
import { initializeShipBuilderDemo } from './demo/ship-builder-demo';

async function main() {
    // Create a simple demo selector
    const demoSelector = document.createElement('div');
    demoSelector.style.position = 'fixed';
    demoSelector.style.top = '10px';
    demoSelector.style.left = '10px';
    demoSelector.style.zIndex = '1000';
    demoSelector.style.background = 'rgba(0,0,0,0.8)';
    demoSelector.style.padding = '10px';
    demoSelector.style.borderRadius = '5px';
    demoSelector.innerHTML = `
        <h3 style="color: white; margin: 0 0 10px 0;">Demo Selector</h3>
        <button id="shipBuilderBtn" style="display: block; margin: 5px 0; padding: 8px 16px;">Ship Builder</button>
        <button id="asteroidsBtn" style="display: block; margin: 5px 0; padding: 8px 16px;">Asteroids Demo</button>
        <button id="enhancedBtn" style="display: block; margin: 5px 0; padding: 8px 16px;">Enhanced Demo</button>
    `;
    document.body.appendChild(demoSelector);    // Add event listeners
    document.getElementById('shipBuilderBtn')?.addEventListener('click', async () => {
        document.body.innerHTML = '';
        try {
            await initializeShipBuilderDemo();
        } catch (error) {
            console.error('❌ Failed to start ship builder demo:', error);
        }
    });

    document.getElementById('asteroidsBtn')?.addEventListener('click', () => {
        document.body.innerHTML = '';
        try {
            runAsteroidsDemo();
        } catch (error) {
            console.error('❌ Failed to start asteroids demo:', error);
        }
    });

    document.getElementById('enhancedBtn')?.addEventListener('click', () => {
        document.body.innerHTML = '';
        try {
            runEnhancedDemo();
        } catch (error) {
            console.error('❌ Failed to start enhanced demo:', error);
        }
    });    // Start with ship builder demo by default
    try {
        await initializeShipBuilderDemo();
    } catch (error) {
        console.error('❌ Failed to start ship builder demo:', error);
    }
}

// Start the application
main();
