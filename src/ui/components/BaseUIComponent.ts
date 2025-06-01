import { Container } from 'pixi.js';
import { IUIEvents } from '../interfaces/IUIComponent';

// Simple event emitter for UI components
export class UIEventEmitter implements IUIEvents {
    private events: Map<string, Array<(...args: any[]) => void>> = new Map();

    on(event: string, callback: (...args: any[]) => void): void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event)!.push(callback);
    }

    emit(event: string, ...args: any[]): void {
        const callbacks = this.events.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(...args));
        }
    }

    off(event: string, callback?: (...args: any[]) => void): void {
        if (!callback) {
            this.events.delete(event);
            return;
        }

        const callbacks = this.events.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    destroy(): void {
        this.events.clear();
    }
}

// Base class for UI components with event handling
export abstract class BaseUIComponent extends UIEventEmitter {
    protected container: Container;
    protected isVisible: boolean = true;

    constructor(container?: Container) {
        super();
        this.container = container || new Container();
    }

    getContainer(): Container {
        return this.container;
    }

    show(): void {
        this.isVisible = true;
        this.container.visible = true;
    }

    hide(): void {
        this.isVisible = false;
        this.container.visible = false;
    }

    setPosition(x: number, y: number): void {
        this.container.x = x;
        this.container.y = y;
    }

    abstract resize(width: number, height: number): void;

    destroy(): void {
        super.destroy();
        this.container.destroy({ children: true });
    }
}
