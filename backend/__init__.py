"""
GitHub Models AI ChatBot - Backend Package
"""

__version__ = "1.0.0"
__author__ = "AI ChatBot Team"

from .model_handler import GitHubModelsClient
from .config import GitHubModelsConfig

__all__ = [
    "GitHubModelsClient",
    "GitHubModelsConfig"
]
