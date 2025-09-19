# Advanced Visualization Engine - LLM Generation Guide

## Overview
The visualization engine supports advanced shapes, animations, particle effects, and gradients with automatic coordinate normalization. You can use any coordinate system - the engine will automatically scale and position elements appropriately.

## Available Shape Types

### Basic Shapes
- `circle` - Filled circles with radius
- `rectangle` / `rect` - Rectangles and squares
- `ellipse` - Oval shapes with radiusX and radiusY
- `line` - Straight lines between two points
- `arrow` - Directional arrows
- `text` - Text labels with custom fonts

### Advanced Shapes
- `star` - Multi-pointed stars with inner/outer radius
- `polygon` - Custom polygons with array of points
- `wave` - Sine waves with amplitude and frequency
- `spiral` - Spirals with turns and radius
- `arc` - Circular arcs and pie sectors
- `bezier` / `curve` - Bezier curves with control points
- `path` - Custom paths with drawing commands
- `gradient` - Gradient-filled shapes (linear/radial)
- `particle` / `particles` - Particle effects and systems

## Shape Properties

### Universal Properties
```javascript
{
  x: number,           // X position (any coordinate system)
  y: number,           // Y position (any coordinate system) 
  fill: "color",       // Fill color (hex, rgb, hsl, name)
  stroke: "color",     // Stroke color
  strokeWidth: number, // Stroke thickness
  opacity: 0-1,        // Transparency (0=transparent, 1=opaque)
  rotation: radians    // Rotation angle in radians
}
```

### Shape-Specific Properties

#### Circle
```javascript
{
  type: "circle",
  r: number,           // Radius (or use 'radius' or 'size')
  fill: "#3498db"
}
```

#### Rectangle
```javascript
{
  type: "rectangle",
  width: number,       // Rectangle width
  height: number,      // Rectangle height
  fill: "#e74c3c"
}
```

#### Star
```javascript
{
  type: "star",
  outerRadius: number, // Outer point radius
  innerRadius: number, // Inner point radius  
  points: number,      // Number of star points (default: 5)
  rotation: radians,   // Star rotation
  fill: "#f1c40f"
}
```

#### Wave
```javascript
{
  type: "wave",
  startX: number,      // Wave start X position
  startY: number,      // Wave start Y position
  endX: number,        // Wave end X position
  amplitude: number,   // Wave height
  frequency: number,   // Wave frequency (0.01-0.05 typical)
  phase: radians,      // Wave phase offset
  stroke: "#3498db",
  strokeWidth: 3
}
```

#### Spiral
```javascript
{
  type: "spiral",
  x: number,           // Center X
  y: number,           // Center Y
  maxRadius: number,   // Maximum spiral radius
  turns: number,       // Number of spiral turns
  startAngle: radians, // Starting angle
  stroke: "#9b59b6"
}
```

#### Bezier Curve
```javascript
{
  type: "bezier",
  startPoint: {x, y},     // Curve start point
  endPoint: {x, y},       // Curve end point
  controlPoint1: {x, y},  // First control point (quadratic/cubic)
  controlPoint2: {x, y},  // Second control point (cubic only)
  stroke: "#2ecc71",
  strokeWidth: 3
}
```

#### Particle System
```javascript
{
  type: "particle",
  particles: [           // Array of individual particles
    {
      x: number,
      y: number,
      size: number,      // Particle radius
      color: "color",    // Individual particle color
      opacity: 0-1       // Individual particle opacity
    }
  ],
  // OR single particle:
  x: number,
  y: number,
  size: number,
  color: "#ffffff"
}
```

#### Gradient Shape
```javascript
{
  type: "gradient",
  shape: "circle|rectangle", // Shape to fill with gradient
  type: "linear|radial",     // Gradient type
  
  // For linear gradients:
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  
  // For radial gradients:
  x: number,      // Center X
  y: number,      // Center Y
  radius: number, // Gradient radius
  
  // Color stops:
  colorStops: [
    {offset: 0, color: "#ff6b6b"},
    {offset: 0.5, color: "#4ecdc4"}, 
    {offset: 1, color: "#45b7d1"}
  ]
}
```

## Animation System

### Animation Properties
```javascript
{
  animations: [
    {
      property: "property_name",  // Property to animate
      startValue: value,          // Starting value
      endValue: value,           // Ending value  
      duration: milliseconds,    // Animation duration
      delay: milliseconds,       // Start delay (optional)
      easing: "easing_type",     // Easing function
      repeat: true|false,        // Loop animation
      alternate: true|false      // Reverse on repeat
    }
  ]
}
```

### Available Easing Types
- `linear` - Constant speed
- `easeInQuad` - Slow start, accelerating
- `easeOutQuad` - Fast start, decelerating  
- `easeInOutQuad` - Slow start and end
- `easeInCubic` - Very slow start
- `easeOutCubic` - Very fast start
- `easeInOutCubic` - Smooth acceleration/deceleration
- `easeInOutBounce` - Bouncy effect
- `easeInOutElastic` - Elastic spring effect

