# EQX Pre - Game Engine

🚀 **A modern TypeScript game engine** built with PixiJS, Matter.js, Zustand, and Stats.js featuring Entity Component System (ECS) architecture, dependency injection, and fixed timestep game loop.

---

## 🌟 Features

- **Modern Architecture**: Built with TypeScript, Vite, and modern web technologies
- **Entity Component System**: Flexible ECS architecture for game object management
- **Physics Integration**: Matter.js physics engine with seamless integration
- **Rendering**: PixiJS for high-performance 2D graphics
- **State Management**: Zustand for predictable state management
- **Performance Monitoring**: Stats.js integration for FPS monitoring
- **Dependency Injection**: Service container for clean dependency management
- **Fixed Timestep**: Consistent physics and game logic updates

---

## 🗂️ Project Structure

```
src/
├── core/                 # Core engine functionality
│   ├── Application.ts    # Main application class
│   ├── GameLoop.ts       # Fixed timestep game loop
│   ├── ServiceContainer.ts # Dependency injection
│   └── types.ts          # Type definitions
├── entities/             # Entity management
│   ├── Entity.ts         # Base entity class
│   └── EntityManager.ts  # Entity lifecycle management
├── components/           # ECS components
│   ├── TransformComponent.ts
│   ├── RenderComponent.ts
│   └── PhysicsComponent.ts
├── systems/              # ECS systems
│   ├── RenderSystem.ts
│   ├── PhysicsSystem.ts
│   └── TransformSystem.ts
├── store/                # State management
│   └── gameStore.ts      # Zustand store
├── ui/                   # UI components
├── utils/                # Utility functions
│   └── index.ts          # Math, time, and color utilities
└── main.ts               # Application entry point
```

---

## 🛠️ Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

---

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/eqx-pre.git
   ```

2. Navigate to the project directory:
   ```bash
   cd eqx-pre
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

---

### Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

### Build

1. Build the project:
   ```bash
   npm run build
   ```

2. The output will be in the `dist/` directory.

---

### Troubleshooting

- **Issue**: `npm run dev` fails
  - **Solution**: Ensure Node.js version is 16 or higher

- **Issue**: TypeScript errors
  - **Solution**: Run `npx tsc --noEmit` to check for errors

---

### Future Improvements

- Add cross-platform script support
- Integrate with VS Code tasks
- Enhance error handling in scripts