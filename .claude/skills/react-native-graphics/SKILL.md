---
name: react-native-graphics
description: Expert knowledge of graphics and animation in React Native. Use when building custom visualizations, scrolling displays, canvas-based UIs, smooth animations, or performance-critical graphics like the staff visualizer.
---

# React Native Graphics and Animation

This skill covers building high-performance graphics and smooth animations in React Native, focusing on React Native Skia and Reanimated for the harmony app's staff visualization.

---

## 1. Library Choices

### React Native Skia (Recommended for Custom Graphics)

GPU-accelerated 2D graphics library from Shopify. Best for custom drawing like the musical staff.

```bash
npm install @shopify/react-native-skia
```

**Why Skia**:
- Direct GPU rendering (no bridge overhead)
- 60+ fps even with complex graphics
- Uses JSI for synchronous C++ calls
- Works seamlessly with Reanimated
- Consistent across iOS and Android

### React Native Reanimated (For Animations)

The standard for smooth animations that run on the UI thread.

```bash
npm install react-native-reanimated
```

**Why Reanimated**:
- Animations run on UI thread (60fps)
- Shared values update without JS bridge
- Integrates with Skia for animated drawings
- Gesture handling built-in

### When to Use What

| Need | Use |
|------|-----|
| Custom shapes, paths, drawings | Skia |
| Scrolling content | Reanimated |
| Animated transformations | Reanimated |
| Dynamic graphics that animate | Skia + Reanimated |
| Simple view animations | Reanimated alone |

---

## 2. React Native Skia Basics

### Canvas Setup

```jsx
import { Canvas, Path, Line, Circle } from '@shopify/react-native-skia';

function StaffVisualization() {
  return (
    <Canvas style={{ flex: 1 }}>
      {/* Draw elements here */}
    </Canvas>
  );
}
```

### Drawing Primitives

**Lines** (for staff lines):
```jsx
<Line
  p1={{ x: 0, y: 100 }}
  p2={{ x: 400, y: 100 }}
  color="black"
  strokeWidth={1}
/>
```

**Circles** (for note heads):
```jsx
<Circle
  cx={100}
  cy={150}
  r={8}
  color="black"
/>
```

**Ovals** (for note heads with proper shape):
```jsx
import { Oval } from '@shopify/react-native-skia';

<Oval
  x={100}
  y={140}
  width={12}
  height={10}
  color="black"
/>
```

**Paths** (for complex shapes):
```jsx
import { Path, Skia } from '@shopify/react-native-skia';

const path = Skia.Path.Make();
path.moveTo(0, 0);
path.lineTo(10, 20);
path.lineTo(20, 0);
path.close();

<Path path={path} color="black" />
```

### Filled vs Stroked

```jsx
// Filled shape
<Circle cx={100} cy={100} r={10} color="black" />

// Stroked shape (outline only)
<Circle
  cx={100}
  cy={100}
  r={10}
  color="black"
  style="stroke"
  strokeWidth={2}
/>
```

---

## 3. Drawing a Musical Staff

### Basic Five-Line Staff

```jsx
function Staff({ width, yOffset, lineSpacing = 10 }) {
  const lines = [];

  for (let i = 0; i < 5; i++) {
    const y = yOffset + i * lineSpacing;
    lines.push(
      <Line
        key={i}
        p1={{ x: 0, y }}
        p2={{ x: width, y }}
        color="#333333"
        strokeWidth={1}
      />
    );
  }

  return <>{lines}</>;
}
```

### Note Position Calculation

