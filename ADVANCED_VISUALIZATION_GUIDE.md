# Advanced Visualization Engine - LLM Guide

This document provides comprehensive guidance for Large Language Models (LLMs) on how to generate sophisticated visualizations using the enhanced visualization engine.

## 🎨 Available Shape Types

### Basic Shapes
- **circle**: Filled or stroked circles
- **rectangle** / **rect**: Rectangular shapes
- **ellipse**: Elliptical shapes
- **line**: Straight lines between points
- **arrow**: Directional arrows
- **text**: Text labels

### Advanced Shapes
- **star**: Multi-pointed stars with customizable inner/outer radius
- **polygon**: Custom polygons with array of points
- **spiral**: Spiral curves with configurable turns
- **wave**: Sine wave patterns
- **arc**: Arc segments and pie slices
- **bezier**: Bezier curves (quadratic and cubic)
- **particle**: Particle systems for dynamic effects
- **gradient**: Linear and radial gradients
- **path**: Custom paths with drawing commands

## 🎬 Animation System

### Animation Properties
Any shape property can be animated:
- Position: `x`, `y`
- Size: `r` (radius), `width`, `height`, `size`
- Color: `fill`, `stroke`
- Rotation: `rotation`
- Opacity: `opacity`
- Custom properties: `amplitude`, `phase`, etc.

### Easing Functions
Choose from 8 easing types for smooth animations:
- `linear`: Constant speed
- `easeInQuad`: Accelerating from zero
- `easeOutQuad`: Decelerating to zero
- `easeInOutQuad`: Acceleration until halfway, then deceleration
- `easeInCubic`: Cubic acceleration
- `easeOutCubic`: Cubic deceleration
- `easeInOutBounce`: Bouncy effect
- `easeOutElastic`: Elastic spring effect

### Animation Options
- `duration`: Animation length in milliseconds
- `delay`: Delay before animation starts
- `repeat`: Boolean for infinite repetition
- `alternate`: Boolean for back-and-forth animation

## 📐 Coordinate System

### Automatic Normalization
The engine automatically handles any coordinate system:
- Input coordinates can be any range (e.g., [0,100], [-50,50], [200,800])
- Engine detects bounds and normalizes to canvas space
- Maintains aspect ratio and adds appropriate padding

### Responsive Scaling
- Canvas automatically scales to container size
- All shapes maintain proportions across different screen sizes
- Text and stroke widths scale appropriately

## 🎨 Shape Examples

### Star Shape
```json
{
  "type": "star",
  "props": {
    "x": 100,
    "y": 100,
    "outerRadius": 50,
    "innerRadius": 25,
    "points": 5,
    "fill": "#f1c40f",
    "stroke": "#f39c12",
    "rotation": 0
  },
  "animations": [
    {
      "property": "rotation",
      "startValue": 0,
      "endValue": 6.28,
      "duration": 3000,
      "easing": "linear",
      "repeat": true
    }
  ]
}
```

### Particle System
```json
{
  "type": "particle",
  "props": {
    "particles": [
      {"x": 100, "y": 100, "size": 3, "opacity": 0.8, "color": "#ff6b6b"},
      {"x": 120, "y": 95, "size": 2, "opacity": 0.6, "color": "#4ecdc4"},
      {"x": 110, "y": 110, "size": 4, "opacity": 0.9, "color": "#45b7d1"}
    ]
  }
}
```

### Gradient Shape
```json
{
  "type": "gradient",
  "props": {
    "type": "radial",
    "x": 200,
    "y": 200,
    "radius": 100,
    "shape": "circle",
    "colorStops": [
      {"offset": 0, "color": "#ff6b6b"},
      {"offset": 0.5, "color": "#4ecdc4"},
      {"offset": 1, "color": "#45b7d1"}
    ]
  }
}
```

### Bezier Curve
```json
{
  "type": "bezier",
  "props": {
    "startPoint": {"x": 50, "y": 200},
    "controlPoint1": {"x": 100, "y": 50},
    "controlPoint2": {"x": 200, "y": 350},
    "endPoint": {"x": 250, "y": 200},
    "stroke": "#2ecc71",
    "strokeWidth": 3
  }
}
```

### Wave Animation
```json
{
  "type": "wave",
  "props": {
    "startX": 0,
    "startY": 200,
    "endX": 400,
    "amplitude": 50,
    "frequency": 0.02,
    "phase": 0,
    "stroke": "#3498db",
    "strokeWidth": 3
  },
  "animations": [
    {
      "property": "phase",
      "startValue": 0,
      "endValue": 12.56,
      "duration": 2000,
      "easing": "linear",
      "repeat": true
    }
  ]
}
```

