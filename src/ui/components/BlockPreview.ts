import { Container, Graphics } from 'pixi.js';
import { Block } from '@/entities/Block';
import { BlockDefinitions } from '@/entities/BlockDefinitions';
import { BaseUIComponent } from './BaseUIComponent';

export class BlockPreview extends BaseUIComponent {
    private previewBlock: Block | null = null;
    private indicator: Graphics;
    private worldContainer: Container;

    constructor(worldContainer: Container) {
        super();
        this.worldContainer = worldContainer;
        this.indicator = new Graphics();
    }

    public showPreview(blockType: string): void {
        this.hidePreview();

        const definition = BlockDefinitions.get(blockType);
        const properties = BlockDefinitions.getDefaultProperties(blockType);

        if (definition) {
            this.previewBlock = new Block(definition, properties);
            this.previewBlock.container.alpha = 0.5;

            // Create placement indicator
            this.indicator.clear();
            this.indicator.lineStyle(2, 0x33FF33, 0.8);

            if (definition.shape === 'circle') {
                const radius = definition.width / 2;
                this.drawDashedCircle(this.indicator, 0, 0, radius + 2);
            } else {
                const width = definition.width;
                const height = definition.height;
                this.drawDashedRect(this.indicator, -width / 2 - 2, -height / 2 - 2, width + 4, height + 4);
            }

            this.previewBlock.container.addChild(this.indicator);

            // Start off-screen
            this.previewBlock.container.x = -10000;
            this.previewBlock.container.y = -10000;

            this.worldContainer.addChild(this.previewBlock.container);
        }
    }

    public hidePreview(): void {
        if (this.previewBlock) {
            this.previewBlock.destroy();
            this.previewBlock = null;
        }
    }

    public updatePosition(x: number, y: number, isValid: boolean, isWithinBounds: boolean, isOccupied: boolean): void {
        if (!this.previewBlock) return;

        this.previewBlock.setGridPosition({ x, y });
        this.previewBlock.container.x = x;
        this.previewBlock.container.y = y;

        // Update appearance based on validity
        if (isValid) {
            this.previewBlock.container.alpha = 0.5;
            this.updateIndicatorColor(0x33FF33); // Green for valid
        } else {
            this.previewBlock.container.alpha = 0.3;
            let indicatorColor: number;
            if (!isWithinBounds) {
                indicatorColor = 0xFF6600; // Orange for out of bounds
            } else if (isOccupied) {
                indicatorColor = 0xFF3333; // Red for occupied
            } else {
                indicatorColor = 0xFF3333; // Default red for other issues
            }
            this.updateIndicatorColor(indicatorColor);
        }
    }

    private updateIndicatorColor(color: number): void {
        if (!this.previewBlock) return;

        const definition = BlockDefinitions.get(this.previewBlock.definition.type);
        if (!definition) return;

        this.indicator.clear();
        this.indicator.lineStyle(2, color, 0.8);

        if (definition.shape === 'circle') {
            const radius = definition.width / 2;
            this.drawDashedCircle(this.indicator, 0, 0, radius + 2);
        } else {
            const width = definition.width;
            const height = definition.height;
            this.drawDashedRect(this.indicator, -width / 2 - 2, -height / 2 - 2, width + 4, height + 4);
        }
    }

    private drawDashedRect(graphics: Graphics, x: number, y: number, width: number, height: number): void {
        const dashLength = 4;
        const gapLength = 2;
        let currentPos = 0;

        // Draw top line
        while (currentPos < width) {
            const segLength = Math.min(dashLength, width - currentPos);
            if (currentPos % (dashLength + gapLength) < dashLength) {
                graphics.moveTo(x + currentPos, y);
                graphics.lineTo(x + currentPos + segLength, y);
            }
            currentPos += 1;
        }

        // Draw right line
        currentPos = 0;
        while (currentPos < height) {
            const segLength = Math.min(dashLength, height - currentPos);
            if (currentPos % (dashLength + gapLength) < dashLength) {
                graphics.moveTo(x + width, y + currentPos);
                graphics.lineTo(x + width, y + currentPos + segLength);
            }
            currentPos += 1;
        }

        // Draw bottom line
        currentPos = 0;
        while (currentPos < width) {
            const segLength = Math.min(dashLength, width - currentPos);
            if (currentPos % (dashLength + gapLength) < dashLength) {
                graphics.moveTo(x + width - currentPos, y + height);
                graphics.lineTo(x + width - currentPos - segLength, y + height);
            }
            currentPos += 1;
        }

        // Draw left line
        currentPos = 0;
        while (currentPos < height) {
            const segLength = Math.min(dashLength, height - currentPos);
            if (currentPos % (dashLength + gapLength) < dashLength) {
                graphics.moveTo(x, y + height - currentPos);
                graphics.lineTo(x, y + height - currentPos - segLength);
            }
            currentPos += 1;
        }
    }

    private drawDashedCircle(graphics: Graphics, centerX: number, centerY: number, radius: number): void {
        const segments = 32;
        const dashLength = 2;
        const gapLength = 1;

        for (let i = 0; i < segments; i++) {
            if (i % (dashLength + gapLength) < dashLength) {
                const startAngle = (i / segments) * Math.PI * 2;
                const endAngle = ((i + 1) / segments) * Math.PI * 2;

                const startX = centerX + Math.cos(startAngle) * radius;
                const startY = centerY + Math.sin(startAngle) * radius;
                const endX = centerX + Math.cos(endAngle) * radius;
                const endY = centerY + Math.sin(endAngle) * radius;

                graphics.moveTo(startX, startY);
                graphics.lineTo(endX, endY);
            }
        }
    }

    resize(_width: number, _height: number): void {
        // Block preview doesn't need to be repositioned on resize
    }
}
