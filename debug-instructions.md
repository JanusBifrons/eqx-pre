# Ship Builder Hover Preview Debug Instructions

## Current Status
The Ship Builder demo has been enhanced with comprehensive diagnostics and bug reproduction tools. The system automatically runs initial diagnostics when loaded.

## How to Test the Bug

### Step 1: Open Browser Console
1. Navigate to http://localhost:5173/ship-builder
2. Open browser console (F12 → Console tab)
3. You should see automatic diagnostic output starting with "🔍 RUNNING INITIAL SHIP BUILDER DIAGNOSTICS"

### Step 2: Manual Testing
1. **Test Initial Hover**: Move mouse over the grid area - you should see preview blocks appear
2. **Select a Block**: Click "Hull Basic" in the block palette (or run `shipBuilderDemo.selectBlock('hull_basic')`)
3. **Verify Hover Works**: Move mouse over grid - preview blocks should appear
4. **Place First Block**: Click anywhere in the grid to place a block
5. **Test Hover After Placement**: Move mouse over grid again - **this is where the bug occurs**

### Step 3: Automated Bug Reproduction
Run this command in the browser console:
```javascript
shipBuilderDemo.reproduceBug()
```

This will automatically:
- Select a hull_basic block
- Test hover before placement
- Place a block
- Test hover after placement
- Show detailed debug output at each step

### Step 4: Comprehensive Test Suite
Run the full test suite:
```javascript
shipBuilderDemo.runTests()
```

## Available Debug Methods

### Basic Methods
- `shipBuilderDemo.debugState()` - Show current system state
- `shipBuilderDemo.selectBlock('hull_basic')` - Select a block type
- `shipBuilderDemo.clearShip()` - Clear all placed blocks

### Bug Analysis Methods
- `shipBuilderDemo.reproduceBug()` - Automated bug reproduction
- `shipBuilderDemo.runTests()` - Run comprehensive test suite

## Expected Results vs Bug

### Working Correctly:
- Hover preview appears when mouse moves over grid
- Preview block follows mouse with proper visual feedback
- Preview shows green indicator when placement is valid
- Preview shows red/orange indicator when placement is invalid

### Bug Behavior:
- After placing the first block, hover preview stops working
- Mouse movement over grid no longer shows preview blocks
- The system appears to "lose" the preview functionality

## Key Areas to Investigate

Based on code analysis, potential issues are:

1. **Preview State Corruption**: The `BlockPreview` component may not be properly recreating the preview after block placement
2. **Event Handler Issues**: Mouse move events may not be properly triggering after block placement
3. **Selection State Problems**: The selected block type may be getting cleared unexpectedly
4. **Container Management**: The preview block container may be getting orphaned or destroyed

## Debug Output Analysis

Look for these patterns in the console output:

### Successful Hover:
```
handleMouseMove: Position check { isValid: true, hasPreviewBlock: true, ... }
BlockPreview.updatePosition called { hasPreviewBlock: true, ... }
```

### Failed Hover (Bug):
```
handleMouseMove: No block selected or not building
// OR
BlockPreview.updatePosition called { hasPreviewBlock: false, ... }
// OR
No handleMouseMove logs at all (event handling broken)
```

## Next Steps

1. Run the automated bug reproduction
2. Compare the debug output from "before placement" vs "after placement"
3. Identify which specific component is failing
4. Implement the targeted fix based on the root cause
