"""
Utility functions for backend operations
"""

import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

# Setup logger
logger = logging.getLogger(__name__)

def safe_json_parse(json_string: str, default_value: Any = None) -> Any:
    """
    Safely parse JSON string
    
    Args:
        json_string: JSON string to parse
        default_value: Default value if parsing fails
    
    Returns:
        Parsed JSON or default value
    """
    try:
        return json.loads(json_string)
    except (json.JSONDecodeError, TypeError) as e:
        logger.warning(f"Failed to parse JSON: {e}")
        return default_value

def format_response_for_output(response: Dict[str, Any]) -> str:
    """
    Format response for workflow output
    
    Args:
        response: Response dictionary from model
    
    Returns:
        JSON string for output
    """
    return json.dumps(response, ensure_ascii=False)

def validate_message(message: str, max_length: int = 4000) -> bool:
    """
    Validate user message
    
    Args:
        message: User message to validate
        max_length: Maximum allowed length
    
    Returns:
        True if valid, False otherwise
    """
    if not message or not isinstance(message, str):
        return False
    if len(message.strip()) == 0:
        return False
    if len(message) > max_length:
        return False
    return True

def truncate_conversation_history(history: list, max_messages: int = 20) -> list:
    """
    Truncate conversation history to prevent token overflow
    
    Args:
        history: List of conversation messages
        max_messages: Maximum messages to keep
    
    Returns:
        Truncated history
    """
    if len(history) <= max_messages:
        return history
    # Keep first system message (if any) and last messages
    return history[-max_messages:]

def estimate_token_count(text: str) -> int:
    """
    Rough estimation of token count (4 chars ~ 1 token)
    
    Args:
        text: Input text
    
    Returns:
        Estimated token count
    """
    if not text:
        return 0
    return len(text) // 4

def create_error_response(error_message: str, error_type: str = "unknown") -> Dict[str, Any]:
    """
    Create standardized error response
    
    Args:
        error_message: Error description
        error_type: Type of error
    
    Returns:
        Error response dictionary
    """
    return {
        "success": False,
        "error": error_message,
        "error_type": error_type,
        "timestamp": datetime.now().isoformat()
    }

def create_success_response(response_text: str, model: str, processing_time: float, token_count: int = 0) -> Dict[str, Any]:
    """
    Create standardized success response
    
    Args:
        response_text: Model response
        model: Model name
        processing_time: Time taken to process
        token_count: Estimated token usage
    
    Returns:
        Success response dictionary
    """
    return {
        "success": True,
        "response": response_text,
        "model": model,
        "processing_time": processing_time,
        "estimated_tokens": {
            "total": token_count
        },
        "timestamp": datetime.now().isoformat()
    }
