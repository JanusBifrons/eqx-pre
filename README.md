# EQX Pre - Game Engine

A modern TypeScript game engine built with PixiJS, Matter.js, Zustand, and Stats.js featuring Entity Component System (ECS) architecture, dependency injection, and fixed timestep game loop.

## Features

- **Modern Architecture**: Built with TypeScript, Vite, and modern web technologies
- **Entity Component System**: Flexible ECS architecture for game object management
- **Physics Integration**: Matter.js physics engine with seamless integration
- **Rendering**: PixiJS for high-performance 2D graphics
- **State Management**: Zustand for predictable state management
- **Performance Monitoring**: Stats.js integration for FPS monitoring
- **Dependency Injection**: Service container for clean dependency management
- **Fixed Timestep**: Consistent physics and game logic updates

## Project Structure

```
src/
├── core/                 # Core engine functionality
│   ├── Application.ts    # Main application class
│   ├── GameLoop.ts      # Fixed timestep game loop
│   ├── ServiceContainer.ts # Dependency injection
│   └── types.ts         # Type definitions
├── entities/            # Entity management
│   ├── Entity.ts        # Base entity class
│   └── EntityManager.ts # Entity lifecycle management
├── components/          # ECS components
│   ├── TransformComponent.ts
│   ├── RenderComponent.ts
│   └── PhysicsComponent.ts
├── systems/             # ECS systems
│   ├── RenderSystem.ts
│   ├── PhysicsSystem.ts
│   └── TransformSystem.ts
├── store/               # State management
│   └── gameStore.ts     # Zustand store
├── ui/                  # UI components
├── utils/               # Utility functions
│   └── index.ts         # Math, time, and color utilities
└── main.ts              # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Core Concepts

### Application

The main `Application` class handles:
- PixiJS initialization and configuration
- Stats.js integration for FPS monitoring
- Game loop management
- Window resize and visibility handling
- Service registration

### Game Loop

The `GameLoop` implements a fixed timestep loop that:
- Maintains consistent physics updates regardless of framerate
- Prevents the "spiral of death" with maximum frame time limits
- Manages system updates in proper order
- Supports pause/resume functionality

### Entity Component System

- **Entities**: Game objects that act as containers for components
- **Components**: Data containers (Transform, Render, Physics, etc.)
- **Systems**: Logic processors that operate on entities with specific components

### Service Container

Provides dependency injection for:
- Decoupled architecture
- Easy testing and mocking
- Clean service management
- Type-safe service retrieval

## Example Usage

```typescript
import { Application, EntityManager, TransformComponent, RenderComponent } from './src';

// Create application
const app = new Application({
  width: 800,
  height: 600,
  backgroundColor: 0x2c3e50
});

// Start the application
await app.start();

// Create entity with components
const entityManager = serviceContainer.get<EntityManager>('entityManager');
const entity = entityManager.createEntity('player');

const transform = new TransformComponent('player', { x: 400, y: 300 });
const render = new RenderComponent('player', graphics);

entity.addComponent(transform);
entity.addComponent(render);
```

## API Reference

### Core Classes

#### Application
- `start()`: Initialize and start the application
- `stop()`: Stop the application
- `pause()/resume()`: Pause and resume functionality
- `getPixiApp()`: Get PixiJS application instance
- `getGameContainer()`: Get main game container

#### GameLoop
- `addSystem(system)`: Add a system to the update loop
- `removeSystem(name)`: Remove a system by name
- `start()/stop()`: Control loop execution

#### Entity
- `addComponent(component)`: Add a component
- `getComponent<T>(type)`: Retrieve component by type
- `hasComponent(type)`: Check if component exists
- `removeComponent(type)`: Remove component

### Built-in Systems

- **PhysicsSystem**: Matter.js physics integration
- **RenderSystem**: Rendering and display object management
- **TransformSystem**: Synchronizes transform, render, and physics

### Utilities

- **MathUtils**: Mathematical operations and vector math
- **TimeUtils**: Time formatting and FPS calculations
- **ColorUtils**: Color manipulation and conversion

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License