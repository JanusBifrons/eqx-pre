import { Engine, World, Bodies, Body, Render, Mouse, MouseConstraint, Events } from 'matter-js';
import { Graphics } from 'pixi.js';
import { ISystem, Vector2 } from '@/core/types';
import { serviceContainer } from '@/core/ServiceContainer';
import { CollisionManager } from './CollisionManager';

export interface PhysicsConfig {
    gravity: Vector2;
    enableSleeping: boolean;
    timeScale: number;
    enableDebugRender: boolean;
}

export interface RigidBodyOptions {
    isStatic?: boolean;
    isSensor?: boolean;
    density?: number;
    friction?: number;
    frictionAir?: number;
    restitution?: number;
    mass?: number;
    angle?: number;
    angularVelocity?: number;
    velocity?: Vector2;
    label?: string;
    collisionFilter?: {
        category?: number;
        mask?: number;
        group?: number;
    };
}

export class PhysicsSystem implements ISystem {
    public readonly name = 'physics';
    private engine: Engine;
    private world: World;
    private config: PhysicsConfig;
    private debugRender?: Render;
    private mouseConstraint?: MouseConstraint;
    private bodyMap = new Map<string, Body>();
    private collisionManager?: CollisionManager;
    private currentDragLine?: Graphics;
    private dragStartPos?: { x: number, y: number };

    constructor(config: Partial<PhysicsConfig> = {}) {
        this.config = {
            gravity: { x: 0, y: 0 },
            enableSleeping: true,
            timeScale: 1,
            enableDebugRender: false,
            ...config,
        };

        this.engine = Engine.create();
        this.world = this.engine.world;

        this.configureEngine();
        this.setupCollisionManager();
        this.setupEvents();

        if (this.config.enableDebugRender) {
            this.setupDebugRender();
        }
    }

    update(deltaTime: number): void {
        Engine.update(this.engine, deltaTime * 1000);
    }

    // Body management methods
    addBody(body: Body, entityId?: string): void {
        World.add(this.world, body);
        if (entityId) {
            this.bodyMap.set(entityId, body);
            body.label = entityId;
        }
    }

    removeBody(body: Body): void {
        World.remove(this.world, body);
        for (const [entityId, mappedBody] of this.bodyMap.entries()) {
            if (mappedBody === body) {
                this.bodyMap.delete(entityId);
                break;
            }
        }
    }

    getBodyByEntityId(entityId: string): Body | undefined {
        return this.bodyMap.get(entityId);
    }

    // Body creation methods
    createBox(x: number, y: number, width: number, height: number, options: RigidBodyOptions = {}): Body {
        const body = Bodies.rectangle(x, y, width, height, this.processOptions(options));
        return body;
    }

    createCircle(x: number, y: number, radius: number, options: RigidBodyOptions = {}): Body {
        const body = Bodies.circle(x, y, radius, this.processOptions(options));
        return body;
    }

    createPolygon(x: number, y: number, sides: number, radius: number, options: RigidBodyOptions = {}): Body {
        const body = Bodies.polygon(x, y, sides, radius, this.processOptions(options));
        return body;
    }

    createFromVertices(x: number, y: number, vertices: Vector2[], options: RigidBodyOptions = {}): Body {
        const body = Bodies.fromVertices(x, y, [vertices] as any, this.processOptions(options));
        return body;
    }

    // Physics configuration methods
    setGravity(x: number, y: number): void {
        this.engine.gravity.x = x;
        this.engine.gravity.y = y;
        this.config.gravity = { x, y };
    }

    setZeroGravity(): void {
        this.setGravity(0, 0);
    }

    setEarthGravity(): void {
        this.setGravity(0, 0.98);
    }

    setTimeScale(scale: number): void {
        this.engine.timing.timeScale = scale;
        this.config.timeScale = scale;
    }

    pausePhysics(): void {
        this.setTimeScale(0);
    }

    resumePhysics(): void {
        this.setTimeScale(this.config.timeScale);
    }

    // Body manipulation methods
    applyForce(body: Body, force: Vector2, point?: Vector2): void {
        const position = point || body.position;
        Body.applyForce(body, position, force);
    }

    setVelocity(body: Body, velocity: Vector2): void {
        Body.setVelocity(body, velocity);
    }

    setAngularVelocity(body: Body, velocity: number): void {
        Body.setAngularVelocity(body, velocity);
    }

    setPosition(body: Body, position: Vector2): void {
        Body.setPosition(body, position);
    }

