"""
Brain Network Simulation Module

This package contains the core simulation logic for the neural network.
Currently, simulation runs client-side for responsiveness.
This module can be used for:
- Server-side simulation (for headless processing)
- Learning algorithms
- Data persistence
- Advanced analysis
"""

from .network import Neuron, Connection, Region, Network
from .central_hub import CentralHub

__all__ = ['Neuron', 'Connection', 'Region', 'Network', 'CentralHub']
