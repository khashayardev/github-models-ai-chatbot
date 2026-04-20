#!/usr/bin/env python3
"""
GitHub Models Handler for AI ChatBot
Direct API calls to GitHub Models
"""

import os
import sys
import json
import argparse
import logging
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class GitHubModelsClient:
    """Main client for interacting with GitHub Models API directly"""
    
    def __init__(self, token: Optional[str] = None):
        self.token = token or os.environ.get("GITHUB_TOKEN")
        if not self.token:
            raise ValueError("GitHub token is required. Set GITHUB_TOKEN environment variable.")
        
        self.endpoint = "https://models.inference.ai.azure.com/chat/completions"
        self.api_version = "2024-10-01-Preview"
        logger.info("GitHub Models client initialized")
    
    def chat_completion(
        self,
        user_message: str,
        model_id: str = "gpt-4o",
        conversation_history: Optional[List[Dict[str, str]]] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000
    ) -> Dict[str, Any]:
        """
        Send chat request to GitHub Models API
        """
        # Build messages
        messages = []
        
        # System prompt
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        else:
            messages.append({"role": "system", "content": "You are a helpful AI assistant. Respond in Persian/Farsi if the user speaks Persian, otherwise respond in English."})
        
        # Conversation history
        if conversation_history:
            for msg in conversation_history:
                messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
        
        # Current message
        messages.append({"role": "user", "content": user_message})
        
        # Prepare request
        payload = {
            "messages": messages,
            "model": model_id,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False
        }
        
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        try:
            start_time = datetime.now()
            
            response = requests.post(
                f"{self.endpoint}?api-version={self.api_version}",
                headers=headers,
                json=payload,
                timeout=60
            )
            
            end_time = datetime.now()
            processing_time = (end_time - start_time).total_seconds()
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                return {
                    "success": True,
                    "response": response_text,
                    "model": model_id,
                    "processing_time": processing_time,
                    "estimated_tokens": {
                        "total": len(response_text) // 4
                    },
                    "timestamp": datetime.now().isoformat()
                }
            else:
                error_msg = f"API Error {response.status_code}: {response.text[:200]}"
                logger.error(error_msg)
                return {
                    "success": False,
                    "error": error_msg,
                    "error_type": "api_error"
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Request timeout",
                "error_type": "timeout"
            }
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "error_type": "unknown"
            }

def main():
    parser = argparse.ArgumentParser(description="GitHub Models Handler")
    parser.add_argument("--message", "-m", type=str, required=True, help="User message")
    parser.add_argument("--model", "-md", type=str, default="gpt-4o", help="Model ID")
    parser.add_argument("--history", "-H", type=str, default="[]", help="Conversation history as JSON")
    parser.add_argument("--system-prompt", "-s", type=str, help="System prompt")
    parser.add_argument("--temperature", "-t", type=float, default=0.7, help="Temperature")
    parser.add_argument("--max-tokens", "-mt", type=int, default=1000, help="Max tokens")
    
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
        
        response = client.chat_completion(
            user_message=args.message,
            model_id=args.model,
            conversation_history=history,
            system_prompt=args.system_prompt,
            temperature=args.temperature,
            max_tokens=args.max_tokens
        )
        
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
