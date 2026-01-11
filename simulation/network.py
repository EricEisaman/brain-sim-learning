"""
Core network components: Neuron, Connection, Region, Network

This mirrors the JavaScript implementation for potential server-side simulation.
"""

import random
import math
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple


@dataclass
class Neuron:
    """Represents a single neuron in the network."""

    id: str
    x: float
    y: float
    region_id: str

    # State
    activity: float = 0.0
    threshold: float = 0.5
    potential: float = 0.0
    refractory: int = 0

    # Connections (populated after creation)
    outgoing: List['Connection'] = field(default_factory=list)
    incoming: List['Connection'] = field(default_factory=list)

    # Visual
    radius: float = field(default_factory=lambda: random.uniform(2, 4))

    def receive_input(self, amount: float, weight: float = 1.0):
        """Receive input from another neuron."""
        if self.refractory > 0:
            return
        self.potential += amount * weight

    def update(self, decay_rate: float = 0.05) -> List[Tuple['Connection', float]]:
        """Update neuron state. Returns list of (connection, strength) to fire."""
        signals = []

        # Decay refractory period
        if self.refractory > 0:
            self.refractory -= 1
            self.activity *= 0.8

        # Check if should fire
        if self.potential >= self.threshold and self.refractory <= 0:
            signals = self._fire()

        # Decay potential
        self.potential *= (1 - decay_rate)

        return signals

    def _fire(self) -> List[Tuple['Connection', float]]:
        """Fire the neuron."""
        self.activity = 1.0
        self.potential = 0.0
        self.refractory = 5

        return [(conn, self.activity) for conn in self.outgoing]

    def stimulate(self, strength: float = 1.0):
        """Manually stimulate this neuron."""
        self.potential += strength


@dataclass
class Signal:
    """A signal traveling along a connection."""
    progress: float = 0.0
    strength: float = 1.0


@dataclass
class Connection:
    """Represents a connection between two neurons."""

    id: str
    from_neuron: Neuron
    to_neuron: Neuron
    weight: float = 1.0

    # Visual state
    activity: float = 0.0
    signals: List[Signal] = field(default_factory=list)

    def add_signal(self, strength: float):
        """Add a signal to travel along this connection."""
        self.signals.append(Signal(progress=0, strength=strength))
        self.activity = min(1.0, self.activity + 0.3)

    def update(self, speed_multiplier: float = 1.0, base_speed: float = 0.02) -> List[Signal]:
        """Update signals. Returns list of arrived signals."""
        arrived = []
        remaining = []

        for signal in self.signals:
            signal.progress += base_speed * speed_multiplier

            if signal.progress >= 1.0:
                arrived.append(signal)
            else:
                remaining.append(signal)

        self.signals = remaining
        self.activity *= 0.95

        return arrived


class Region:
    """Represents a brain region containing multiple neurons."""

    def __init__(
        self,
        id: str,
        name: str,
        color: str,
        relative_position: Tuple[float, float],
        relative_size: float,
        neuron_count: int = 60
    ):
        self.id = id
        self.name = name
        self.color = color
        self.relative_position = relative_position
        self.relative_size = relative_size
        self.neuron_count = neuron_count

        # Calculated absolute position (set by Network)
        self.x: float = 0
        self.y: float = 0
        self.radius: float = 0

        self.neurons: List[Neuron] = []
        self.total_activity: float = 0

    def generate_neurons(self, bounds: Dict[str, float]):
        """Generate neurons within this region."""
        # Calculate absolute position
        self.x = bounds['x'] + bounds['width'] * self.relative_position[0]
        self.y = bounds['y'] + bounds['height'] * self.relative_position[1]
        self.radius = min(bounds['width'], bounds['height']) * self.relative_size

        for i in range(self.neuron_count):
            angle = random.random() * math.pi * 2
            r = random.random() * self.radius * 0.85

            neuron = Neuron(
                id=f"{self.id}_{i}",
                x=self.x + math.cos(angle) * r,
                y=self.y + math.sin(angle) * r,
                region_id=self.id
            )
            self.neurons.append(neuron)

    def update(self) -> float:
        """Update region and return total activity."""
        self.total_activity = 0

        for neuron in self.neurons:
            neuron.update()
            self.total_activity += neuron.activity

        if self.neurons:
            self.total_activity /= len(self.neurons)

        return self.total_activity

    def stimulate(self, strength: float = 1.0, count: int = 5):
        """Stimulate random neurons in this region."""
        shuffled = self.neurons.copy()
        random.shuffle(shuffled)

        for neuron in shuffled[:min(count, len(shuffled))]:
            neuron.stimulate(strength)


