/**
 * Component Architecture Map
 * Visual representation of the refactored ShipBuilder system
 */

/*
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ShipBuilderRefactored (Orchestrator)                     │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Event System   │  │ Configuration   │  │ State Management│                  │
│  │                 │  │                 │  │                 │                  │
│  │ • blockSelected │  │ • gridSize      │  │ • selectedBlock │                  │
│  │ • mouseMove     │  │ • snapToGrid    │  │ • isBuilding    │                  │
│  │ • leftClick     │  │ • showGrid      │  │ • ship          │                  │
│  │ • rightClick    │  │ • boundaries    │  │                 │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ coordinates
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Core Components                                    │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────────┤
│ CameraController│   InputHandler  │   BlockPlacer   │      BlockPreview       │
│                 │                 │                 │                         │
│ • pan()         │ • handleMouse() │ • placeBlock()  │ • showPreview()         │
│ • zoom()        │ • handleKeys()  │ • canPlace()    │ • updatePosition()      │
│ • reset()       │ • emit events   │ • snapToGrid()  │ • hidePreview()         │
│ • transform()   │ • cleanup()     │ • validate()    │ • setValidity()         │
│                 │                 │                 │                         │
│ Manages:        │ Manages:        │ Manages:        │ Manages:                │
│ • World view    │ • User input    │ • Block logic   │ • Visual feedback       │
│ • Coordinates   │ • Event flow    │ • Collision     │ • Preview state         │
│ • Viewport      │ • Shortcuts     │ • Connections   │ • Color coding          │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────────┘
                                    │
                                    │ events & data
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               UI Components                                     │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────────┤
│   BlockPalette  │   StatsPanel    │ ActionButtons   │   InstructionsPanel     │
│                 │                 │                 │                         │
│ • showBlocks()  │ • updateStats() │ • addButton()   │ • showInstructions()    │
│ • selectBlock() │ • showValidation│ • configStyle() │ • formatHelp()          │
│ • highlight()   │ • formatText()  │ • handleClick() │ • position()            │
│ • emit events   │ • position()    │ • emit events   │                         │
│                 │                 │                 │                         │
│ Displays:       │ Displays:       │ Provides:       │ Shows:                  │
│ • Block types   │ • Ship stats    │ • Clear Ship    │ • Controls help         │
│ • Thumbnails    │ • Validation    │ • Test Ship     │ • Block colors          │
│ • Selection     │ • Block count   │ • Repair Links  │ • Camera shortcuts      │
│ • Categories    │ • Mass/thrust   │ • Custom actions│ • Instructions          │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────────┘
                                    │
                                    │ extends
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Base Infrastructure                                  │
├─────────────────────────────────┬───────────────────────────────────────────────┤
│         BaseUIComponent         │              IUIComponent                     │
│                                 │                                               │
│ • container: Container          │ interface IUIComponent {                      │
│ • setPosition()                 │   resize(width, height): void                 │
│ • resize()                      │   destroy(): void                             │
│ • destroy()                     │   getContainer(): Container                   │
│ • on/off/emit events            │ }                                             │
│                                 │                                               │
│ Provides:                       │ interface IShipBuilderConfig {                │
│ • Event system                  │   gridSize: number                            │
│ • Container management          │   gridWidth: number                           │
│ • Common patterns               │   gridHeight: number                          │
│ • Lifecycle hooks               │   snapToGrid: boolean                         │
│                                 │   showGrid: boolean                           │
│                                 │   showConnectionPoints: boolean               │
│                                 │ }                                             │
└─────────────────────────────────┴───────────────────────────────────────────────┘

DATA FLOW:
1. User input → InputHandler → Events
2. Events → ShipBuilderRefactored → Component coordination
3. Block selection → BlockPalette → BlockPreview updates
4. Block placement → BlockPlacer → Ship updates → StatsPanel refresh
5. Actions → ActionButtons → Ship operations
6. All components → BaseUIComponent → Consistent behavior

BENEFITS:
✅ Single Responsibility: Each component has one clear purpose
✅ Open/Closed: Easy to add new components without changing existing ones
✅ Liskov Substitution: All components are interchangeable via interfaces
✅ Interface Segregation: Components only depend on what they need
✅ Dependency Inversion: Depend on abstractions, not concrete classes

TESTING STRATEGY:
• Unit tests for each component in isolation
• Integration tests for component interactions
• Browser console testing with exposed methods
• Event flow testing with mock objects
*/