```jsx
// Convert pitch to Y position on staff
function pitchToY(midiNote, staffTop, lineSpacing) {
  // Middle line of staff (B4 on treble clef) = MIDI 71
  const middleLineNote = 71;
  const middleLineY = staffTop + 2 * lineSpacing;

  // Each step on staff = half of lineSpacing
  // (lines and spaces alternate)
  const stepSize = lineSpacing / 2;

  // Calculate steps from middle line
  // Use diatonic steps, not chromatic
  const steps = getDiatonicSteps(midiNote, middleLineNote);

  return middleLineY - steps * stepSize;
}

// Convert MIDI to diatonic position (C D E F G A B)
function getDiatonicSteps(midiNote, referenceNote) {
  const noteInOctave = midiNote % 12;
  const refInOctave = referenceNote % 12;

  const octaveDiff = Math.floor(midiNote / 12) - Math.floor(referenceNote / 12);

  // Map chromatic to diatonic (0=C, 2=D, 4=E, 5=F, 7=G, 9=A, 11=B)
  const chromaticToDiatonic = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];

  const diatonicNote = chromaticToDiatonic[noteInOctave];
  const diatonicRef = chromaticToDiatonic[refInOctave];

  return (octaveDiff * 7) + (diatonicNote - diatonicRef);
}
```

### Drawing a Note

```jsx
function Note({ x, y, type, color = 'black' }) {
  const noteWidth = 12;
  const noteHeight = 10;

  const isFilled = type === 'quarter' || type === 'eighth' || type === 'sixteenth';

  return (
    <Group>
      {/* Note head */}
      <Oval
        x={x - noteWidth / 2}
        y={y - noteHeight / 2}
        width={noteWidth}
        height={noteHeight}
        color={color}
        style={isFilled ? 'fill' : 'stroke'}
        strokeWidth={2}
      />

      {/* Stem (for half, quarter, eighth, sixteenth) */}
      {type !== 'whole' && (
        <Line
          p1={{ x: x + noteWidth / 2 - 1, y: y }}
          p2={{ x: x + noteWidth / 2 - 1, y: y - 30 }}
          color={color}
          strokeWidth={1.5}
        />
      )}
    </Group>
  );
}
```

### Ledger Lines

```jsx
function LedgerLines({ x, y, staffTop, staffBottom, lineSpacing, noteWidth }) {
  const lines = [];

  // Above staff
  let currentY = staffTop - lineSpacing;
  while (currentY >= y) {
    lines.push(
      <Line
        key={`above-${currentY}`}
        p1={{ x: x - noteWidth, y: currentY }}
        p2={{ x: x + noteWidth, y: currentY }}
        color="#333333"
        strokeWidth={1}
      />
    );
    currentY -= lineSpacing;
  }

  // Below staff
  currentY = staffBottom + lineSpacing;
  while (currentY <= y) {
    lines.push(
      <Line
        key={`below-${currentY}`}
        p1={{ x: x - noteWidth, y: currentY }}
        p2={{ x: x + noteWidth, y: currentY }}
        color="#333333"
        strokeWidth={1}
      />
    );
    currentY += lineSpacing;
  }

  return <>{lines}</>;
}
```

---

## 4. Animation with Reanimated

### Shared Values

```jsx
import { useSharedValue, withTiming, withSpring } from 'react-native-reanimated';

function AnimatedComponent() {
  const xPosition = useSharedValue(0);

  // Animate to new position
  const moveTo = (newX) => {
    xPosition.value = withTiming(newX, { duration: 300 });
  };

  return /* ... */;
}
```

### Using Shared Values in Skia

```jsx
import { useSharedValue } from 'react-native-reanimated';
import { Canvas, Circle, useValue } from '@shopify/react-native-skia';

function AnimatedCircle() {
  const cx = useSharedValue(100);

  // Animate position
  useEffect(() => {
    cx.value = withTiming(300, { duration: 1000 });
  }, []);

  return (
    <Canvas style={{ flex: 1 }}>
      <Circle cx={cx} cy={100} r={20} color="blue" />
    </Canvas>
  );
}
```

### Continuous Scrolling Animation

For the staff that scrolls left continuously:

