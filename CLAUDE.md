# Claude Development Guide

## ⚠️ CRITICAL POWERSHELL RULES ⚠️

### Command Chaining Syntax
- ✅ **CORRECT**: `cd "c:\Users\alecv\Desktop\eqx-pre\eqx-pre"; npm run dev`
- ❌ **WRONG**: `cd "path" && command` (bash syntax - will fail)

### Terminal Output
- ✅ **PREFERRED**: Run command and wait for completion (`isBackground: false`)
- ❌ **AVOID**: Using `get_terminal_output` which causes hanging/delays

### Common Project Commands
```powershell
# Start dev server
cd "c:\Users\alecv\Desktop\eqx-pre\eqx-pre"; npm run dev

# Install dependencies  
cd "c:\Users\alecv\Desktop\eqx-pre\eqx-pre"; npm install

# Build project
cd "c:\Users\alecv\Desktop\eqx-pre\eqx-pre"; npm run build

# TypeScript check
cd "c:\Users\alecv\Desktop\eqx-pre\eqx-pre"; npx tsc --noEmit
```

---

## Project Info
- **Tech Stack**: React + TypeScript + Tailwind CSS v4.x
- **Node.js**: v22.16.0 LTS  
- **Dev Server**: http://localhost:3001/

---

## Background Process Rules

**IMPORTANT: Only use background processes for long-running servers**
- ✅ **USE BACKGROUND**: `npm run dev` (dev server)
- ❌ **DON'T USE BACKGROUND**: `npm run build`, `npm test`, `npx tsc` (need to see output)

**Example:**
```typescript
// ✅ CORRECT - Simple build command
run_in_terminal({
  command: "cd \"c:\\Users\\alecv\\Desktop\\eqx-pre\\eqx-pre\"; npm run build",
  explanation: "Building the project",
  isBackground: false  // Can see output immediately
})

// ✅ CORRECT - Long-running server
run_in_terminal({
  command: "cd \"c:\\Users\\alecv\\Desktop\\eqx-pre\\eqx-pre\"; npm run dev", 
  explanation: "Starting development server",
  isBackground: true   // Runs in background
})
```
