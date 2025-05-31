import { Graphics, Sprite, Texture, Container } from 'pixi.js';
import { IComponent } from '@/core/types';

export class RenderComponent implements IComponent {
    public readonly type = 'render';
    public readonly entityId: string;
    public displayObject: Graphics | Sprite;
    public visible: boolean = true;
    public alpha: number = 1;
    public tint: number = 0xffffff;
    public zIndex: number = 0;

    constructor(entityId: string, displayObject?: Graphics | Sprite) {
        this.entityId = entityId;
        this.displayObject = displayObject || new Graphics();
    }

    static fromTexture(entityId: string, texture: Texture): RenderComponent {
        const sprite = new Sprite(texture);
        return new RenderComponent(entityId, sprite);
    }

    static fromGraphics(entityId: string, graphics: Graphics): RenderComponent {
        return new RenderComponent(entityId, graphics);
    }

    setVisible(visible: boolean): void {
        this.visible = visible;
        this.displayObject.visible = visible;
    }

    setAlpha(alpha: number): void {
        this.alpha = alpha;
        this.displayObject.alpha = alpha;
    }

    setTint(tint: number): void {
        this.tint = tint;
        this.displayObject.tint = tint;
    }

    setZIndex(zIndex: number): void {
        this.zIndex = zIndex;
        (this.displayObject as Container).zIndex = zIndex;
    }
}