    setAngle(body: Body, angle: number): void {
        Body.setAngle(body, angle);
    }

    setStatic(body: Body, isStatic: boolean): void {
        Body.setStatic(body, isStatic);
    }

    // Query methods
    getBodiesInRegion(topLeft: Vector2, bottomRight: Vector2): Body[] {
        return this.world.bodies.filter(body => {
            const pos = body.position;
            return pos.x >= topLeft.x && pos.x <= bottomRight.x &&
                pos.y >= topLeft.y && pos.y <= bottomRight.y;
        });
    }

    getBodiesAtPoint(point: Vector2): Body[] {
        return this.world.bodies.filter(body => {
            const bounds = body.bounds;
            return point.x >= bounds.min.x && point.x <= bounds.max.x &&
                point.y >= bounds.min.y && point.y <= bounds.max.y;
        });
    }

    // Debug rendering
    enableDebugRender(canvas?: HTMLCanvasElement): void {
        if (this.debugRender) return;

        const targetCanvas = canvas || document.querySelector('canvas');
        if (!targetCanvas) {
            console.warn('No canvas found for debug rendering');
            return;
        }

        this.debugRender = Render.create({
            canvas: targetCanvas,
            engine: this.engine,
            options: {
                width: targetCanvas.width,
                height: targetCanvas.height,
                wireframes: false,
                background: 'transparent',
                showAngleIndicator: true,
                showVelocity: true,
                showCollisions: true,
            },
        });

        Render.run(this.debugRender);
    }

    disableDebugRender(): void {
        if (this.debugRender) {
            Render.stop(this.debugRender);
            this.debugRender = undefined;
        }
    }

