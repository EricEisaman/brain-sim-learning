"""
Learning Module - Placeholder for future learning algorithms

This module will contain various learning algorithms that can be
applied to the network:

1. Hebbian Learning - "Neurons that fire together wire together"
2. Reward-based Learning - Reinforce pathways leading to rewards
3. Predictive Learning - Learn to predict sequences
4. Associative Learning - Link patterns across regions

Currently a placeholder with basic interfaces.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple
from .network import Network, Connection


class LearningAlgorithm(ABC):
    """Base class for learning algorithms."""

    def __init__(self, network: Network, learning_rate: float = 0.01):
        self.network = network
        self.learning_rate = learning_rate
        self.enabled = False

    @abstractmethod
    def update(self):
        """Called each simulation tick to update weights."""
        pass

    @abstractmethod
    def apply_reward(self, reward: float):
        """Apply a reward signal to modulate learning."""
        pass

    def enable(self):
        """Enable learning."""
        self.enabled = True

    def disable(self):
        """Disable learning."""
        self.enabled = False


class HebbianLearning(LearningAlgorithm):
    """
    Hebbian Learning: Strengthen connections between neurons that fire together.

    ΔW = η * pre_activity * post_activity

    With optional weight decay to prevent runaway growth.
    """

    def __init__(
        self,
        network: Network,
        learning_rate: float = 0.01,
        decay_rate: float = 0.001,
        max_weight: float = 2.0,
        min_weight: float = 0.1
    ):
        super().__init__(network, learning_rate)
        self.decay_rate = decay_rate
        self.max_weight = max_weight
        self.min_weight = min_weight

    def update(self):
        """Update connection weights based on correlated activity."""
        if not self.enabled:
            return

        for conn in self.network.connections:
            pre = conn.from_neuron.activity
            post = conn.to_neuron.activity

            # Hebbian update
            delta = self.learning_rate * pre * post

            # Weight decay
            decay = self.decay_rate * (conn.weight - 1.0)

            # Update weight
            conn.weight += delta - decay

            # Clamp to bounds
            conn.weight = max(self.min_weight, min(self.max_weight, conn.weight))

    def apply_reward(self, reward: float):
        """Reward doesn't directly apply in pure Hebbian learning."""
        pass


class RewardBasedLearning(LearningAlgorithm):
    """
    Reward-based Learning: Strengthen pathways that led to reward.

    Maintains eligibility traces for recent activity, then modulates
    weight changes based on reward signal.
    """

    def __init__(
        self,
        network: Network,
        learning_rate: float = 0.01,
        trace_decay: float = 0.9,
        max_weight: float = 2.0,
        min_weight: float = 0.1
    ):
        super().__init__(network, learning_rate)
        self.trace_decay = trace_decay
        self.max_weight = max_weight
        self.min_weight = min_weight

        # Eligibility traces for each connection
        self.traces: Dict[str, float] = {}
        for conn in network.connections:
            self.traces[conn.id] = 0.0

    def update(self):
        """Update eligibility traces."""
        if not self.enabled:
            return

        for conn in self.network.connections:
            pre = conn.from_neuron.activity
            post = conn.to_neuron.activity

            # Update trace: decay + new activity
            current_trace = self.traces.get(conn.id, 0.0)
            self.traces[conn.id] = current_trace * self.trace_decay + pre * post

    def apply_reward(self, reward: float):
        """Apply reward to update weights based on eligibility traces."""
        if not self.enabled:
            return

        for conn in self.network.connections:
            trace = self.traces.get(conn.id, 0.0)

            # Weight update proportional to trace and reward
            delta = self.learning_rate * trace * reward

            conn.weight += delta
            conn.weight = max(self.min_weight, min(self.max_weight, conn.weight))

        # Optionally decay traces after reward
        for conn_id in self.traces:
            self.traces[conn_id] *= 0.5


class LearningManager:
    """
    Manages multiple learning algorithms and provides unified interface.
    """

    def __init__(self, network: Network):
        self.network = network
        self.algorithms: Dict[str, LearningAlgorithm] = {}
        self.active_algorithm: Optional[str] = None

    def add_algorithm(self, name: str, algorithm: LearningAlgorithm):
        """Add a learning algorithm."""
        self.algorithms[name] = algorithm

    def set_active(self, name: str):
        """Set the active learning algorithm."""
        if name in self.algorithms:
            # Disable previous
            if self.active_algorithm and self.active_algorithm in self.algorithms:
                self.algorithms[self.active_algorithm].disable()

            # Enable new
            self.active_algorithm = name
            self.algorithms[name].enable()

    def update(self):
        """Update active learning algorithm."""
        if self.active_algorithm and self.active_algorithm in self.algorithms:
            self.algorithms[self.active_algorithm].update()

    def apply_reward(self, reward: float):
        """Apply reward to active algorithm."""
        if self.active_algorithm and self.active_algorithm in self.algorithms:
            self.algorithms[self.active_algorithm].apply_reward(reward)

    def get_algorithm(self, name: str) -> Optional[LearningAlgorithm]:
        """Get a specific algorithm by name."""
        return self.algorithms.get(name)


# Factory function to create a pre-configured learning manager
def create_learning_manager(network: Network) -> LearningManager:
    """Create a learning manager with default algorithms."""
    manager = LearningManager(network)

    # Add default algorithms
    manager.add_algorithm('hebbian', HebbianLearning(network))
    manager.add_algorithm('reward', RewardBasedLearning(network))

    return manager
