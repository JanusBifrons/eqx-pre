import { BlockDefinition, BlockType, BlockProperties } from '@/entities/Block';

export class BlockDefinitions {
    private static definitions = new Map<string, BlockDefinition>();    // Define standard sizes for blocks - all sizes must be multiples of BASE_UNIT
    public static readonly BASE_UNIT = 32; // Base unit size in pixels

    /*
     * BLOCK SIZING STANDARDS:
     * - All block dimensions MUST be multiples of BASE_UNIT (32px)
     * - Valid sizes: 32x32 (1x1), 64x32 (2x1), 32x64 (1x2), 64x64 (2x2), etc.
     * - Connection points should align with grid boundaries (multiples of 16px from center)
     * - This ensures proper snapping and alignment in the ship builder
     */

    static {
        // Initialize default block definitions
        this.registerDefaults();
    }

    private static registerDefaults(): void {
        // Hull blocks
        this.register('hull_basic', {
            type: BlockType.HULL,
            width: 32,
            height: 32,
            mass: 10,
            maxHealth: 100,
            color: 0x606060,
            shape: 'rectangle',
            connectionPoints: [
                { x: -16, y: 0 },  // Left
                { x: 16, y: 0 },   // Right
                { x: 0, y: -16 },  // Top
                { x: 0, y: 16 }    // Bottom
            ]
        });

        this.register('hull_corner', {
            type: BlockType.HULL,
            width: 32,
            height: 32,
            mass: 8,
            maxHealth: 80,
            color: 0x505050,
            shape: 'polygon',
            vertices: [
                { x: -16, y: -16 },
                { x: 16, y: -16 },
                { x: 16, y: 16 }
            ],
            connectionPoints: [
                { x: 0, y: -16 },   // Top
                { x: 16, y: 0 },    // Right
                { x: 8, y: 8 }      // Corner
            ]
        }); this.register('hull_heavy', {
            type: BlockType.HULL,
            width: 64,  // 2x2 grid units (BASE_UNIT * 2)
            height: 64, // 2x2 grid units (BASE_UNIT * 2)
            mass: 25,
            maxHealth: 200,
            color: 0x707070,
            shape: 'rectangle',
            connectionPoints: [
                { x: -32, y: 0 },   // Left edge
                { x: 32, y: 0 },    // Right edge
                { x: 0, y: -32 },   // Top edge
                { x: 0, y: 32 },    // Bottom edge
                { x: -16, y: -16 }, // Top-left quarter
                { x: 16, y: -16 },  // Top-right quarter
                { x: -16, y: 16 },  // Bottom-left quarter
                { x: 16, y: 16 }    // Bottom-right quarter
            ]
        });// Engine blocks
        this.register('engine_basic', {
            type: BlockType.ENGINE,
            width: 32,
            height: 32,
            mass: 15,
            maxHealth: 60,
            color: 0x4080FF,
            shape: 'rectangle',
            connectionPoints: [
                { x: 0, y: -16 }    // Connection at front
            ]
        });

        this.register('engine_powerful', {
            type: BlockType.ENGINE,
            width: 32,
            height: 64,
            mass: 25,
            maxHealth: 80,
            color: 0x2060FF,
            shape: 'rectangle',
            connectionPoints: [
                { x: 0, y: -32 },   // Front connection
                { x: -16, y: -32 },  // Left front
                { x: 16, y: -32 }    // Right front
            ]
        });

        this.register('engine_maneuvering', {
            type: BlockType.ENGINE,
            width: 32,
            height: 32,
            mass: 5,
            maxHealth: 30,
            color: 0x60A0FF,
            shape: 'circle',
            connectionPoints: [
                { x: 0, y: -16 }     // Single connection
            ]
        });        // Weapon blocks
        this.register('weapon_laser', {
            type: BlockType.WEAPON,
            width: 32,
            height: 32,
            mass: 8,
            maxHealth: 50,
            color: 0xFF4040,
            shape: 'rectangle',
            connectionPoints: [
                { x: 0, y: 16 }     // Connection at base
            ]
        });

        this.register('weapon_cannon', {
            type: BlockType.WEAPON,
            width: 32,
            height: 64,
            mass: 20,
            maxHealth: 80,
            color: 0xFF2020,
            shape: 'rectangle',
            connectionPoints: [
                { x: 0, y: 32 },    // Base connection
                { x: -16, y: 32 },   // Left base
                { x: 16, y: 32 }     // Right base
            ]
        });

        this.register('weapon_missile', {
            type: BlockType.WEAPON,
            width: 32,
            height: 32,
            mass: 12,
            maxHealth: 40,
            color: 0xFF6020,
            shape: 'rectangle',
            connectionPoints: [
                { x: -16, y: 0 },   // Back connection
                { x: -16, y: -16 },  // Back top
                { x: -16, y: 16 }    // Back bottom
            ]
        });        // Utility blocks
        this.register('utility_reactor', {
            type: BlockType.UTILITY,
            width: 64,
            height: 64,
            mass: 30,
            maxHealth: 120,
            color: 0x40FF40,
            shape: 'circle',
            connectionPoints: [
                { x: -32, y: 0 },   // Left
                { x: 32, y: 0 },    // Right
                { x: 0, y: -32 },   // Top
                { x: 0, y: 32 }     // Bottom
            ]
        });

        this.register('utility_shield', {
            type: BlockType.UTILITY,
            width: 32,
            height: 32,
            mass: 18,
            maxHealth: 90,
            color: 0x40FFFF,
            shape: 'rectangle',
            connectionPoints: [
                { x: -16, y: 0 },   // Left
                { x: 16, y: 0 },    // Right
                { x: 0, y: -16 },   // Top
                { x: 0, y: 16 }     // Bottom
            ]
        }); this.register('utility_cargo', {
            type: BlockType.UTILITY,
            width: 64,  // 2x1 grid units (BASE_UNIT * 2 x BASE_UNIT * 1)
            height: 32, // 2x1 grid units (BASE_UNIT * 2 x BASE_UNIT * 1)
            mass: 20,
            maxHealth: 70,
            color: 0xFFFF40,
            shape: 'rectangle',
            connectionPoints: [
                { x: -32, y: 0 },   // Left edge
                { x: 32, y: 0 },    // Right edge
                { x: 0, y: -16 },   // Top center
                { x: 0, y: 16 }     // Bottom center
            ]
        });
    } public static register(id: string, definition: BlockDefinition): void {
        // Validate that the block conforms to sizing standards
        this.validateBlockDefinition(id, definition);
        this.definitions.set(id, definition);
    }

