# Gradient Stack - Project Specification

## Overview
Gradient Stack is a browser-based visual editor that allows users to stack, manipulate, and animate multiple CSS background layers (gradients and images), generating clean, production-ready CSS code.

## Core Features

### 1. Layer Management
The application treats the CSS `background` property as a stack of layers. Each layer can be:

- **Linear Gradient**: Control angle (degrees), color stops, and hints
- **Radial Gradient**: Control shape (circle/ellipse), position (x, y), and color stops
- **URL (Image)**: External assets with background-size and background-repeat controls

### 2. Property Editor
For the active layer, users can modify:

- **Color Stops**: Visual slider to add/remove colors, adjust hex/RGBA values and transparency, change stop positions (0–100%)
- **Geometry**: Inputs or draggable UI to change gradient angles or radial centers
- **Blending**: Background blend mode controls (multiply, screen, overlay, etc.)

### 3. Keyframe Engine
Unlike static editors, Gradient Stack implements a Timeline concept:

- **State Snapshots**: Create keyframes at different points (0%, 50%, 100%)
- **Interpolation**: Automatic calculation of transitions between states
- **Playback**: Toggle to preview animations live in the browser

### 4. Data Persistence & Export

- **localStorage**: Saves workspace state (layers, colors, keyframes) for session persistence
- **CSS Compiler**: Parses UI state into valid CSS string
- **Animation Export**: Generates @keyframes blocks and animation properties

## User Interface Layout

1. **Preview Canvas** (Center): Large area showing the rendered result in real-time
2. **Layer Sidebar** (Left): Draggable list to reorder background layers
3. **Control Panel** (Right): Contextual inputs based on selected layer type
4. **Timeline** (Bottom): Keyframe editor with playback controls

## Technical Implementation

### State Management
- React state for layer stack and current selections
- localStorage for persistence
- Animation state tracking for timeline

### Color Handling
- Support for hex (#RRGGBB), RGB, and RGBA color formats
- Color picker integration
- Transparency slider for RGBA values

### CSS Generation
- Real-time CSS compilation as users edit
- Support for all CSS gradient properties
- Animation keyframe generation with easing functions

## File Structure
\`\`\`
src/
├── components/
│   ├── editor/
│   │   ├── preview-canvas.tsx
│   │   ├── layer-manager.tsx
│   │   ├── property-editor.tsx
│   │   └── timeline.tsx
│   ├── ui/
│   │   └── [shared components]
│   └── app.tsx
├── lib/
│   ├── gradient-compiler.ts
│   ├── gradient-types.ts
│   └── utils.ts
├── hooks/
│   ├── use-gradient-stack.ts
│   └── use-animation.ts
└── styles/
    └── editor.css
