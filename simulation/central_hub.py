"""
Central Hub - Aggregator and Controller for the network

The hub serves as:
1. Aggregator - Collects state from all regions
2. Router - Facilitates inter-region communication
3. Controller - Modulates regional activity based on global state
4. Readout - Provides output values for monitoring and learning
"""

import random
import math
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional

from .network import Neuron, Connection


class CentralHub:
    """Central hub connecting all regions."""

    def __init__(
        self,
        relative_position: Tuple[float, float] = (0.45, 0.45),
        relative_size: float = 0.08,
        neuron_count: int = 20,
        output_size: int = 4
    ):
        self.relative_position = relative_position
        self.relative_size = relative_size
        self.neuron_count = neuron_count
        self.output_size = output_size

        # Position (set by network)
        self.x: float = 0
        self.y: float = 0
        self.radius: float = 0

        # Neurons
        self.neurons: List[Neuron] = []

        # State readout
        self.state: List[float] = [0.0] * output_size

        # Connections to regions
        self.region_connections: Dict[str, List[Connection]] = {}

        # Modulation weights (learned over time)
        self.modulation_weights: Dict[str, float] = {}

    def initialize(self, bounds: Dict[str, float]):
        """Initialize hub position and neurons."""
        self.x = bounds['x'] + bounds['width'] * self.relative_position[0]
        self.y = bounds['y'] + bounds['height'] * self.relative_position[1]
        self.radius = min(bounds['width'], bounds['height']) * self.relative_size

        self._generate_neurons()

    def _generate_neurons(self):
        """Generate hub neurons in a circular pattern."""
        for i in range(self.neuron_count):
            angle = random.random() * math.pi * 2
            r = random.random() * self.radius * 0.8

            neuron = Neuron(
                id=f"hub_{i}",
                x=self.x + math.cos(angle) * r,
                y=self.y + math.sin(angle) * r,
                region_id='hub'
            )
            self.neurons.append(neuron)

    def connect_to_regions(self, regions: Dict, connection_prob: float = 0.3) -> List[Connection]:
        """Create bidirectional connections to all regions."""
        connections = []
        conn_id = 0

        for region_id, region in regions.items():
            self.region_connections[region_id] = []
            self.modulation_weights[region_id] = 1.0

            for neuron in region.neurons:
                # Region -> Hub
                if random.random() < connection_prob:
                    hub_neuron = random.choice(self.neurons)
                    conn = Connection(
                        id=f"hub_conn_{conn_id}",
                        from_neuron=neuron,
                        to_neuron=hub_neuron
                    )
                    connections.append(conn)
                    neuron.outgoing.append(conn)
                    hub_neuron.incoming.append(conn)
                    self.region_connections[region_id].append(conn)
                    conn_id += 1

                # Hub -> Region
                if random.random() < connection_prob:
                    hub_neuron = random.choice(self.neurons)
                    conn = Connection(
                        id=f"hub_conn_{conn_id}",
                        from_neuron=hub_neuron,
                        to_neuron=neuron
                    )
                    connections.append(conn)
                    hub_neuron.outgoing.append(conn)
                    neuron.incoming.append(conn)
                    conn_id += 1

        # Internal hub connections
        for i, n1 in enumerate(self.neurons):
            for j, n2 in enumerate(self.neurons):
                if i != j and random.random() < 0.3:
                    conn = Connection(
                        id=f"hub_internal_{conn_id}",
                        from_neuron=n1,
                        to_neuron=n2
                    )
                    connections.append(conn)
                    n1.outgoing.append(conn)
                    n2.incoming.append(conn)
                    conn_id += 1

        return connections

    def update(self):
        """Update hub neurons."""
        for neuron in self.neurons:
            neuron.update()

    def aggregate(self, regions: Dict) -> List[float]:
        """
        Aggregate state from all regions into readout values.

        The aggregation strategy can be customized for different learning tasks.
        Currently uses simple averaging across regions.
        """
        region_activities = []

        for region_id, region in regions.items():
            weight = self.modulation_weights.get(region_id, 1.0)
            region_activities.append(region.total_activity * weight)

        # Distribute activities into output state
        self.state = [0.0] * self.output_size

        for i, activity in enumerate(region_activities):
            self.state[i % self.output_size] += activity

        # Normalize
        max_val = max(self.state) if self.state else 1.0
        if max_val > 0:
            self.state = [min(1.0, v / max(max_val, 1.0)) for v in self.state]

        return self.state

    def modulate_regions(self, regions: Dict, target_activity: float = 0.5):
        """
        Modulate regional activity based on hub state.

        This is a simple homeostatic mechanism. More sophisticated
        control can be implemented for learning.
        """
        for region_id, region in regions.items():
            current = region.total_activity
            diff = target_activity - current

            # Adjust modulation weight slightly
            if region_id in self.modulation_weights:
                self.modulation_weights[region_id] += diff * 0.01
                self.modulation_weights[region_id] = max(
                    0.1,
                    min(2.0, self.modulation_weights[region_id])
                )

    def get_readout(self) -> List[float]:
        """Get current readout values."""
        return self.state.copy()

    def stimulate(self, strength: float = 1.0, count: int = 5):
        """Stimulate random hub neurons."""
        shuffled = self.neurons.copy()
        random.shuffle(shuffled)

        for neuron in shuffled[:min(count, len(shuffled))]:
            neuron.stimulate(strength)

    def reset(self):
        """Reset hub state."""
        self.state = [0.0] * self.output_size

        for neuron in self.neurons:
            neuron.activity = 0.0
            neuron.potential = 0.0
            neuron.refractory = 0
