# Claude Development Guide

## 🚨 CRITICAL: Switch to PowerShell as Default Shell

**The CLI issues are caused by shell syntax mismatch. Follow these steps to fix:**

### Step 1: Change VS Code Default Terminal to PowerShell
1. Open VS Code
2. Press `Ctrl+Shift+P` to open Command Palette
3. Type "Terminal: Select Default Profile" 
4. Select "PowerShell" (not bash.exe)
5. Restart VS Code or open a new terminal

### Step 2: Verify PowerShell is Active
Open a new terminal and verify you see:
```
PS C:\Users\alecv\Desktop\eqx-pre\eqx-pre>
```
NOT:
```
$ 
```

### Step 3: Load PowerShell Functions
In your PowerShell terminal, run:
```powershell
. C:\Users\alecv\Desktop\claude-dev-aliases.ps1
```

### 🛑 CRITICAL FOR CLAUDE: PowerShell Syntax Rules
**When default shell is PowerShell, NEVER use bash syntax:**

- ✅ **CORRECT**: `cd C:\path ; npm run dev`
- ✅ **CORRECT**: Use separate commands
- ❌ **NEVER**: `cd C:\path && npm run dev` (bash syntax)

## Terminal Command Issues & Solutions - RESOLVED ✅

### Problem - FIXED!
CLI issues were caused by **shell syntax mismatch** - mixing bash (`&&`) with PowerShell syntax.

### Solution - PowerShell Default Shell
**Status: ✅ WORKING** - PowerShell is now the default shell and CLI commands work properly.

### CRITICAL: PowerShell Command Guidelines for Claude
**ALWAYS use PowerShell syntax when default shell is PowerShell:**

- ✅ **CORRECT**: Use `;` to chain commands: `cd C:\path ; npm run dev`
- ✅ **CORRECT**: Use separate commands: `cd C:\path` then `npm run dev`
- ❌ **NEVER use `&&`** - This is bash syntax and will fail in PowerShell
- ❌ **NEVER mix shell syntaxes** - Stick to PowerShell consistently

**PowerShell Command Examples:**
```powershell
# CORRECT - Using semicolon
cd C:\Users\alecv\Desktop\eqx-pre\eqx-pre ; npm run dev

# CORRECT - Separate commands
cd C:\Users\alecv\Desktop\eqx-pre\eqx-pre
npm run dev

# WRONG - Don't use bash syntax
cd C:\Users\alecv\Desktop\eqx-pre\eqx-pre && npm run dev
```

### Solutions

#### 1. Use Batch Scripts in c:\eqx-scripts Directory
All development batch files have been moved to `c:\eqx-scripts\` to keep the project structure clean:

- `c:\eqx-scripts\dev.bat` - Start development server
- `c:\eqx-scripts\build.bat` - Build the project  
- `c:\eqx-scripts\clean.bat` - Clean install dependencies
- `c:\eqx-scripts\install.bat` - Install dependencies
- `c:\eqx-scripts\test-demo.bat` - Test enhanced physics demo

#### 2. PowerShell Functions for Quick Access
The `claude-dev-aliases.ps1` file provides PowerShell functions for common development tasks:

```powershell
# PowerShell functions for Claude development
$ProjectPath = "C:\Users\alecv\Desktop\eqx-pre\eqx-pre"

function dev-start {
    Set-Location $ProjectPath
    npm run dev
}

function dev-build {
    Set-Location $ProjectPath
    npm run build
}

function dev-install {
    Set-Location $ProjectPath
    npm install
}

function dev-clean {
    Set-Location $ProjectPath
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
    Remove-Item package-lock.json -ErrorAction SilentlyContinue
    npm install
}

function test-demo {
    Set-Location $ProjectPath
    npx tsc --noEmit
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TypeScript check passed!" -ForegroundColor Green
        npm run dev
    } else {
        Write-Host "❌ TypeScript errors found!" -ForegroundColor Red
    }
}

function goto-project {
    Set-Location $ProjectPath
}

Write-Host "Claude PowerShell aliases loaded!" -ForegroundColor Green
Write-Host "Usage: dev-start, dev-build, dev-install, dev-clean, test-demo, goto-project" -ForegroundColor Yellow
```

#### 3. PowerShell Command Syntax (IMPORTANT)
**When using PowerShell, NEVER use `&&` - it will fail!**

❌ **Wrong** (bash syntax in PowerShell):
```powershell
cd C:\path && npm run dev
```

✅ **Correct** (PowerShell syntax):
```powershell
cd C:\path ; npm run dev
```

Or use separate commands:
```powershell
cd C:\path
npm run dev
```

#### 4. Command Execution Best Practices
- Always use `isBackground: false` for development server commands
- Use absolute paths when possible
- Check current directory before running commands
- Use simple commands first to verify terminal functionality

#### 3. Alternative Testing Methods
When terminal commands fail:
1. Check for TypeScript compilation errors using `get_errors` tool
2. Verify file syntax and imports
3. Use `open_simple_browser` with localhost URL
4. Create test files to verify functionality

#### 4. Development Workflow
```
1. Complete feature development
2. Check for TypeScript errors with get_errors tool
3. Run: quick-check (alias for TypeScript compilation check)
4. Run: dev-start (alias for npm run dev)
5. Test in browser using open_simple_browser tool
```

## Recommended Development Approach

### Setup Once
1. Create `claude-dev-aliases.bat` file outside the project
2. Run it in your terminal session to load aliases
3. Use aliases instead of direct npm commands

### Usage in Claude
Instead of running terminal commands directly, Claude should:
1. Use TypeScript error checking first: `get_errors` tool
2. Use simple alias commands: `quick-check`, `dev-start`
3. This provides better error handling and consistency
4. Keep project directory clean of utility scripts

## Error Handling

### When Commands Fail
1. Check if the terminal session is working with simple commands like `echo "test"`
2. Verify current directory with `pwd`
3. Use batch scripts as fallback
4. Check for TypeScript/compilation errors first
5. Use alternative testing methods

### Debugging Steps
1. `get_errors` - Check for compilation errors
2. `file_search` - Verify files exist
3. `read_file` - Check file contents
4. Simple terminal test - `echo "test"`
5. Use batch scripts for complex operations

## Future Improvements
- Add error checking to batch scripts
- Create logging for development operations
- Add cross-platform script support
- Integrate with VS Code tasks
