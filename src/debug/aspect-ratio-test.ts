// Test script to verify aspect ratio correctness
// This script creates a perfect square block and verifies it renders as a square

export function createAspectRatioTest(container: HTMLElement) {
    console.log('🔍 Starting aspect ratio test...');

    // Create a test div with known square dimensions
    const testSquare = document.createElement('div');
    testSquare.style.width = '64px';
    testSquare.style.height = '64px';
    testSquare.style.backgroundColor = 'red';
    testSquare.style.position = 'absolute';
    testSquare.style.top = '10px';
    testSquare.style.left = '10px';
    testSquare.style.zIndex = '9999';
    testSquare.style.border = '2px solid white';
    testSquare.innerHTML = '64x64';
    testSquare.style.color = 'white';
    testSquare.style.fontSize = '10px';
    testSquare.style.textAlign = 'center';
    testSquare.style.lineHeight = '60px';

    container.appendChild(testSquare);

    // Measure the container
    const containerRect = container.getBoundingClientRect();
    console.log(`📐 Container dimensions: ${containerRect.width}x${containerRect.height}`);
    console.log(`📐 Container aspect ratio: ${(containerRect.width / containerRect.height).toFixed(3)}`);

    // Find the canvas
    const canvas = container.querySelector('canvas');
    if (canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        const canvasAspectRatio = canvasRect.width / canvasRect.height;

        console.log(`🎨 Canvas displayed dimensions: ${canvasRect.width}x${canvasRect.height}`);
        console.log(`🎨 Canvas internal dimensions: ${canvas.width}x${canvas.height}`);
        console.log(`🎨 Canvas aspect ratio (displayed): ${canvasAspectRatio.toFixed(3)}`);
        console.log(`🎨 Canvas aspect ratio (internal): ${(canvas.width / canvas.height).toFixed(3)}`);

        // Check if aspect ratios match
        const aspectRatioDiff = Math.abs(canvasAspectRatio - (canvas.width / canvas.height));
        if (aspectRatioDiff > 0.01) {
            console.warn('⚠️ ASPECT RATIO MISMATCH DETECTED!');
            console.warn(`   Displayed aspect ratio: ${canvasAspectRatio.toFixed(3)}`);
            console.warn(`   Internal aspect ratio: ${(canvas.width / canvas.height).toFixed(3)}`);
            console.warn(`   Difference: ${aspectRatioDiff.toFixed(3)}`);
        } else {
            console.log('✅ Aspect ratios match - no distortion detected');
        }

        // Test square measurement
        setTimeout(() => {
            const testRect = testSquare.getBoundingClientRect();
            console.log(`🔍 Test square dimensions: ${testRect.width}x${testRect.height}`);
            if (Math.abs(testRect.width - testRect.height) > 1) {
                console.warn('⚠️ Test square is not square! Container may be distorting content.');
            } else {
                console.log('✅ Test square maintains square shape');
            }
        }, 100);
    }

    // Clean up after 5 seconds
    setTimeout(() => {
        if (testSquare.parentNode) {
            testSquare.parentNode.removeChild(testSquare);
        }
    }, 5000);

    return {
        cleanup: () => {
            if (testSquare.parentNode) {
                testSquare.parentNode.removeChild(testSquare);
            }
        }
    };
}