class Network:
    """Main network orchestrating all regions, hub, and connections."""

    # Default region configurations
    DEFAULT_REGIONS = {
        'frontal': {
            'name': 'Frontal',
            'color': '#00ffff',
            'position': (0.25, 0.25),
            'size': 0.18
        },
        'parietal': {
            'name': 'Parietal',
            'color': '#4488ff',
            'position': (0.65, 0.2),
            'size': 0.16
        },
        'temporal': {
            'name': 'Temporal',
            'color': '#00ff88',
            'position': (0.4, 0.65),
            'size': 0.15
        },
        'occipital': {
            'name': 'Occipital',
            'color': '#ff00ff',
            'position': (0.8, 0.45),
            'size': 0.14
        },
        'motor': {
            'name': 'Motor',
            'color': '#ffff00',
            'position': (0.2, 0.45),
            'size': 0.12
        },
        'sensory': {
            'name': 'Sensory',
            'color': '#ff8844',
            'position': (0.45, 0.4),
            'size': 0.14
        }
    }

    def __init__(self, bounds: Optional[Dict[str, float]] = None):
        # Default bounds if not provided
        self.bounds = bounds or {'x': 100, 'y': 50, 'width': 600, 'height': 500}

        self.regions: Dict[str, Region] = {}
        self.hub: Optional['CentralHub'] = None
        self.connections: List[Connection] = []
        self.all_neurons: List[Neuron] = []

        # Statistics
        self.total_signals = 0
        self.firing_rate = 0
        self.active_neurons = 0

        self._initialize()

    def _initialize(self):
        """Initialize the network."""
        # Create regions
        for id, config in self.DEFAULT_REGIONS.items():
            region = Region(
                id=id,
                name=config['name'],
                color=config['color'],
                relative_position=config['position'],
                relative_size=config['size']
            )
            region.generate_neurons(self.bounds)
            self.regions[id] = region

        # Collect all neurons
        for region in self.regions.values():
            self.all_neurons.extend(region.neurons)

        # Create connections
        self._create_connections()

    def _create_connections(self):
        """Create all network connections."""
        conn_id = 0

        # Intra-region connections
        for region in self.regions.values():
            neurons = region.neurons
            for i, n1 in enumerate(neurons):
                for j, n2 in enumerate(neurons):
                    if i != j and random.random() < 0.15:
                        conn = Connection(
                            id=f"conn_{conn_id}",
                            from_neuron=n1,
                            to_neuron=n2
                        )
                        self.connections.append(conn)
                        n1.outgoing.append(conn)
                        n2.incoming.append(conn)
                        conn_id += 1

        # Inter-region connections (sparse)
        region_ids = list(self.regions.keys())
        for i, id1 in enumerate(region_ids):
            for id2 in region_ids[i+1:]:
                r1 = self.regions[id1]
                r2 = self.regions[id2]
                for n1 in r1.neurons:
                    for n2 in r2.neurons:
                        if random.random() < 0.05:
                            conn = Connection(
                                id=f"conn_{conn_id}",
                                from_neuron=n1,
                                to_neuron=n2
                            )
                            self.connections.append(conn)
                            n1.outgoing.append(conn)
                            n2.incoming.append(conn)
                            conn_id += 1

    def update(self, speed_multiplier: float = 1.0):
        """Main update loop."""
        # Update connections and propagate signals
        for conn in self.connections:
            arrived = conn.update(speed_multiplier)
            for signal in arrived:
                conn.to_neuron.receive_input(signal.strength, conn.weight)

        # Update regions and fire neurons
        for region in self.regions.values():
            region.update()
            for neuron in region.neurons:
                if neuron.activity > 0.9:
                    for conn in neuron.outgoing:
                        conn.add_signal(neuron.activity)
                        self.total_signals += 1

        # Update statistics
        self.active_neurons = sum(1 for n in self.all_neurons if n.activity > 0.1)

    def stimulate_region(self, region_id: str, strength: float = 1.0):
        """Stimulate a specific region."""
        if region_id in self.regions:
            self.regions[region_id].stimulate(strength)

    def inject_input(self, data: List[float]):
        """Inject input into sensory region."""
        if 'sensory' in self.regions:
            sensory = self.regions['sensory']
            for i, value in enumerate(data[:10]):
                if i < len(sensory.neurons):
                    sensory.neurons[i].stimulate(value)

    def get_state(self) -> Dict:
        """Get current network state for transmission."""
        return {
            'regions': {
                id: {
                    'activity': region.total_activity,
                    'neuron_count': len(region.neurons)
                }
                for id, region in self.regions.items()
            },
            'stats': {
                'total_signals': self.total_signals,
                'active_neurons': self.active_neurons
            }
        }