### Animatable Properties
- Position: `x`, `y`
- Size: `r`, `radius`, `width`, `height`, `outerRadius`, `innerRadius`
- Appearance: `opacity`, `rotation`
- Wave: `amplitude`, `frequency`, `phase`
- Colors: `fill`, `stroke` (for color transitions)

## Coordinate System

### Automatic Normalization
The engine automatically handles any coordinate system:
- Small ranges: [0,1], [-1,1]
- Medium ranges: [0,100], [0,500] 
- Large ranges: [0,1000], [-500,500]

### Best Practices
1. **Use consistent coordinate ranges** within a single visualization
2. **Consider canvas size** - typical canvas is 800x400 pixels
3. **Use relative positioning** for responsive designs
4. **Test different scales** - engine handles [0,1] to [0,10000] ranges

## Example Visualizations

### Animated Solar System
```javascript
{
  layers: [
    // Sun
    {
      id: 1,
      type: "circle",
      props: {x: 400, y: 200, r: 30, fill: "#f1c40f"}
    },
    // Earth orbit
    {
      id: 2, 
      type: "circle",
      props: {x: 400, y: 200, r: 8, fill: "#3498db"},
      animations: [{
        property: "x",
        startValue: 500,
        endValue: 300, 
        duration: 4000,
        easing: "linear",
        repeat: true
      }]
    }
  ]
}
```

### Data Visualization with Particles
```javascript
{
  layers: [
    // Background
    {
      id: 1,
      type: "gradient",
      props: {
        shape: "rectangle",
        type: "linear",
        x: 0, y: 0, width: 800, height: 400,
        startX: 0, startY: 0, endX: 800, endY: 0,
        colorStops: [
          {offset: 0, color: "#2c3e50"},
          {offset: 1, color: "#34495e"}
        ]
      }
    },
    // Data points as particles
    {
      id: 2,
      type: "particle",
      props: {
        particles: [
          {x: 100, y: 100, size: 5, color: "#e74c3c", opacity: 0.8},
          {x: 200, y: 150, size: 8, color: "#3498db", opacity: 0.9},
          {x: 300, y: 120, size: 6, color: "#2ecc71", opacity: 0.7}
        ]
      }
    }
  ]
}
```

### Complex Animated Scene
```javascript
{
  layers: [
    // Animated wave background
    {
      id: 1,
      type: "wave",
      props: {
        startX: 0, startY: 300, endX: 800,
        amplitude: 50, frequency: 0.02, phase: 0,
        stroke: "#3498db", strokeWidth: 4, opacity: 0.6
      },
      animations: [{
        property: "phase",
        startValue: 0,
        endValue: 6.28,
        duration: 3000,
        easing: "linear",
        repeat: true
      }]
    },
    // Rotating star
    {
      id: 2,
      type: "star", 
      props: {
        x: 400, y: 150, outerRadius: 40, innerRadius: 20,
        points: 6, fill: "#f39c12", rotation: 0
      },
      animations: [{
        property: "rotation",
        startValue: 0,
        endValue: 6.28,
        duration: 2000, 
        easing: "linear",
        repeat: true
      }]
    },
    // Bouncing elements
    {
      id: 3,
      type: "circle",
      props: {x: 200, y: 100, r: 15, fill: "#e74c3c"},
      animations: [{
        property: "y",
        startValue: 100,
        endValue: 250,
        duration: 1000,
        easing: "easeInOutBounce", 
        alternate: true,
        repeat: true
      }]
    }
  ]
}
```

## Performance Guidelines

### Optimization Tips
1. **Limit particle count** - Keep under 50 particles for smooth animation
2. **Use efficient easing** - Linear is fastest, elastic/bounce are more expensive
3. **Batch similar shapes** - Group similar elements when possible
4. **Reasonable animation duration** - 1-5 seconds typical, avoid very long animations

### Memory Management
- Engine automatically cleans up completed animations
- Coordinate normalization is cached for performance
- Canvas is efficiently cleared and redrawn each frame

## Error Handling

### Common Issues
- **Missing properties**: Engine provides sensible defaults
- **Invalid coordinates**: Automatic normalization handles edge cases
- **Unknown shape types**: Falls back to circle with warning
- **Animation conflicts**: Later animations override earlier ones

### Debug Mode
Enable debug logging to see coordinate transformations:
```javascript
// Debug info shows:
// - Original coordinates from LLM
// - Normalized coordinates 
// - Final canvas coordinates
// - Animation states
```

## Best Practices for LLM Generation

1. **Be Creative** - Use combinations of shapes, gradients, and particles
2. **Add Motion** - Animations make visualizations engaging
3. **Use Color Effectively** - Gradients and varied colors enhance appeal
4. **Consider Context** - Match visualization style to data/concept
5. **Layer Elements** - Build complex scenes with multiple layers
6. **Test Coordinates** - Any reasonable coordinate system works
7. **Combine Effects** - Mix particles, gradients, and animated shapes

Remember: The engine is designed to handle creative and varied input from LLMs. Don't hesitate to use advanced features and combinations!