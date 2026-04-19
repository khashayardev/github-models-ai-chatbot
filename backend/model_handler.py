#!/usr/bin/env python3
"""
GitHub Models Handler for AI ChatBot
Handles communication with GitHub Models API using Azure Inference SDK
"""

import os
import sys
import json
import argparse
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from cachetools import TTLCache, cached

# Azure SDK imports
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import (
    SystemMessage, 
    UserMessage, 
    AssistantMessage,
    CompletionsFinishReason,
    StreamingChatCompletionsUpdate
)
from azure.core.credentials import AzureKeyCredential
from azure.core.exceptions import HttpResponseError, ClientAuthenticationError

# Import configuration
from config import GitHubModelsConfig

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Cache for rate limiting (1 minute TTL)
rate_limit_cache = TTLCache(maxsize=100, ttl=60)

class GitHubModelsClient:
    """Main client for interacting with GitHub Models"""
    
    def __init__(self, token: Optional[str] = None):
        """
        Initialize the GitHub Models client
        
        Args:
            token: GitHub Personal Access Token (defaults to GITHUB_TOKEN env var)
        """
        self.token = token or os.environ.get("GITHUB_TOKEN")
        if not self.token:
            raise ValueError("GitHub token is required. Set GITHUB_TOKEN environment variable.")
        
        self.endpoint = GitHubModelsConfig.INFERENCE_ENDPOINT
        self.client = None
        self._init_client()
    
    def _init_client(self):
        """Initialize the Azure Inference client"""
        try:
            credential = AzureKeyCredential(self.token)
            self.client = ChatCompletionsClient(
                endpoint=self.endpoint,
                credential=credential,
                logging_enable=True  # Enable for debugging
            )
            logger.info("Successfully initialized GitHub Models client")
        except Exception as e:
            logger.error(f"Failed to initialize client: {str(e)}")
            raise
    
    @cached(rate_limit_cache)
    def get_available_models(self) -> List[Dict[str, Any]]:
        """
        Get list of available models from GitHub Models catalog
        Uses caching to reduce API calls
        """
        try:
            # This would use the catalog API in production
            # For now, return configured models
            return GitHubModelsConfig.get_all_models()
        except Exception as e:
            logger.error(f"Failed to fetch models: {str(e)}")
            return GitHubModelsConfig.get_all_models()
    
    def prepare_messages(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        system_prompt: Optional[str] = None
    ) -> List:
        """
        Prepare messages for the chat completion
        
        Args:
            user_message: Current user message
            conversation_history: Previous conversation history
            system_prompt: Custom system prompt (optional)
        
        Returns:
            List of message objects for the API
        """
        messages = []
        
        # Add system prompt if provided
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        else:
            # Default system prompt
            default_system_prompt = """You are a helpful, harmless, and honest AI assistant.
            - Respond in the same language as the user (Persian/Farsi or English)
            - Be concise but informative
            - If you don't know something, say so honestly
            - Be respectful and professional
            - For coding questions, provide clean, well-commented examples
            - For Persian/Farsi responses, use proper Persian script and grammar"""
            messages.append(SystemMessage(content=default_system_prompt))
        
        # Add conversation history if available
        if conversation_history:
            for msg in conversation_history:
                role = msg.get("role", "")
                content = msg.get("content", "")
                
                if role == "user":
                    messages.append(UserMessage(content=content))
                elif role == "assistant":
                    messages.append(AssistantMessage(content=content))
        
        # Add current user message
        messages.append(UserMessage(content=user_message))
        
        return messages
    
    def generate_response(
        self,
        messages: List,
        model_id: str = "gpt-4o",
        temperature: float = None,
        max_tokens: int = None,
        stream: bool = True
    ) -> Dict[str, Any]:
        """
        Generate response from the selected model
        
        Args:
            messages: Prepared message list
            model_id: Model identifier
            temperature: Sampling temperature (0-1)
            max_tokens: Maximum tokens in response
            stream: Whether to stream the response
        
        Returns:
            Dictionary containing response and metadata
        """
        # Get model configuration
        model_config = GitHubModelsConfig.get_model_config(model_id)
        if not model_config:
            logger.warning(f"Model {model_id} not found, using gpt-4o")
            model_config = GitHubModelsConfig.get_model_config("gpt-4o")
        
        # Set parameters with defaults from config
        temperature = temperature or model_config.temperature
        max_tokens = max_tokens or model_config.max_tokens
        
        try:
            start_time = datetime.now()
            
            if stream:
                # Streaming response
                response_stream = self.client.complete(
                    messages=messages,
                    model=model_config.model_id,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=True
                )
                
                # Collect streaming chunks
                full_response = ""
                for chunk in response_stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        content_chunk = chunk.choices[0].delta.content
                        full_response += content_chunk
                        # Could yield chunks for real-time updates
                
                response_text = full_response
            else:
                # Non-streaming response
                response = self.client.complete(
                    messages=messages,
                    model=model_config.model_id,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    stream=False
                )
                
                response_text = response.choices[0].message.content
            
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            
            # Calculate token usage (approximate)
            # Note: Actual token count would come from API response
            estimated_input_tokens = sum(len(msg.content) / 4 for msg in messages)
            estimated_output_tokens = len(response_text) / 4
            
            return {
                "success": True,
                "response": response_text,
                "model": model_config.display_name,
                "model_id": model_id,
                "processing_time": processing_time,
                "estimated_tokens": {
                    "input": int(estimated_input_tokens),
                    "output": int(estimated_output_tokens),
                    "total": int(estimated_input_tokens + estimated_output_tokens)
                },
                "timestamp": datetime.now().isoformat()
            }
            
        except ClientAuthenticationError as e:
            logger.error(f"Authentication failed: {str(e)}")
            return {
                "success": False,
                "error": "Invalid GitHub token. Please check your token permissions.",
                "error_type": "authentication"
            }
        except HttpResponseError as e:
            logger.error(f"HTTP error occurred: {str(e)}")
            return {
                "success": False,
                "error": f"API error: {str(e)}",
                "error_type": "api_error"
            }
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "error_type": "unknown"
            }
        finally:
            if self.client:
                self.client.close()
    
    def chat_completion(
        self,
        user_message: str,
        model_id: str = "gpt-4o",
        conversation_history: Optional[List[Dict[str, str]]] = None,
        system_prompt: Optional[str] = None,
        temperature: float = None,
        max_tokens: int = None
    ) -> Dict[str, Any]:
        """
        Complete chat flow: prepare messages and generate response
        
        Args:
            user_message: User's message
            model_id: Model to use
            conversation_history: Previous conversation
            system_prompt: Custom system prompt
            temperature: Temperature parameter
            max_tokens: Max tokens for response
        
        Returns:
            Complete response dictionary
        """
        # Prepare messages
        messages = self.prepare_messages(
            user_message=user_message,
            conversation_history=conversation_history,
            system_prompt=system_prompt
        )
        
        # Generate response
        response = self.generate_response(
            messages=messages,
            model_id=model_id,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        )
        
        return response