    private static validateBlockDefinition(id: string, definition: BlockDefinition): void {
        const { width, height } = definition;

        // Check if dimensions are multiples of BASE_UNIT
        if (width % this.BASE_UNIT !== 0) {
            console.warn(`Block '${id}' width (${width}) is not a multiple of BASE_UNIT (${this.BASE_UNIT})`);
        }

        if (height % this.BASE_UNIT !== 0) {
            console.warn(`Block '${id}' height (${height}) is not a multiple of BASE_UNIT (${this.BASE_UNIT})`);
        }

        // Validate connection points align with grid boundaries
        if (definition.connectionPoints) {
            for (const point of definition.connectionPoints) {
                if (Math.abs(point.x) % 16 !== 0 || Math.abs(point.y) % 16 !== 0) {
                    console.warn(`Block '${id}' has connection point (${point.x}, ${point.y}) that doesn't align with 16px grid`);
                }
            }
        }
    }

    public static get(id: string): BlockDefinition | undefined {
        return this.definitions.get(id);
    }

    public static getAll(): Map<string, BlockDefinition> {
        return new Map(this.definitions);
    }

    public static getByType(type: BlockType): Array<{ id: string; definition: BlockDefinition }> {
        const results: Array<{ id: string; definition: BlockDefinition }> = [];

        for (const [id, definition] of this.definitions) {
            if (definition.type === type) {
                results.push({ id, definition });
            }
        }

        return results;
    }

    public static getDefaultProperties(blockId: string): BlockProperties {
        const definition = this.get(blockId);
        if (!definition) return {};

        switch (definition.type) {
            case BlockType.ENGINE:
                switch (blockId) {
                    case 'engine_basic':
                        return { thrust: 50, fuelConsumption: 1 };
                    case 'engine_powerful':
                        return { thrust: 120, fuelConsumption: 2.5 };
                    case 'engine_maneuvering':
                        return { thrust: 20, fuelConsumption: 0.5 };
                    default:
                        return { thrust: 30, fuelConsumption: 1 };
                }

            case BlockType.WEAPON:
                switch (blockId) {
                    case 'weapon_laser':
                        return { damage: 25, fireRate: 5, range: 200 };
                    case 'weapon_cannon':
                        return { damage: 80, fireRate: 1, range: 300 };
                    case 'weapon_missile':
                        return { damage: 150, fireRate: 0.5, range: 400 };
                    default:
                        return { damage: 20, fireRate: 2, range: 150 };
                }

            case BlockType.HULL:
                switch (blockId) {
                    case 'hull_basic':
                        return { armor: 20 };
                    case 'hull_corner':
                        return { armor: 15 };
                    case 'hull_heavy':
                        return { armor: 50 };
                    default:
                        return { armor: 10 };
                }

            case BlockType.UTILITY:
                switch (blockId) {
                    case 'utility_reactor':
                        return { utilityType: 'reactor', capacity: 200 };
                    case 'utility_shield':
                        return { utilityType: 'shield', capacity: 100 };
                    case 'utility_cargo':
                        return { utilityType: 'cargo', capacity: 50 };
                    default:
                        return { utilityType: 'generic', capacity: 10 };
                }

            default:
                return {};
        }
    }
}
