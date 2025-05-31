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
    private engine: Engine; private world: World;
    private config: PhysicsConfig;
    private debugRender?: Render;
    private mouseConstraint?: MouseConstraint; private bodyMap = new Map<string, Body>();
    private collisionManager?: CollisionManager;
    private currentDragLine?: Graphics; // For visualizing drag
    private dragStartPos?: { x: number, y: number };

    constructor(config: Partial<PhysicsConfig> = {}) {
        this.config = {
            gravity: { x: 0, y: 0 }, // Zero gravity by default
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
        // Update physics with fixed timestep
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
        // Remove from map if it exists
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
            // Check if point is within body bounds
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
    }    // Mouse interaction
    enableMouseInteraction(canvas: HTMLCanvasElement): void {
        console.log('🔍 enableMouseInteraction called with canvas:', canvas);
        console.log('🔍 Canvas dimensions:', canvas.width, 'x', canvas.height);
        console.log('🔍 Canvas style dimensions:', canvas.style.width, 'x', canvas.style.height);
        console.log('🔍 Canvas offset:', canvas.offsetLeft, canvas.offsetTop);

        if (this.mouseConstraint) {
            console.log('⚠️ Mouse constraint already exists, skipping');
            return;
        } console.log('🖱️ Creating mouse constraint...');
        const mouse = Mouse.create(canvas);

        // CRITICAL FIX: Calculate the proper pixel ratio for coordinate transformation
        // Canvas has high-DPI scaling, we need to match Matter.js coordinates to canvas resolution
        const displayRect = canvas.getBoundingClientRect();
        const actualWidth = canvas.width;
        const actualHeight = canvas.height;
        const displayWidth = displayRect.width;
        const displayHeight = displayRect.height;

        const scaleX = actualWidth / displayWidth;
        const scaleY = actualHeight / displayHeight;

        console.log('🔍 Coordinate scaling analysis:');
        console.log('🔍 Canvas actual size:', actualWidth, 'x', actualHeight);
        console.log('🔍 Canvas display size:', displayWidth, 'x', displayHeight);
        console.log('🔍 Scale factors - X:', scaleX, 'Y:', scaleY);

        // Set the pixel ratio to match the scaling
        mouse.pixelRatio = scaleX; // Use calculated scaling factor

        // Force mouse to use the correct element and scaling
        mouse.element = canvas;

        console.log('🖱️ Mouse object created:', mouse);
        console.log('🖱️ Mouse pixel ratio set to:', mouse.pixelRatio);
        console.log('🖱️ Mouse element:', mouse.element);
        console.log('🖱️ Mouse offset:', mouse.offset);
        console.log('🖱️ Mouse scale:', mouse.scale); this.mouseConstraint = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 1.0, // Maximum stiffness for immediate response
                render: {
                    visible: false, // Disabled to avoid rendering conflicts
                },
                damping: 0.1, // Lower damping for more responsive movement
                length: 0, // Allow any distance
            },
        }); console.log('🖱️ Mouse constraint created:', this.mouseConstraint);
        console.log('🖱️ Mouse constraint properties:', {
            stiffness: this.mouseConstraint.constraint.stiffness,
            damping: this.mouseConstraint.constraint.damping,
        });
        World.add(this.world, this.mouseConstraint);
        console.log('✅ Mouse constraint added to world');
        console.log('🌍 World bodies count:', this.world.bodies.length); console.log('🌍 World bodies:', this.world.bodies.map(b => ({
            label: b.label,
            id: b.id,
            isStatic: b.isStatic,
            position: { x: Math.round(b.position.x), y: Math.round(b.position.y) },
            mass: b.mass
        })));

        // Note: Debug rendering disabled to avoid canvas conflicts with PIXI.js
        // We have sufficient visual debugging with our custom markers and highlights// Add mouse constraint event listeners for debugging
        Events.on(this.mouseConstraint, 'startdrag', (event: any) => {
            if (event.source.constraint.bodyB) {
                console.log('🎯 Mouse drag started on body:', event.source.constraint.bodyB.label || event.source.constraint.bodyB.id);
                console.log('🎯 Body mass:', event.source.constraint.bodyB.mass);
                console.log('🎯 Body isStatic:', event.source.constraint.bodyB.isStatic);
            }
        });

        Events.on(this.mouseConstraint, 'enddrag', (event: any) => {
            if (event.source.constraint.bodyB) {
                console.log('🎯 Mouse drag ended on body:', event.source.constraint.bodyB.label || event.source.constraint.bodyB.id);
            }
        });
        // Add mouse constraint detection debugging
        Events.on(this.mouseConstraint, 'mousedown', () => {
            console.log('🖱️ Mouse constraint detected mousedown');
        });

        Events.on(this.mouseConstraint, 'mousemove', () => {
            if (this.mouseConstraint && this.mouseConstraint.constraint.bodyB) {
                console.log('🔗 Mouse constraint actively dragging:', this.mouseConstraint.constraint.bodyB.label);
            }
        });        // Test mouse events to verify coordinates and add visual markers
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            console.log('🖱️ Mouse down - Client:', e.clientX, e.clientY, 'Canvas:', x, y);

            // Store drag start position
            this.dragStartPos = { x, y };

            // Create a visual marker at the click position
            this.createClickMarker(x, y);

            // Check what bodies are at this position
            const bodiesAtPoint = this.getBodiesAtPoint({ x, y });
            console.log('🎯 Bodies at click point:', bodiesAtPoint.map(b => b.label || b.id));

            // Highlight the body we should be grabbing
            if (bodiesAtPoint.length > 0) {
                this.highlightBody(bodiesAtPoint[0], 0x00ff00); // Green highlight
            }
            // DEBUG: Check what the mouse constraint thinks is at this position
            console.log('🔍 Mouse constraint mouse position:', this.mouseConstraint?.mouse.position);
            console.log('🔍 Mouse constraint detection at click...');
            // Compare our coordinate system with Matter.js mouse coordinate system
            if (this.mouseConstraint) {
                const matterMousePos = this.mouseConstraint.mouse.position;
                console.log('🔍 OUR coordinates:', { x, y });
                console.log('🔍 MATTER.JS coordinates:', matterMousePos);
                const dx = x - matterMousePos.x;
                const dy = y - matterMousePos.y;
                console.log('🔍 Coordinate difference:', { dx, dy });

                // Check if coordinates are now properly aligned (should be close to 0)
                const threshold = 5; // Allow small differences
                if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
                    console.log('✅ COORDINATE TRANSFORMATION SUCCESS: Mouse coordinates are properly aligned!');
                } else {
                    console.log('⚠️ COORDINATE MISMATCH: Large difference detected, may need adjustment');
                }
            }
            // Force check mouse constraint after a brief delay to see if it detects anything
            setTimeout(() => {
                if (this.mouseConstraint) {
                    console.log('🔍 Mouse constraint bodyB after click:', this.mouseConstraint.constraint.bodyB?.label || 'NONE');
                    console.log('🔍 Mouse constraint position:', this.mouseConstraint.mouse.position);
                }
                // MANUAL TEST: Try to apply force directly to detected bodies
                if (bodiesAtPoint.length > 0) {
                    console.log('🧪 MANUAL TEST: Applying direct force to body at click position');
                    const testBody = bodiesAtPoint[0];
                    // Apply a small upward force to test if direct physics manipulation works
                    Body.applyForce(testBody, testBody.position, { x: 0, y: -0.01 });
                    console.log('🧪 Applied test force to:', testBody.label);
                }

                // MATTER.JS TEST: Use Matter.js Query to find bodies at mouse position
                if (this.mouseConstraint) {
                    const matterMousePos = this.mouseConstraint.mouse.position;
                    const matterBodies = this.world.bodies.filter(body => {
                        const bounds = body.bounds;
                        return matterMousePos.x >= bounds.min.x && matterMousePos.x <= bounds.max.x &&
                            matterMousePos.y >= bounds.min.y && matterMousePos.y <= bounds.max.y;
                    });
                    console.log('🔍 Bodies found by Matter.js coordinates:', matterBodies.map(b => b.label));
                }
            }, 10);
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (e.buttons > 0 && this.dragStartPos) { // Only when dragging
                console.log('🖱️ Mouse drag - Client:', e.clientX, e.clientY, 'Canvas:', x, y);

                // Draw drag line
                this.updateDragLine(this.dragStartPos, { x, y });
                // Show mouse constraint info
                if (this.mouseConstraint && this.mouseConstraint.constraint.bodyB) {
                    console.log('🔗 Dragging body:', this.mouseConstraint.constraint.bodyB.label);
                    console.log('🔗 Body position:', this.mouseConstraint.constraint.bodyB.position);
                }
            }
        });

        canvas.addEventListener('mouseup', () => {
            console.log('🖱️ Mouse up - ending drag');
            this.clearDragLine();
            this.dragStartPos = undefined;

            // Clear body highlights
            this.clearBodyHighlights();
        });
    } disableMouseInteraction(): void {
        if (this.mouseConstraint) {
            World.remove(this.world, this.mouseConstraint);
            this.mouseConstraint = undefined;
        }
    } private createClickMarker(x: number, y: number): void {
        console.log('🎯 Creating click marker at:', x, y);

        // Get the PIXI app to add the marker to the stage
        const renderSystem = serviceContainer.get('renderSystem') as any;
        if (!renderSystem || !renderSystem.getPixiApp) {
            console.warn('⚠️ Could not access render system for click marker');
            return;
        }

        const pixiApp = renderSystem.getPixiApp();
        if (!pixiApp || !pixiApp.stage) {
            console.warn('⚠️ Could not access PIXI stage for click marker');
            return;
        }

        // Create a small red circle at the click position
        const marker = new Graphics();
        marker.beginFill(0xff0000, 0.8); // Red with transparency
        marker.drawCircle(0, 0, 5); // 5px radius
        marker.endFill();
        marker.x = x;
        marker.y = y;

        // Add to stage
        pixiApp.stage.addChild(marker);
        console.log('✅ Click marker added at PIXI coordinates:', marker.x, marker.y);

        // Remove the marker after 2 seconds
        setTimeout(() => {
            if (marker.parent) {
                marker.parent.removeChild(marker);
                console.log('🧹 Click marker removed');
            }
        }, 2000);
    }

    private updateDragLine(start: { x: number, y: number }, end: { x: number, y: number }): void {
        const renderSystem = serviceContainer.get('renderSystem') as any;
        if (!renderSystem || !renderSystem.getPixiApp) return;

        const pixiApp = renderSystem.getPixiApp();
        if (!pixiApp || !pixiApp.stage) return;

        // Clear existing drag line
        this.clearDragLine();

        // Create new drag line
        this.currentDragLine = new Graphics();
        this.currentDragLine.lineStyle(2, 0x00ff00, 0.8); // Green line
        this.currentDragLine.moveTo(start.x, start.y);
        this.currentDragLine.lineTo(end.x, end.y);

        // Add arrow at the end
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

        // Create highlight graphics
        const highlight = new Graphics();
        highlight.lineStyle(3, color, 0.8);

        // Draw outline based on body type
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

        // Store reference and add to stage
        (highlight as any)._isBodyHighlight = true;
        (highlight as any)._bodyId = body.id;
        pixiApp.stage.addChild(highlight);

        console.log('✨ Highlighted body:', body.label || body.id);

        // Auto-remove after 3 seconds
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

        // Remove all body highlights
        const children = pixiApp.stage.children.slice(); // Copy array to avoid modification during iteration
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
    } private setupCollisionManager(): void {
        this.collisionManager = new CollisionManager();
        // Initialize the collision manager with the physics engine
        this.collisionManager.initialize(this.engine);
        serviceContainer.register('collisionManager', this.collisionManager);
    }
    private setupEvents(): void {
        // The CollisionManager will handle all collision events
        // No need to manually handle them here since CollisionManager
        // sets up its own event listeners on the engine
    }

    private setupDebugRender(): void {
        // Debug render setup will be called when needed
        this.config.enableDebugRender = true;
    }

    private processOptions(options: RigidBodyOptions): any {
        const processedOptions: any = { ...options };

        // Set default label if not provided
        if (!processedOptions.label) {
            processedOptions.label = `body_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // Set initial velocity if provided
        if (options.velocity) {
            processedOptions.velocity = options.velocity;
        }

        return processedOptions;
    }

    // Getter methods
    getEngine(): Engine {
        return this.engine;
    }

    getWorld(): World {
        return this.world;
    }

    getCollisionManager(): CollisionManager | undefined {
        return this.collisionManager;
    }

    // RigidBodyComponent integration methods
    addRigidBodyComponent(component: any): void {
        this.addBody(component.body, component.entityId);
    }

    removeRigidBodyComponent(component: any): void {
        this.removeBody(component.body);
    }

    updateRigidBodyComponents(): void {
        // This method will be called by systems that need to sync physics bodies with transform components
        // The actual sync logic should be handled by TransformSystem or a dedicated PhysicsTransformSystem
    }

    destroy(): void {
        this.disableDebugRender();
        this.disableMouseInteraction();

        // Clear all bodies
        this.bodyMap.clear();

        // Clear world and engine
        World.clear(this.world, false);
        Engine.clear(this.engine);
    }
}