def main():
    """Main entry point for command line usage"""
    parser = argparse.ArgumentParser(description="GitHub Models Handler")
    parser.add_argument("--message", "-m", type=str, required=True, help="User message")
    parser.add_argument("--model", "-md", type=str, default="gpt-4o", help="Model ID")
    parser.add_argument("--history", "-H", type=str, default="[]", help="Conversation history as JSON")
    parser.add_argument("--system-prompt", "-s", type=str, help="System prompt")
    parser.add_argument("--temperature", "-t", type=float, help="Temperature (0-1)")
    parser.add_argument("--max-tokens", "-mt", type=int, help="Max tokens")
    
    args = parser.parse_args()
    
    # Parse conversation history
    try:
        history = json.loads(args.history) if args.history != "[]" else []
    except json.JSONDecodeError:
        history = []
        logger.warning("Failed to parse history, using empty list")
    
    # Initialize client
    try:
        client = GitHubModelsClient()
        
        # Generate response
        response = client.chat_completion(
            user_message=args.message,
            model_id=args.model,
            conversation_history=history,
            system_prompt=args.system_prompt,
            temperature=args.temperature,
            max_tokens=args.max_tokens
        )
        
        # Output response as JSON
        print(json.dumps(response, ensure_ascii=False))
        
    except Exception as e:
        error_response = {
            "success": False,
            "error": str(e),
            "error_type": "initialization_error"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