```jsx
import { useSharedValue, useFrameCallback, useDerivedValue } from 'react-native-reanimated';

function ScrollingStaff({ tempo, isPlaying }) {
  const scrollOffset = useSharedValue(0);

  // Pixels per second based on tempo
  const scrollSpeed = useMemo(() => {
    const beatsPerSecond = tempo / 60;
    const pixelsPerBeat = 100;  // Adjust based on note spacing
    return beatsPerSecond * pixelsPerBeat;
  }, [tempo]);

  // Update scroll on every frame
  useFrameCallback((frameInfo) => {
    if (isPlaying) {
      const deltaSeconds = frameInfo.timeSincePreviousFrame / 1000;
      scrollOffset.value -= scrollSpeed * deltaSeconds;
    }
  });

  return (
    <Canvas style={{ flex: 1 }}>
      <Group transform={[{ translateX: scrollOffset }]}>
        {/* Notes and staff elements here */}
      </Group>
    </Canvas>
  );
}
```

---

## 5. The Now Line and User Pitch Indicator

### Fixed Position Elements

The now line and user pitch stay at fixed X positions:

```jsx
function Visualization({ width, height }) {
  const NOW_LINE_PERCENT = 0.25;  // 25% from left
  const nowLineX = width * NOW_LINE_PERCENT;

  return (
    <Canvas style={{ width, height }}>
      {/* Scrolling content */}
      <Group transform={[{ translateX: scrollOffset }]}>
        <Staff />
        <Notes />
      </Group>

      {/* Fixed position elements */}
      <NowLine x={nowLineX} height={height} />
      <UserPitchIndicator x={nowLineX} y={userPitchY} />
    </Canvas>
  );
}
```

### Now Line

```jsx
function NowLine({ x, height }) {
  return (
    <Line
      p1={{ x, y: 0 }}
      p2={{ x, y: height }}
      color="rgba(100, 100, 100, 0.3)"
      strokeWidth={2}
    />
  );
}
```

### User Pitch Indicator with Trail

```jsx
function UserPitchIndicator({ x, y, trail, color }) {
  return (
    <Group>
      {/* Trail (fading path behind) */}
      <Path
        path={createTrailPath(trail)}
        color={color}
        style="stroke"
        strokeWidth={3}
        opacity={0.5}
      />

      {/* Current position (filled note head) */}
      <Oval
        x={x - 6}
        y={y - 5}
        width={12}
        height={10}
        color={color}
      />
    </Group>
  );
}

function createTrailPath(trailPoints) {
  const path = Skia.Path.Make();
  if (trailPoints.length === 0) return path;

  path.moveTo(trailPoints[0].x, trailPoints[0].y);
  for (let i = 1; i < trailPoints.length; i++) {
    path.lineTo(trailPoints[i].x, trailPoints[i].y);
  }

  return path;
}
```

### Color Based on Accuracy

```jsx
function getAccuracyColor(centsOff) {
  const absCents = Math.abs(centsOff);

  if (absCents <= 25) {
    // Green zone
    return '#22c55e';
  } else if (absCents <= 50) {
    // Yellow zone - interpolate between green and yellow
    const t = (absCents - 25) / 25;
    return interpolateColor(t, '#22c55e', '#eab308');
  } else {
    // Red zone - interpolate between yellow and red
    const t = Math.min((absCents - 50) / 50, 1);
    return interpolateColor(t, '#eab308', '#ef4444');
  }
}

function interpolateColor(t, color1, color2) {
  // Simple hex color interpolation
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
```

---

## 6. Trail Management

### Recording Trail Points

```jsx
function useTrail(x, y, maxLength = 100) {
  const trailRef = useRef([]);

  useFrameCallback(() => {
    // Add current position
    trailRef.current.push({ x, y, time: Date.now() });

    // Remove old points (keep ~2 seconds)
    const cutoffTime = Date.now() - 2000;
    trailRef.current = trailRef.current.filter(p => p.time > cutoffTime);

    // Also limit by count
    if (trailRef.current.length > maxLength) {
      trailRef.current = trailRef.current.slice(-maxLength);
    }
  });

  return trailRef.current;
}
```

### Trail with Scroll Offset

Since the trail scrolls with the staff:

```jsx
function TrailWithScroll({ scrollOffset, currentX, currentY }) {
  const trailPoints = useRef([]);

  useFrameCallback(() => {
    // Store position in world coordinates (accounting for scroll)
    const worldX = currentX - scrollOffset.value;
    trailPoints.current.push({ x: worldX, y: currentY });

    // Trim old points
    // ...
  });

  // When rendering, the Group transform handles the scroll
  return (
    <Path
      path={createTrailPath(trailPoints.current)}
      color="green"
      style="stroke"
    />
  );
}
```

---

## 7. Responsive Layout

### Getting Screen Dimensions

```jsx
import { useWindowDimensions } from 'react-native';

function StaffVisualization() {
  const { width, height } = useWindowDimensions();

  const nowLineX = width * 0.25;
  const fadeOutX = width * 0.1;
  const lookAheadWidth = width * 0.75;

  return (
    <Canvas style={{ width, height }}>
      {/* ... */}
    </Canvas>
  );
}
```

### Scaling for Different Screen Sizes

```jsx
function getStaffDimensions(screenHeight) {
  // Staff takes middle portion of screen
  const staffHeight = screenHeight * 0.4;
  const lineSpacing = staffHeight / 8;  // 5 lines = 4 spaces, plus margin
  const staffTop = (screenHeight - staffHeight) / 2;

  return { staffHeight, lineSpacing, staffTop };
}
```

---

## 8. Performance Tips

### Minimize Re-renders

```jsx
// Bad: creates new array every render
<Group>
  {notes.map(note => <Note key={note.id} {...note} />)}
</Group>

// Better: memoize
const MemoizedNote = React.memo(Note);

<Group>
  {notes.map(note => <MemoizedNote key={note.id} {...note} />)}
</Group>
```

### Use Worklets for Calculations

```jsx
import { runOnJS, runOnUI } from 'react-native-reanimated';

// Run expensive calculations on UI thread
const calculatePositions = (notes, scrollOffset) => {
  'worklet';
  return notes.map(note => ({
    ...note,
    screenX: note.x + scrollOffset
  }));
};
```

### Batch Updates

```jsx
// Update multiple shared values at once
const updateState = () => {
  'worklet';
  scrollOffset.value = newScroll;
  userPitchY.value = newY;
  trailOpacity.value = withTiming(1);
};

runOnUI(updateState)();
```

---

## 9. Out-of-Range Indicator

When user pitch goes above or below staff:

```jsx
function OutOfRangeIndicator({ x, y, direction, staffTop, staffBottom }) {
  const clampedY = Math.max(staffTop, Math.min(y, staffBottom));
  const isOutOfRange = y < staffTop || y > staffBottom;

  if (!isOutOfRange) {
    return <NormalNoteHead x={x} y={y} />;
  }

  return (
    <Group>
      {/* Note stuck to edge */}
      <Oval
        x={x - 6}
        y={clampedY - 5}
        width={12}
        height={10}
        color="currentColor"
      />

      {/* Arrow inside note */}
      <Arrow
        x={x}
        y={clampedY}
        direction={direction}  // 'up' or 'down'
      />
    </Group>
  );
}

function Arrow({ x, y, direction }) {
  const path = Skia.Path.Make();

  if (direction === 'up') {
    path.moveTo(x, y - 3);
    path.lineTo(x - 3, y + 2);
    path.lineTo(x + 3, y + 2);
  } else {
    path.moveTo(x, y + 3);
    path.lineTo(x - 3, y - 2);
    path.lineTo(x + 3, y - 2);
  }
  path.close();

  return <Path path={path} color="white" />;
}
```

---

## Summary

For the harmony app visualization:

1. Use **React Native Skia** for drawing the staff, notes, and indicators
2. Use **Reanimated** for smooth scrolling and pitch animation
3. Keep the **now line at fixed X position** (25% from left)
4. **Scroll content left** using a transform on a Group
5. **Trail scrolls with content** but clips/fades at left edge
6. Calculate **note Y positions** from MIDI using diatonic mapping
7. **Color-code accuracy** with green/yellow/red interpolation
8. Handle **out-of-range** with edge clamping and arrow indicator