### Custom Path
```json
{
  "type": "path",
  "props": {
    "commands": [
      {"type": "moveTo", "x": 100, "y": 100},
      {"type": "lineTo", "x": 200, "y": 150},
      {"type": "arc", "x": 250, "y": 150, "radius": 50, "startAngle": 0, "endAngle": 3.14},
      {"type": "closePath"}
    ],
    "fill": "#9b59b6",
    "stroke": "#8e44ad"
  }
}
```

## 🎭 Visual Effects

### Morphing Shapes
Animate between different shapes by changing their properties:
```json
{
  "type": "circle",
  "props": {"x": 100, "y": 100, "r": 30, "fill": "#e74c3c"},
  "animations": [
    {
      "property": "r",
      "startValue": 30,
      "endValue": 80,
      "duration": 2000,
      "easing": "easeInOutBounce",
      "alternate": true,
      "repeat": true
    }
  ]
}
```

### Color Transitions
Smoothly transition between colors:
```json
{
  "type": "rectangle",
  "props": {"x": 50, "y": 50, "width": 100, "height": 50, "fill": "#3498db"},
  "animations": [
    {
      "property": "fill",
      "startValue": "#3498db",
      "endValue": "#e74c3c",
      "duration": 1500,
      "easing": "easeInOutQuad",
      "alternate": true,
      "repeat": true
    }
  ]
}
```

### Complex Multi-Layer Animations
```json
{
  "layers": [
    {
      "type": "circle",
      "props": {"x": 200, "y": 200, "r": 50, "fill": "#3498db", "opacity": 0.7}
    },
    {
      "type": "star",
      "props": {"x": 200, "y": 200, "outerRadius": 30, "innerRadius": 15, "points": 8, "fill": "#f39c12"},
      "animations": [
        {
          "property": "rotation",
          "startValue": 0,
          "endValue": 6.28,
          "duration": 4000,
          "easing": "linear",
          "repeat": true
        }
      ]
    },
    {
      "type": "particle",
      "props": {
        "particles": Array.from({length: 12}, (_, i) => ({
          "x": 200 + Math.cos(i * 0.524) * 80,
          "y": 200 + Math.sin(i * 0.524) * 80,
          "size": 3,
          "opacity": 0.6,
          "color": "#e67e22"
        }))
      }
    }
  ]
}
```

## 🎯 Best Practices for LLMs

### 1. Coordinate Selection
- Use any coordinate range that makes sense for your visualization
- The engine will automatically normalize and scale appropriately
- For data visualizations, use data ranges directly

### 2. Animation Timing
- Use shorter durations (500-2000ms) for quick feedback
- Use longer durations (3000-5000ms) for ambient animations
- Stagger animation starts with delays for sequential effects

### 3. Color Harmony
- Use consistent color palettes
- Consider accessibility with sufficient contrast
- Use alpha/opacity for layering effects

### 4. Performance Considerations
- Limit particle count to 50-100 for smooth performance
- Use appropriate easing for the desired effect
- Consider alternating animations instead of infinite loops

### 5. Layering Strategy
- Background elements first (gradients, large shapes)
- Foreground elements last (text, particles, details)
- Use opacity for depth perception

## 🚀 Advanced Techniques

### Data-Driven Visualizations
Generate shapes based on data patterns:
- Use data points as coordinate arrays
- Map data values to visual properties (size, color, position)
- Create animated transitions between data states

### Interactive Previews
While the engine doesn't support direct interaction, you can:
- Use hover states through opacity changes
- Create click indicators with scale animations
- Provide visual feedback through color transitions

### Storytelling with Animation
- Use sequential animations to guide user attention
- Create narrative flows with timed reveals
- Combine multiple visualization techniques for rich experiences

## 📊 Example Use Cases

1. **Data Visualization**: Bar charts, scatter plots, network graphs
2. **Infographics**: Process flows, hierarchical data, comparisons  
3. **Educational Content**: Mathematical concepts, scientific processes
4. **Entertainment**: Games, interactive art, generative designs
5. **Business Presentations**: KPI dashboards, trend analysis, reports

## 🔧 Troubleshooting

### Common Issues
- **Shapes not appearing**: Check coordinate ranges and canvas bounds
- **Animations not smooth**: Verify easing function names and duration values
- **Colors not rendering**: Ensure valid CSS color formats
- **Performance issues**: Reduce particle count or animation complexity

### Debugging Tips
- Enable debug mode to see coordinate normalization
- Use console.log to track animation values
- Test with simple shapes before adding complexity
- Verify JSON structure and property names

This engine provides powerful capabilities for creating dynamic, responsive, and visually appealing visualizations that can adapt to any coordinate system and scale gracefully across different devices and screen sizes.