    // Mouse interaction
    enableMouseInteraction(canvas: HTMLCanvasElement): void {
        if (this.mouseConstraint) {
            return;
        }

        const mouse = Mouse.create(canvas);

        // Calculate the proper pixel ratio for coordinate transformation
        const displayRect = canvas.getBoundingClientRect();
        const actualWidth = canvas.width;
        const displayWidth = displayRect.width;

        // Set the pixel ratio to match the scaling
        mouse.pixelRatio = actualWidth / displayWidth;
        mouse.element = canvas;

        this.mouseConstraint = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 1.0,
                render: {
                    visible: false,
                },
                damping: 0.1,
                length: 0,
            },
        });

        World.add(this.world, this.mouseConstraint);

        // Add mouse constraint event listeners
        Events.on(this.mouseConstraint, 'startdrag', (event: any) => {
            if (event.source.constraint.bodyB) {
                const body = event.source.constraint.bodyB;
                this.highlightBody(body, 0x00ff00);
            }
        });

        Events.on(this.mouseConstraint, 'enddrag', () => {
            this.clearBodyHighlights();
        });

        // Add mouse event handlers
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.dragStartPos = { x, y };
            this.createClickMarker(x, y);

            const bodiesAtPoint = this.getBodiesAtPoint({ x, y });
            if (bodiesAtPoint.length > 0) {
                this.highlightBody(bodiesAtPoint[0], 0x00ff00);
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (e.buttons > 0 && this.dragStartPos) {
                this.updateDragLine(this.dragStartPos, { x, y });
            }
        });

        canvas.addEventListener('mouseup', () => {
            this.clearDragLine();
            this.dragStartPos = undefined;
            this.clearBodyHighlights();
        });
    }

    disableMouseInteraction(): void {
        if (this.mouseConstraint) {
            World.remove(this.world, this.mouseConstraint);
            this.mouseConstraint = undefined;
        }
    }

    private createClickMarker(x: number, y: number): void {
        const renderSystem = serviceContainer.get('renderSystem') as any;
        if (!renderSystem || !renderSystem.getPixiApp) {
            return;
        }

        const pixiApp = renderSystem.getPixiApp();
        if (!pixiApp || !pixiApp.stage) {
            return;
        }

        const marker = new Graphics();
        marker.beginFill(0xff0000, 0.8);
        marker.drawCircle(0, 0, 5);
        marker.endFill();
        marker.x = x;
        marker.y = y;

        pixiApp.stage.addChild(marker);

        setTimeout(() => {
            if (marker.parent) {
                marker.parent.removeChild(marker);
            }
        }, 2000);
    }

    private updateDragLine(start: { x: number, y: number }, end: { x: number, y: number }): void {
        const renderSystem = serviceContainer.get('renderSystem') as any;
        if (!renderSystem || !renderSystem.getPixiApp) return;

        const pixiApp = renderSystem.getPixiApp();
        if (!pixiApp || !pixiApp.stage) return;

        this.clearDragLine();

        this.currentDragLine = new Graphics();
        this.currentDragLine.lineStyle(2, 0x00ff00, 0.8);
        this.currentDragLine.moveTo(start.x, start.y);
        this.currentDragLine.lineTo(end.x, end.y);

        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const arrowSize = 10;
        this.currentDragLine.lineStyle(2, 0x00ff00, 0.8);
        this.currentDragLine.moveTo(end.x, end.y);
        this.currentDragLine.lineTo(
            end.x - arrowSize * Math.cos(angle - Math.PI / 6),
            end.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.currentDragLine.moveTo(end.x, end.y);
        this.currentDragLine.lineTo(
            end.x - arrowSize * Math.cos(angle + Math.PI / 6),
            end.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );

        pixiApp.stage.addChild(this.currentDragLine);
    }

    private clearDragLine(): void {
        if (this.currentDragLine && this.currentDragLine.parent) {
            this.currentDragLine.parent.removeChild(this.currentDragLine);
            this.currentDragLine = undefined;
        }
    }

    private highlightBody(body: Body, color: number): void {
        const renderSystem = serviceContainer.get('renderSystem') as any;
        if (!renderSystem || !renderSystem.getPixiApp) return;

        const pixiApp = renderSystem.getPixiApp();
        if (!pixiApp || !pixiApp.stage) return;

        const highlight = new Graphics();
        highlight.lineStyle(3, color, 0.8);

        const bounds = body.bounds;
        const centerX = (bounds.min.x + bounds.max.x) / 2;
        const centerY = (bounds.min.y + bounds.max.y) / 2;
        const width = bounds.max.x - bounds.min.x;
        const height = bounds.max.y - bounds.min.y;

        if (body.circleRadius) {
            highlight.drawCircle(centerX, centerY, body.circleRadius + 5);
        } else {
            highlight.drawRect(bounds.min.x - 5, bounds.min.y - 5, width + 10, height + 10);
        }

        (highlight as any)._isBodyHighlight = true;
        (highlight as any)._bodyId = body.id;
        pixiApp.stage.addChild(highlight);

        setTimeout(() => {
            if (highlight.parent) {
                highlight.parent.removeChild(highlight);
            }
        }, 3000);
    }

    private clearBodyHighlights(): void {
        const renderSystem = serviceContainer.get('renderSystem') as any;
        if (!renderSystem || !renderSystem.getPixiApp) return;

        const pixiApp = renderSystem.getPixiApp();
        if (!pixiApp || !pixiApp.stage) return;

        const children = pixiApp.stage.children.slice();
        children.forEach((child: any) => {
            if (child._isBodyHighlight) {
                pixiApp.stage.removeChild(child);
            }
        });
    }

    private configureEngine(): void {
        this.engine.gravity.x = this.config.gravity.x;
        this.engine.gravity.y = this.config.gravity.y;
        this.engine.enableSleeping = this.config.enableSleeping;
        this.engine.timing.timeScale = this.config.timeScale;
    }

    private setupCollisionManager(): void {
        this.collisionManager = new CollisionManager();
        this.collisionManager.initialize(this.engine);
        serviceContainer.register('collisionManager', this.collisionManager);
    }

    private setupEvents(): void {
        // The CollisionManager handles all collision events
    }

    private setupDebugRender(): void {
        this.config.enableDebugRender = true;
    }

    private processOptions(options: RigidBodyOptions): any {
        const processedOptions: any = { ...options };

        if (!processedOptions.label) {
            processedOptions.label = `body_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        if (options.velocity) {
            processedOptions.velocity = options.velocity;
        }

        return processedOptions;
    }

    getEngine(): Engine {
        return this.engine;
    }

    getWorld(): World {
        return this.world;
    }

    getCollisionManager(): CollisionManager | undefined {
        return this.collisionManager;
    }

    addRigidBodyComponent(component: any): void {
        this.addBody(component.body, component.entityId);
    }

    removeRigidBodyComponent(component: any): void {
        this.removeBody(component.body);
    }

    updateRigidBodyComponents(): void {
        // Handled by TransformSystem
    }

    destroy(): void {
        this.disableDebugRender();
        this.disableMouseInteraction();
        this.bodyMap.clear();
        World.clear(this.world, false);
        Engine.clear(this.engine);
    }
}
