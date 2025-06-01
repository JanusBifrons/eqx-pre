import { Container, Graphics, Text } from 'pixi.js';
import { BaseUIComponent } from './BaseUIComponent';
import { BlockDefinitions } from '@/entities/BlockDefinitions';
import { BlockType } from '@/entities/Block';

export class BlockPalette extends BaseUIComponent {
    private readonly PALETTE_WIDTH = 200;
    private readonly PALETTE_HEIGHT = 600;
    private selectedButton: Container | null = null;
    private selectedBlockType: string | null = null;

    constructor() {
        super();
        this.setupPalette();
    }

    private setupPalette(): void {
        // Create palette background
        const bg = new Graphics();
        bg.beginFill(0x222222, 0.9);
        bg.drawRect(0, 0, this.PALETTE_WIDTH, this.PALETTE_HEIGHT);
        bg.endFill();
        this.container.addChild(bg);

        // Add title
        const title = new Text('Block Palette', { fill: 0xFFFFFF, fontSize: 16 });
        title.x = 10;
        title.y = 10;
        this.container.addChild(title);

        // Add block categories
        this.addBlockCategories();
    }

    private addBlockCategories(): void {
        let currentY = 40;
        const categories = [
            { type: BlockType.HULL, label: 'Hull Blocks' },
            { type: BlockType.ENGINE, label: 'Engines' },
            { type: BlockType.WEAPON, label: 'Weapons' },
            { type: BlockType.UTILITY, label: 'Utilities' }
        ];

        for (const category of categories) {
            // Category header
            const categoryText = new Text(category.label, { fill: 0xCCCCCC, fontSize: 14 });
            categoryText.x = 10;
            categoryText.y = currentY;
            this.container.addChild(categoryText);
            currentY += 25;

            // Add blocks of this type
            const blocksOfType = BlockDefinitions.getByType(category.type);
            for (const { id, definition } of blocksOfType) {
                const blockButton = this.createBlockButton(id, definition, 10, currentY);
                this.container.addChild(blockButton);
                currentY += 60;
            }

            currentY += 10; // Extra spacing between categories
        }
    }

    private createBlockButton(blockId: string, definition: any, x: number, y: number): Container {
        const button = new Container();
        button.x = x;
        button.y = y;

        // Button background
        const bg = new Graphics();
        bg.beginFill(0x444444, 0.8);
        bg.lineStyle(2, 0x666666);
        bg.drawRect(0, 0, 180, 50);
        bg.endFill();
        button.addChild(bg);

        // Block preview (scaled down)
        const preview = new Graphics();
        const scale = 0.8;
        preview.beginFill(definition.color, 0.8);
        preview.lineStyle(1, 0xFFFFFF, 0.8);

        switch (definition.shape) {
            case 'circle':
                preview.drawCircle(25, 25, definition.width * scale / 2);
                break;
            case 'rectangle':
            default:
                const w = definition.width * scale;
                const h = definition.height * scale;
                preview.drawRect(25 - w / 2, 25 - h / 2, w, h);
                break;
        }
        preview.endFill();
        button.addChild(preview);

        // Block name
        const nameText = new Text(blockId.replace('_', ' '), {
            fill: 0xFFFFFF,
            fontSize: 10,
            wordWrap: true,
            wordWrapWidth: 120
        });
        nameText.x = 55;
        nameText.y = 10;
        button.addChild(nameText);

        // Block stats
        const statsText = new Text(`Mass: ${definition.mass}\nHP: ${definition.maxHealth}`, {
            fill: 0xCCCCCC,
            fontSize: 8
        });
        statsText.x = 55;
        statsText.y = 25;
        button.addChild(statsText);

        // Make interactive
        button.interactive = true;
        button.eventMode = 'static';
        button.on('pointerdown', () => this.selectBlock(blockId, button));

        return button;
    }

    private selectBlock(blockId: string, buttonContainer: Container): void {
        // Update visual selection feedback
        if (this.selectedButton) {
            this.resetButtonAppearance(this.selectedButton);
        }

        // Highlight current selection
        this.selectedButton = buttonContainer;
        this.highlightButton(buttonContainer);
        this.selectedBlockType = blockId;

        // Emit selection event
        this.emit('blockSelected', blockId);
    }

    private resetButtonAppearance(button: Container): void {
        const bg = button.getChildAt(0) as Graphics;
        bg.clear();
        bg.beginFill(0x444444, 0.8);
        bg.lineStyle(2, 0x666666);
        bg.drawRect(0, 0, 180, 50);
        bg.endFill();
    }

    private highlightButton(button: Container): void {
        const bg = button.getChildAt(0) as Graphics;
        bg.clear();
        bg.beginFill(0x004488, 0.9);
        bg.lineStyle(3, 0x00AAFF);
        bg.drawRect(0, 0, 180, 50);
        bg.endFill();
    }

    public deselectBlock(): void {
        if (this.selectedButton) {
            this.resetButtonAppearance(this.selectedButton);
            this.selectedButton = null;
        }
        this.selectedBlockType = null;
        this.emit('blockDeselected');
    }

    public getSelectedBlockType(): string | null {
        return this.selectedBlockType;
    }

    resize(width: number, height: number): void {
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        this.setPosition(-halfWidth + 10, -halfHeight + 10);
    }
}
