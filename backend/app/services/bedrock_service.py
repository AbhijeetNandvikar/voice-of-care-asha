"""
AWS Bedrock Service for Voice of Care
Handles AI-powered report generation using Claude 3.5 Sonnet
"""

import boto3
import json
from botocore.exceptions import ClientError, BotoCoreError
from typing import Dict, List, Any, Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class BedrockService:
    """Service for AWS Bedrock operations with Claude"""
    
    def __init__(self):
        """Initialize Bedrock Runtime client with credentials from settings"""
        # Use inference profile from settings (supports cross-region on-demand throughput)
        self.model_id = settings.AWS_BEDROCK_MODEL_ID
        
        try:
            # Build client config - use IAM role if credentials not provided
            client_config = {
                'service_name': 'bedrock-runtime',
                'region_name': settings.AWS_REGION
            }
            
            # Only add credentials if explicitly provided (otherwise use IAM role)
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                client_config['aws_access_key_id'] = settings.AWS_ACCESS_KEY_ID
                client_config['aws_secret_access_key'] = settings.AWS_SECRET_ACCESS_KEY
                logger.info("Using explicit AWS credentials for Bedrock")
            else:
                logger.info("Using IAM role for Bedrock authentication")
            
            self.bedrock_client = boto3.client(**client_config)
            
            logger.info(
                f"Bedrock client initialized for region {settings.AWS_REGION} "
                f"with model {self.model_id}"
            )
        except Exception as e:
            logger.error(f"Failed to initialize Bedrock client: {str(e)}")
            raise
    
    def invoke_claude(
        self,
        prompt: str,
        max_tokens: int = 4096,
        temperature: float = 0.0,
        timeout: int = 60
    ) -> Dict[str, Any]:
        """
        Invoke Claude model via AWS Bedrock
        
        Args:
            prompt: The prompt to send to Claude
            max_tokens: Maximum tokens in the response (default: 4096)
            temperature: Sampling temperature 0.0-1.0 (default: 0.0 for deterministic)
            timeout: Request timeout in seconds (default: 60)
            
        Returns:
            Dictionary containing Claude's response with 'content' key
            
        Raises:
            ClientError: If Bedrock API call fails
            ValueError: If response cannot be parsed
            TimeoutError: If request exceeds timeout
        """
        try:
            # Prepare request body for Claude
            request_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "temperature": temperature,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            }
            
            logger.info(
                f"Invoking Claude model {self.model_id} "
                f"(max_tokens={max_tokens}, temperature={temperature})"
            )
            
            # Invoke the model
            response = self.bedrock_client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(request_body),
                contentType='application/json',
                accept='application/json'
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            
            # Extract content from Claude's response
            if 'content' not in response_body or not response_body['content']:
                raise ValueError("Invalid response from Claude: missing 'content' field")
            
            # Claude returns content as an array of content blocks
            content_blocks = response_body['content']
            if not content_blocks or 'text' not in content_blocks[0]:
                raise ValueError("Invalid response from Claude: missing text in content")
            
            response_text = content_blocks[0]['text']
            
            logger.info(
                f"Successfully received response from Claude "
                f"(tokens: {response_body.get('usage', {}).get('output_tokens', 'unknown')})"
            )
            
            return {
                'content': response_text,
                'usage': response_body.get('usage', {}),
                'stop_reason': response_body.get('stop_reason', 'unknown')
            }
            
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))
            
            # Handle specific error cases
            if error_code == 'ThrottlingException':
                logger.error(f"Bedrock rate limit exceeded: {error_message}")
                raise Exception(
                    "Report generation service is temporarily busy. "
                    "Please try again in a few minutes."
                )
            elif error_code == 'ValidationException':
                logger.error(f"Invalid request to Bedrock: {error_message}")
                raise ValueError(f"Invalid request: {error_message}")
            elif error_code == 'ModelTimeoutException':
                logger.error(f"Bedrock model timeout: {error_message}")
                raise TimeoutError("Report generation timed out. Please try again.")
            else:
                logger.error(
                    f"Bedrock API error: {error_code} - {error_message}"
                )
                raise Exception(f"Failed to generate report: {error_message}")
                
        except BotoCoreError as e:
            logger.error(f"BotoCore error during Bedrock invocation: {str(e)}")
            raise Exception(f"AWS service error: {str(e)}")
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Bedrock response: {str(e)}")
            raise ValueError(f"Invalid JSON response from Claude: {str(e)}")
            
        except Exception as e:
            logger.error(f"Unexpected error during Bedrock invocation: {str(e)}")
            raise
    
    def format_hbnc_report_prompt(self, visits_data: List[Dict[str, Any]]) -> str:
        """
        Format visit data into a structured prompt for Claude to generate HBNC report
        
        Args:
            visits_data: List of visit dictionaries with beneficiary, worker, and answer data
            
        Returns:
            Formatted prompt string for Claude
            
        Example visit_data structure:
            {
                "beneficiary_name": "John Doe",
                "mcts_id": "MCTS123456",
                "asha_name": "Jane Smith",
                "visit_date": "2026-03-01",
                "day_number": 3,
                "answers": [
                    {
                        "question_id": "hbnc_q1",
                        "question_text": "Is the baby breathing normally?",
                        "answer": "yes",
                        "transcript": "yes the baby is breathing fine"
                    }
                ]
            }
        """
        # Convert visits data to formatted JSON string
        visits_json = json.dumps(visits_data, indent=2, ensure_ascii=False)
        
        prompt = f"""You are a healthcare data analyst tasked with generating a structured HBNC (Home-Based Newborn Care) visit report in the format of an official government register.

Given the following HBNC visit data, generate a structured summary that can be used to populate an Excel report.

Visit Data:
{visits_json}

Generate a JSON response with the following structure:
{{
  "report_title": "HBNC Visit Report",
  "period": "<start_date> to <end_date>",
  "total_visits": <count>,
  "visits": [
    {{
      "serial_no": <number>,
      "beneficiary_name": "<string>",
      "mcts_id": "<string>",
      "asha_worker": "<string>",
      "visit_date": "<string>",
      "day_number": <number>,
      "breathing_normal": "<yes/no/unknown>",
      "feeding_well": "<yes/no/unknown>",
      "temperature_normal": "<yes/no/unknown>",
      "umbilical_cord_normal": "<yes/no/unknown>",
      "jaundice_present": "<yes/no/unknown>",
      "weight_kg": "<number or unknown>",
      "remarks": "<string with any important observations or transcribed voice notes>"
    }}
  ]
}}

Instructions:
1. Extract information from the answers array for each visit
2. Map question answers to the appropriate columns (breathing, feeding, temperature, etc.)
3. For voice answers, include the transcript in the remarks field
4. Use "unknown" if a particular field is not available in the data
5. Generate serial numbers sequentially starting from 1
6. Calculate the period from the earliest and latest visit dates
7. Ensure all data is accurate and matches the source data
8. Return ONLY the JSON response, no additional text or explanation

Generate the report now:"""

        return prompt
    
    def parse_claude_json_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse Claude's JSON response, handling potential markdown code blocks
        
        Args:
            response_text: Raw text response from Claude
            
        Returns:
            Parsed JSON dictionary
            
        Raises:
            ValueError: If response cannot be parsed as JSON
        """
        logger.debug(f"Parsing Claude response (first 500 chars): {response_text[:500]}")
        
        try:
            # Try direct JSON parsing first
            parsed = json.loads(response_text)
            logger.info(f"Successfully parsed JSON directly, type: {type(parsed)}")
            return parsed
        except json.JSONDecodeError:
            # Claude might wrap JSON in markdown code blocks
            # Try to extract JSON from ```json ... ``` blocks
            import re
            
            logger.debug("Direct JSON parsing failed, trying to extract from markdown")
            
            # Look for JSON code block
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                try:
                    parsed = json.loads(json_str)
                    logger.info(f"Successfully parsed JSON from code block, type: {type(parsed)}")
                    return parsed
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON from code block: {str(e)}")
                    raise ValueError(f"Invalid JSON in code block: {str(e)}")
            
            # Try to find JSON object directly in text
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
                try:
                    parsed = json.loads(json_str)
                    logger.info(f"Successfully parsed JSON from text, type: {type(parsed)}")
                    return parsed
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse JSON from text: {str(e)}")
                    raise ValueError(f"Invalid JSON in response: {str(e)}")
            
            # If all parsing attempts fail
            logger.error(f"Could not find valid JSON in Claude response: {response_text[:200]}...")
            raise ValueError("Claude response does not contain valid JSON")


# Global Bedrock service instance
bedrock_service = BedrockService()
