import { Graphics, Text } from 'pixi.js';
import { BaseUIComponent } from './BaseUIComponent';

export class InstructionsPanel extends BaseUIComponent {
    private readonly INSTRUCTIONS_WIDTH = 350;
    private readonly INSTRUCTIONS_HEIGHT = 250;

    constructor() {
        super();
        this.setupInstructions();
    }

    private setupInstructions(): void {
        // Instructions background with border
        const instructionsBg = new Graphics();
        instructionsBg.beginFill(0x1a1a1a, 0.95);
        instructionsBg.lineStyle(3, 0x00AAFF, 0.8);
        instructionsBg.drawRect(0, 0, this.INSTRUCTIONS_WIDTH, this.INSTRUCTIONS_HEIGHT);
        instructionsBg.endFill();
        this.container.addChild(instructionsBg);

        // Instructions title with glow effect
        const title = new Text('🚀 Ship Builder Controls', {
            fill: 0x00AAFF,
            fontSize: 18,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: 0x004488,
            dropShadowBlur: 4,
            dropShadowDistance: 2
        });
        title.x = 10;
        title.y = 8;
        this.container.addChild(title);

        // Instructions text with better formatting
        const instructions = [
            '🎯 Click blocks in LEFT PALETTE to select them',
            '📍 Click in BUILDING AREA to place selected blocks',
            '❌ Press ESC or right-click to deselect block type',
            '🔗 Blocks auto-connect when placed adjacent',
            '🔨 BUILD MODE: Construct and modify your ship',
            '🚀 TEST MODE: Pilot ship with WASD keys',
            '📊 View ship stats in the RIGHT PANEL',
            '',
            '🎨 Block Preview Colors:',
            '   • 🟢 Green: Valid placement position',
            '   • 🟠 Orange: Outside building area',
            '   • 🔴 Red: Position occupied by another block',
            '',
            '🎮 Camera Controls:',
            '   • Middle-click & drag to pan camera',
            '   • Mouse wheel to zoom in/out',
            '   • Shift+Arrow keys to pan',
            '   • Ctrl+R to reset camera view',
            '   • Ctrl +/- to zoom'
        ];

        const instructionText = new Text(instructions.join('\n'), {
            fill: 0xEEEEEE,
            fontSize: 12,
            lineHeight: 18,
            wordWrap: true,
            wordWrapWidth: this.INSTRUCTIONS_WIDTH - 20
        });
        instructionText.x = 10;
        instructionText.y = 35;
        this.container.addChild(instructionText);
    } resize(_width: number, height: number): void {
        const halfHeight = height / 2;
        this.setPosition(-this.INSTRUCTIONS_WIDTH / 2, halfHeight - this.INSTRUCTIONS_HEIGHT - 10);
    }
}
