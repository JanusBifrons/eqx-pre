import { Container, Graphics, Text } from 'pixi.js';
import { BaseUIComponent } from './BaseUIComponent';

export interface ActionButton {
    label: string;
    color: number;
    borderColor: number;
    textColor: number;
    action: () => void;
}

export class ActionButtons extends BaseUIComponent {
    private readonly BUTTON_WIDTH = 120;
    private readonly BUTTON_HEIGHT = 40;
    private buttons: Container[] = [];

    constructor() {
        super();
    }

    public addButton(config: ActionButton): void {
        const button = this.createButton(config);
        this.container.addChild(button);
        this.buttons.push(button);
        this.repositionButtons();
    }

    private createButton(config: ActionButton): Container {
        const button = new Container();

        // Button background
        const bg = new Graphics();
        bg.beginFill(config.color, 0.8);
        bg.lineStyle(2, config.borderColor);
        bg.drawRect(0, 0, this.BUTTON_WIDTH, this.BUTTON_HEIGHT);
        bg.endFill();
        button.addChild(bg);

        // Button text
        const text = new Text(config.label, {
            fontSize: 14,
            fill: config.textColor,
            fontFamily: 'Arial'
        });
        text.x = (this.BUTTON_WIDTH - text.width) / 2;
        text.y = (this.BUTTON_HEIGHT - text.height) / 2;
        button.addChild(text);

        // Make interactive
        button.interactive = true;
        button.eventMode = 'static';
        button.on('pointerdown', config.action);

        return button;
    }

    private repositionButtons(): void {
        this.buttons.forEach((button, index) => {
            button.y = index * (this.BUTTON_HEIGHT + 10);
        });
    }

    public clearButtons(): void {
        this.buttons.forEach(button => button.destroy());
        this.buttons = [];
        this.container.removeChildren();
    }

    resize(width: number, height: number): void {
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        this.setPosition(halfWidth - this.BUTTON_WIDTH - 10, -halfHeight + 220);
    }
}
