"""
Configuration module for GitHub Models integration
"""

import os
from dataclasses import dataclass
from typing import Dict, List, Optional

@dataclass
class ModelConfig:
    """Configuration for a specific AI model"""
    model_id: str
    display_name: str
    publisher: str
    max_tokens: int
    temperature: float
    supports_streaming: bool
    rate_limit_tier: str
    max_input_tokens: int
    max_output_tokens: int

class GitHubModelsConfig:
    """Central configuration for GitHub Models"""
    
    # API Endpoints
    INFERENCE_ENDPOINT = "https://models.inference.ai.azure.com"
    CATALOG_ENDPOINT = "https://models.github.ai/catalog/models"
    
    # Default model parameters
    DEFAULT_TEMPERATURE = 0.7
    DEFAULT_MAX_TOKENS = 1000
    DEFAULT_TOP_P = 0.95
    
    # Model configurations with rate limits
    MODELS: Dict[str, ModelConfig] = {
        "gpt-4o": ModelConfig(
            model_id="gpt-4o",
            display_name="GPT-4o",
            publisher="OpenAI",
            max_tokens=4096,
            temperature=0.7,
            supports_streaming=True,
            rate_limit_tier="high",
            max_input_tokens=128000,
            max_output_tokens=16384
        ),
        "gpt-4o-mini": ModelConfig(
            model_id="gpt-4o-mini",
            display_name="GPT-4o Mini",
            publisher="OpenAI",
            max_tokens=4096,
            temperature=0.7,
            supports_streaming=True,
            rate_limit_tier="high",
            max_input_tokens=128000,
            max_output_tokens=16384
        ),
        "deepseek-r1": ModelConfig(
            model_id="DeepSeek-R1",
            display_name="DeepSeek-R1",
            publisher="DeepSeek",
            max_tokens=8192,
            temperature=0.6,
            supports_streaming=True,
            rate_limit_tier="medium",
            max_input_tokens=65536,
            max_output_tokens=8192
        ),
        "llama-3.3-70b": ModelConfig(
            model_id="Llama-3.3-70b-Instruct",
            display_name="Llama 3.3 70B",
            publisher="Meta",
            max_tokens=4096,
            temperature=0.7,
            supports_streaming=True,
            rate_limit_tier="medium",
            max_input_tokens=131072,
            max_output_tokens=8192
        ),
        "phi-3.5-mini": ModelConfig(
            model_id="Phi-3.5-mini-instruct",
            display_name="Phi-3.5 Mini",
            publisher="Microsoft",
            max_tokens=2048,
            temperature=0.5,
            supports_streaming=True,
            rate_limit_tier="low",
            max_input_tokens=131072,
            max_output_tokens=4096
        ),
        "mistral-large": ModelConfig(
            model_id="Mistral-large-2407",
            display_name="Mistral Large",
            publisher="Mistral AI",
            max_tokens=4096,
            temperature=0.7,
            supports_streaming=True,
            rate_limit_tier="medium",
            max_input_tokens=131072,
            max_output_tokens=8192
        ),
        "cohere-command-r": ModelConfig(
            model_id="Cohere-command-r-plus",
            display_name="Cohere Command R+",
            publisher="Cohere",
            max_tokens=4096,
            temperature=0.3,
            supports_streaming=True,
            rate_limit_tier="medium",
            max_input_tokens=128000,
            max_output_tokens=4096
        ),
        "ai21-jamba": ModelConfig(
            model_id="AI21-Jamba-1.5-Large",
            display_name="AI21 Jamba 1.5",
            publisher="AI21",
            max_tokens=4096,
            temperature=0.7,
            supports_streaming=True,
            rate_limit_tier="medium",
            max_input_tokens=262144,
            max_output_tokens=4096
        )
    }
    
    # Rate limits for different tiers (requests per minute)
    RATE_LIMITS = {
        "low": 10,
        "medium": 30,
        "high": 60
    }
    
    @classmethod
    def get_model_config(cls, model_id: str) -> Optional[ModelConfig]:
        """Get configuration for a specific model"""
        return cls.MODELS.get(model_id)
    
    @classmethod
    def get_all_models(cls) -> List[Dict]:
        """Get list of all available models"""
        return [
            {
                "id": model_id,
                "name": config.display_name,
                "publisher": config.publisher,
                "max_tokens": config.max_tokens,
                "rate_limit_tier": config.rate_limit_tier
            }
            for model_id, config in cls.MODELS.items()
        ]
    
    @classmethod
    def get_rate_limit(cls, tier: str) -> int:
        """Get rate limit for a specific tier"""
        return cls.RATE_LIMITS.get(tier, 10)
