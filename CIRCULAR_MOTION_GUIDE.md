# Circular Motion Support in Visualization Engine

The visualization engine supports multiple ways to create circular/orbital motion:

## 🌍 Method 1: Orbital Motion (Recommended)

Use the special `orbit` animation property for true orbital motion:

```json
{
  "id": "planet",
  "type": "circle",
  "props": {
    "x": 400,  // Starting position (will be overridden)
    "y": 200,
    "r": 15,
    "fill": "#3498db"
  },
  "animations": [
    {
      "property": "orbit",
      "centerX": 400,    // Center of circular path
      "centerY": 200,    // Center of circular path  
      "radius": 100,     // Radius of circular path
      "duration": 3000,  // Time for one complete revolution
      "repeat": true,    // Infinite orbiting
      "easing": "linear" // Constant orbital speed
    }
  ]
}
```

## 🎯 Method 2: Coordinated X/Y Animation

Manually animate X and Y coordinates using trigonometric functions:

```json
{
  "id": "orbiting_object",
  "type": "circle",
  "props": {
    "x": 500, // Center X + radius
    "y": 200, // Center Y
    "r": 10,
    "fill": "#e74c3c"
  },
  "animations": [
    {
      "property": "x",
      "startValue": 500,  // centerX + radius * cos(0)
      "endValue": 300,    // centerX + radius * cos(π)
      "duration": 2000,
      "easing": "easeInOutQuad",
      "repeat": true,
      "alternate": true
    },
    {
      "property": "y", 
      "startValue": 200,  // centerY + radius * sin(0)
      "endValue": 200,    // centerY + radius * sin(π)
      "duration": 1000,   // Different timing for elliptical motion
      "easing": "easeInOutQuad",
      "repeat": true,
      "alternate": true
    }
  ]
}
```

## 🎪 Method 3: Rotation Animation

For shapes that should rotate around their own center:

```json
{
  "id": "spinning_star",
  "type": "star",
  "props": {
    "x": 300,
    "y": 150,
    "outerRadius": 30,
    "innerRadius": 15,
    "points": 8,
    "fill": "#f39c12",
    "rotation": 0
  },
  "animations": [
    {
      "property": "rotation",
      "startValue": 0,
      "endValue": 6.28, // 2π radians = 360 degrees
      "duration": 2000,
      "easing": "linear",
      "repeat": true
    }
  ]
}
```

## 🌌 Advanced Examples

### Solar System with Multiple Orbits

```json
{
  "layers": [
    // Sun (center)
    {
      "id": "sun",
      "type": "star",
      "props": {
        "x": 400, "y": 200, 
        "outerRadius": 25, "innerRadius": 15,
        "points": 12, "fill": "#f1c40f"
      },
      "animations": [
        {
          "property": "rotation",
          "startValue": 0, "endValue": 6.28,
          "duration": 3000, "easing": "linear", "repeat": true
        }
      ]
    },
    // Inner planet (fast orbit)
    {
      "id": "inner_planet", 
      "type": "circle",
      "props": { "x": 460, "y": 200, "r": 8, "fill": "#e67e22" },
      "animations": [
        {
          "property": "orbit",
          "centerX": 400, "centerY": 200, "radius": 60,
          "duration": 2000, "repeat": true, "easing": "linear"
        }
      ]
    },
    // Outer planet (slow orbit)
    {
      "id": "outer_planet",
      "type": "circle", 
      "props": { "x": 520, "y": 200, "r": 12, "fill": "#3498db" },
      "animations": [
        {
          "property": "orbit",
          "centerX": 400, "centerY": 200, "radius": 120,
          "duration": 5000, "repeat": true, "easing": "linear"
        }
      ]
    },
    // Moon orbiting outer planet
    {
      "id": "moon",
      "type": "circle",
      "props": { "x": 540, "y": 200, "r": 4, "fill": "#95a5a6" },
      "animations": [
        {
          "property": "orbit", 
          "centerX": 520, "centerY": 200, "radius": 20,
          "duration": 800, "repeat": true, "easing": "linear"
        }
      ]
    }
  ]
}
```

### Electron Orbitals

```json
{
  "layers": [
    // Nucleus
    {
      "id": "nucleus",
      "type": "circle",
      "props": { "x": 400, "y": 200, "r": 15, "fill": "#e74c3c" }
    },
    // Electron 1 (horizontal orbit)
    {
      "id": "electron1",
      "type": "circle",
      "props": { "x": 480, "y": 200, "r": 5, "fill": "#3498db" },
      "animations": [
        {
          "property": "orbit",
          "centerX": 400, "centerY": 200, "radius": 80,
          "duration": 1500, "repeat": true, "easing": "linear"
        }
      ]
    },
    // Electron 2 (vertical orbit)  
    {
      "id": "electron2",
      "type": "circle",
      "props": { "x": 400, "y": 280, "r": 5, "fill": "#2ecc71" },
      "animations": [
        {
          "property": "orbit", 
          "centerX": 400, "centerY": 200, "radius": 80,
          "duration": 1200, "repeat": true, "easing": "linear",
          "startAngle": 1.57 // π/2 radians = 90° offset
        }
      ]
    }
  ]
}
```

## 🎛️ Parameters for Orbital Motion

- `centerX`, `centerY`: Center point of the circular path
- `radius`: Distance from center to orbiting object
- `duration`: Time for one complete revolution (milliseconds)
- `startAngle`: Starting angle in radians (default: 0)
- `clockwise`: Boolean for direction (default: false = counterclockwise)
- `repeat`: Boolean for continuous orbiting (usually true)
- `easing`: Animation easing (usually "linear" for constant speed)

## 💡 Tips for Realistic Motion

1. **Use linear easing** for constant orbital speed (most realistic)
2. **Vary orbit durations** for different speeds (closer = faster)
3. **Add rotation** to spinning objects for extra realism  
4. **Layer multiple orbits** for complex systems
5. **Use different starting angles** to prevent collisions
6. **Consider elliptical orbits** using coordinated X/Y animations with different easing