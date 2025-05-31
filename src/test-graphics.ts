// Test file to check PixiJS Graphics API
import { Graphics } from 'pixi.js';

const graphics = new Graphics();

// Try different API calls to see what works
console.log('Graphics methods:', Object.getOwnPropertyNames(Graphics.prototype));
console.log('Graphics instance methods:', Object.getOwnPropertyNames(graphics));

// Test both old and new API
try {
    graphics.rect(0, 0, 50, 50);
    console.log('New API rect() works');
} catch (e) {
    console.log('New API rect() failed:', e);
}

try {
    graphics.drawRect(0, 0, 50, 50);
    console.log('Old API drawRect() works');
} catch (e) {
    console.log('Old API drawRect() failed:', e);
}
