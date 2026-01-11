# Brain Network Simulation - Project Plan

## Overview

A real-time brain network visualization and simulation with learning capabilities. The interface displays a sagittal (side profile) brain with 6 interconnected neural network compartments, a central hub for coordination, and a dashboard for monitoring and control.

---

## Architecture

### Visual Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   [IN-1]──┐    ╭─────────────────────────────────╮    ┌──────────────────┐ │
│   [IN-2]──┼──► │  ┌─────────┐      ┌─────────┐   │    │  DASHBOARD       │ │
│   [IN-3]──┘    │  │ Frontal │      │ Parietal│   │    │                  │ │
│                │  └────┬────┘      └────┬────┘   │    │  ▊▊▊▊ Activity   │ │
│                │       │    ┌──────┐    │        │    │  ~~~~ Flow Graph │ │
│                │       └────┤ HUB  ├────┘        │    │  ▓▓▓▓ Heatmap    │ │
│                │       ┌────┤      ├────┐        │    │                  │ │
│                │  ┌────┴────┐      ┌────┴────┐   │    │  [Controls]      │ │
│                │  │ Motor   │      │Sensory  │◄──┼────│  ▶ ❚❚ ⏹ Speed   │ │
│                │  └────┬────┘      └─────────┘   │    │                  │ │
│   [OUT-1]◄─────┼───────┤  ┌─────────┐            │    │  [Hub Readout]   │ │
│   [OUT-2]◄─────┼───────┘  │Temporal │            │    │  State: [####]   │ │
│                │          └────┬────┘            │    │                  │ │
│                │  ┌─────────┐  │   ┌──────────┐  │    │  [Stats]         │ │
│                │  │Occipital├──┘   │          │  │    │  Signals: 1234   │ │
│                │  └─────────┘      └──────────┘  │    │  Rate: 45/s      │ │
│                ╰─────────────────────────────────╯    └──────────────────┘ │
│                     Brain (60%)                         Dashboard (40%)    │
└────────────────────────────────────────────────────────────────────────────┘
```

### Screen Layout
- **Brain visualization**: ~60% of screen (left side)
- **Dashboard**: ~40% of screen (right side)
- **No scrolling**: Everything fits in viewport

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI (Python) |
| Real-time | WebSocket |
| Frontend | Pure HTML, CSS, JavaScript |
| Rendering | HTML5 Canvas |

### Project Structure

```
brain_sim/
├── main.py                 # FastAPI app, WebSocket handler
├── simulation/
│   ├── __init__.py
│   ├── network.py          # Network and Neuron classes
│   ├── region.py           # Brain region compartments
│   ├── central_hub.py      # Central hub (aggregator/controller)
│   ├── signals.py          # Signal propagation logic
│   └── learning.py         # Learning algorithms (future)
├── static/
│   ├── index.html          # Main page
│   ├── css/
│   │   └── style.css       # Neon/cyber styling
│   └── js/
│       ├── main.js         # App initialization
│       ├── brain.js        # Brain canvas rendering
│       ├── network.js      # Network visualization
│       ├── dashboard.js    # Dashboard components
│       └── websocket.js    # WebSocket client
├── requirements.txt
└── PLAN.md                 # This file
```

---

## Brain Regions (6 Compartments)

| Region | Function | Position (Sagittal) |
|--------|----------|---------------------|
| **Frontal** | Planning, decision-making | Front-top |
| **Parietal** | Spatial processing, integration | Back-top |
| **Temporal** | Memory, pattern storage | Middle-bottom |
| **Occipital** | Pattern processing | Back-bottom |
| **Motor** | Output generation | Front-middle |
| **Sensory** | Input reception | Middle (receives from input ports) |

### Central Hub
- **Role**: Aggregator + Controller
- **Connects**: All 6 regions bidirectionally
- **Functions**:
  - Aggregates activity state from all regions
  - Routes signals between regions
  - Modulates regional activity based on global state
  - Provides readout for monitoring/learning

---

## Input/Output System

### Input (Abstract Ports)
- **Ports**: `IN-1`, `IN-2`, `IN-3` (expandable)
- **Purpose**: Feed synthetic data into network
- **Data types**: Number sequences, arithmetic, text tokens, abstract patterns
- **Flow**: Input ports → Sensory region → Network

### Output
- **Motor output**: Abstract ports `OUT-1`, `OUT-2` from Motor region
- **Hub readout**: Numeric/pattern values representing internal state
- **Purpose**: Network's response/prediction/action

---

## Visual Specifications

### Style: Neon/Cyber

| Element | Color |
|---------|-------|
| Background | Dark (#0a0a0f or similar) |
| Brain outline | Dim gray/purple |
| Inactive neurons | Dim cyan |
| Active neurons | Bright cyan/white glow |
| Signals (traveling) | Magenta/pink pulses |
| Connections | Dark blue, brighten when active |
| Hub | Central glow, gold/yellow accent |
| Dashboard | Matching neon accents |

### Brain Shape
- **View**: Sagittal (side profile)
- **Style**: Realistic silhouette with gyri/sulci (folds)
- **Rendering**: Canvas path or SVG-based outline

### Neurons
- **Count**: 50-100 per region
- **Appearance**: Small circles, glow when active
- **Animation**: Pulse/fade when firing

### Signals
- **Style**: Glowing pulses traveling along connections
- **Speed**: Configurable via slider
- **Visual**: Bright dot/glow moving along connection paths

---

## Dashboard Components

### 1. Activity Levels (Per Region)
- 6 horizontal bars or gauges
- Real-time activity percentage for each region
- Color-coded by region

### 2. Signal Flow Graph
- Real-time line chart
- X-axis: Time
- Y-axis: Total network activity
- Shows activity waves over time

### 3. Connection Heatmap
- Grid or matrix visualization
- Shows which region-to-region pathways are most active
- Color intensity = connection activity

### 4. Network Statistics
- Total signals processed
- Current firing rate (signals/second)
- Active neurons count
- Synchronization metric

### 5. Hub Readout
- Current aggregated state from central hub
- Visual representation of output values

---

## Controls

### Playback
- **Play/Pause**: Start/stop simulation
- **Step**: Advance one tick manually
- **Reset**: Return to initial state

### Speed
- **Slider**: Adjust simulation speed (slow ↔ fast)
- **Default**: Medium speed

### Stimulation
- **Click any region**: Inject signal burst
- **Click specific neuron**: Stimulate single neuron
- **Input ports**: Feed structured data

### Parameters (Future)
- Connection strength
- Firing threshold
- Decay rate
- Learning rate

---

## Data Flow

```
1. Input Phase
   [External Data] → [Input Ports] → [Sensory Region]

2. Processing Phase
   [Sensory] → [Hub] → [Other Regions]
   [Regions] ↔ [Hub] ↔ [Regions]
   (signals propagate based on connection weights)

3. Output Phase
   [Motor Region] → [Output Ports]
   [Hub] → [Readout Display]

4. Learning Phase (Future)
   [Compare output vs expected]
   [Adjust connection weights]
   [Repeat]
```

---

## WebSocket Protocol

### Server → Client Messages

```json
{
  "type": "state_update",
  "data": {
    "neurons": [
      {"id": "f_001", "region": "frontal", "activity": 0.8, "x": 120, "y": 50}
    ],
    "signals": [
      {"from": "f_001", "to": "h_001", "progress": 0.5}
    ],
    "hub_state": [0.2, 0.8, 0.1, 0.5],
    "stats": {
      "total_signals": 1234,
      "firing_rate": 45.2,
      "active_neurons": 89
    }
  }
}
```

### Client → Server Messages

```json
{
  "type": "control",
  "action": "play" | "pause" | "step" | "reset"
}

{
  "type": "stimulate",
  "target": "region" | "neuron",
  "id": "frontal" | "f_001"
}

{
  "type": "input",
  "data": [1, 2, 3, 4]
}

{
  "type": "set_speed",
  "value": 0.5
}
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Set up FastAPI project structure
- [ ] Create basic HTML/CSS layout (60/40 split)
- [ ] Draw brain outline on canvas
- [ ] Position 6 region boundaries within brain shape

### Phase 2: Static Network
- [ ] Generate neurons within each region
- [ ] Create connections (intra-region + to hub)
- [ ] Render neurons and connections on canvas
- [ ] Style with neon/cyber theme

### Phase 3: Animation
- [ ] Implement neuron activation (glow effect)
- [ ] Animate signals traveling along connections
- [ ] Add random/mock activity for testing
- [ ] Implement render loop

### Phase 4: WebSocket Integration
- [ ] Set up WebSocket server in FastAPI
- [ ] Create WebSocket client in JS
- [ ] Stream simulation state to frontend
- [ ] Handle control messages from frontend

### Phase 5: Dashboard
- [ ] Create activity bars for each region
- [ ] Add real-time signal flow graph
- [ ] Implement connection heatmap
- [ ] Display network statistics
- [ ] Add hub readout display

### Phase 6: Controls
- [ ] Play/Pause/Step/Reset buttons
- [ ] Speed slider
- [ ] Click-to-stimulate on canvas
- [ ] Input port interface

### Phase 7: Simulation Logic
- [ ] Implement neuron firing model
- [ ] Signal propagation rules
- [ ] Hub aggregation logic
- [ ] Hub control/modulation logic

### Phase 8: Learning (Future)
- [ ] Design learning interface
- [ ] Implement Hebbian learning option
- [ ] Implement reward-based learning option
- [ ] Training loop with input/expected output

---

## Future Considerations

- **Save/Load**: Save network state and learned weights
- **Presets**: Different network configurations
- **Data Input UI**: Interface to define input sequences
- **Training Mode**: Automated training with datasets
- **Performance**: WebGL rendering if neuron count increases
- **Multiple Learning Modes**: Switch between learning algorithms

---

## Notes

- Start with visualization, add simulation logic incrementally
- Use mock/random data to test visuals before real simulation
- Keep the interface responsive - no scrolling required
- Central hub is key for future learning capabilities
