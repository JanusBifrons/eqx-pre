# PowerShell Command Reference for VS Code Workspace

## ⚠️ CRITICAL RULES FOR THIS PROJECT ⚠️

### Command Chaining Syntax
- ✅ **CORRECT**: `cd "path"; command`
- ❌ **WRONG**: `cd "path" && command`
- ❌ **WRONG**: `cd "path" && command`

### Examples
```powershell
# Installing dependencies
cd "c:\Users\alecv\Desktop\eqx-pre\eqx-pre"; npm install

# Running development server
cd "c:\Users\alecv\Desktop\eqx-pre\eqx-pre"; npm run dev

# Building project
cd "c:\Users\alecv\Desktop\eqx-pre\eqx-pre"; npm run build

# Multiple commands
cd "c:\Users\alecv\Desktop\eqx-pre\eqx-pre"; npm install; npm run dev
```

### Terminal Output Checking
- ✅ **PREFERRED**: Run command and wait for completion
- ❌ **AVOID**: Using `get_terminal_output` which causes hanging/delays

### Common Commands for This Project
```powershell
# Install TanStack Router
cd "c:\Users\alecv\Desktop\eqx-pre\eqx-pre"; npm install @tanstack/react-router

# Start dev server
cd "c:\Users\alecv\Desktop\eqx-pre\eqx-pre"; npm run dev

# Install dependencies
cd "c:\Users\alecv\Desktop\eqx-pre\eqx-pre"; npm install

# TypeScript check
cd "c:\Users\alecv\Desktop\eqx-pre\eqx-pre"; npx tsc --noEmit
```

## && Usage Counter 📊
**Times `&&` has been incorrectly used in this project: 1**

*This counter tracks how many times the wrong command chaining syntax has been used. Each time `&&` is used instead of `;`, we increment this counter as a reminder to follow PowerShell syntax.*

## Node.js Version Management 🔧
**Project successfully updated from Node.js v14.17.3 to v22.16.0**

*The project was experiencing compatibility issues due to an older Node.js version (v14.17.3) that didn't support modern JavaScript features like logical assignment operators (`||=`, `&&=`, `??=`). Successfully updated using nvm4w to Node.js v22.16.0 LTS.*

### Commands used for Node.js update:
```powershell
# Check current version
node --version

# List available versions
nvm list available

# Install latest LTS
nvm install 22.16.0

# Switch to new version
nvm use 22.16.0

# Verify update
node --version
npm --version
```

## React Conversion Status ✅
**Project successfully converted from vanilla TypeScript to React + TypeScript + Tailwind CSS**

### Key changes made:
- ✅ Installed React, ReactDOM, and Vite React plugin
- ✅ Updated Vite configuration for React support
- ✅ Installed and configured Tailwind CSS v4.x
- ✅ Created React App component with modern Tailwind styling
- ✅ Updated game demos to work with React containers
- ✅ Modified Application class to accept DOM containers
- ✅ Updated main.ts to render React app

### Current Development Server:
```powershell
# Start development server
cd "c:\Users\alecv\Desktop\eqx-pre\eqx-pre"; npm run dev
# Running on: http://localhost:3001/
```

## Why This Matters
- PowerShell uses `;` for command separation
- `&&` is bash/cmd syntax that doesn't work reliably in PowerShell
- Using wrong syntax causes command failures and frustration
