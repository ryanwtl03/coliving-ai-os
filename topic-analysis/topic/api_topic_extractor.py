#!/usr/bin/env python3
"""
API-based Hierarchical Topic Extractor for Co-Living Domain
Uses Groq API instead of training local ML models
"""

import json
import logging
from typing import List, Dict, Any, Optional
import requests

try:
    from config import GROQ_API_KEY, GROQ_MODEL, GROQ_BASE_URL, GENERAL_TOPICS, DETAILED_TOPICS
except ImportError:
    # If relative import fails, try absolute import
    # import sys
    # from pathlib import Path
    # sys.path.append(str(Path(__file__).parent.parent))
    from config import GROQ_API_KEY, GROQ_MODEL, GROQ_BASE_URL, GENERAL_TOPICS, DETAILED_TOPICS

logger = logging.getLogger(__name__)

class APITopicExtractor:
    """
    API-based topic extraction using Groq for Co-Living domain
    Provides hierarchical topic classification without local ML training
    """
    
    def __init__(self, api_key: str = GROQ_API_KEY, model: str = GROQ_MODEL):
        self.api_key = api_key
        self.model = model
        self.base_url = GROQ_BASE_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        })
        
        # Build prompts from config
        self.general_topics_list = self._build_general_topics_prompt()
        self.detailed_topics_map = self._build_detailed_topics_prompts()
    
    def _build_general_topics_prompt(self) -> str:
        """Build the general topics list for the prompt"""
        topics = []
        for topic_id, topic_name in GENERAL_TOPICS.items():
            topics.append(f"{topic_id}: {topic_name}")
        return "\n".join(topics)
    
    def _build_detailed_topics_prompts(self) -> Dict[int, str]:
        """Build detailed topics prompts for each general topic"""
        prompts = {}
        for general_id, detailed_dict in DETAILED_TOPICS.items():
            detailed_list = []
            for detail_key, detail_name in detailed_dict.items():
                detailed_list.append(f"{detail_key}: {detail_name}")
            prompts[general_id] = "\n".join(detailed_list)
        return prompts
    
    def extract_general_topics(self, text: str, threshold: float = 0.1) -> List[Dict[str, Any]]:
        """
        Extract general topics using Groq API
        """
        try:
            prompt = f"""
            You are a Co-Living domain expert. Analyze the following text and classify it into the most relevant general topic categories.

            Text to analyze: "{text}"

            Available general topics:
            {self.general_topics_list}

            Instructions:
            1. Identify which general topics are relevant to the text
            2. Assign a probability score (0.0 to 1.0) for each relevant topic
            3. Only include topics with probability >= {threshold}
            4. Respond in JSON format as an array of objects

            Expected JSON format:
            [
                {{
                    "id": 0,
                    "name": "Room & Space Issues",
                    "probability": 0.85,
                    "type": "general",
                    "reasoning": "Brief explanation of why this topic applies"
                }}
            ]

            Respond with only the JSON array, no additional text.
            """
            
            response = self.session.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,  # Low temperature for consistent classification
                    "max_tokens": 1000
                }
            )
            
            response.raise_for_status()
            result = response.json()
            content = result['choices'][0]['message']['content'].strip()
            
            # Clean the response and parse JSON
            if content.startswith('```json'):
                content = content[7:-3]
            elif content.startswith('```'):
                content = content[3:-3]
            
            try:
                topics = json.loads(content)
                # Validate and filter results
                valid_topics = []
                for topic in topics:
                    if (isinstance(topic, dict) and 
                        'id' in topic and 
                        'probability' in topic and
                        topic['probability'] >= threshold):
                        valid_topics.append(topic)
                
                return valid_topics
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}. Content: {content}")
                return []
                
        except Exception as e:
            logger.error(f"General topic extraction failed: {e}")
            return []
    
    def extract_detailed_topics(self, text: str, general_topic_id: int, threshold: float = 0.3) -> List[Dict[str, Any]]:
        """
        Extract detailed sub-topics for a specific general topic using Groq API
        """
        if general_topic_id not in DETAILED_TOPICS:
            return []
        
        try:
            general_topic_name = GENERAL_TOPICS[general_topic_id]
            detailed_topics_prompt = self.detailed_topics_map[general_topic_id]
            
            prompt = f"""
            You are a Co-Living domain expert. The text has been classified under the general topic "{general_topic_name}".
            Now identify specific detailed sub-topics within this category.

            Text to analyze: "{text}"
            General topic: {general_topic_name}

            Available detailed topics for this category:
            {detailed_topics_prompt}

            Instructions:
            1. Identify which detailed sub-topics are relevant to the text
            2. Assign a relevance score (0.0 to 1.0) for each relevant sub-topic
            3. Only include sub-topics with score >= {threshold}
            4. Respond in JSON format as an array of objects

            Expected JSON format:
            [
                {{
                    "id": "cleanliness",
                    "name": "Cleanliness",
                    "probability": 0.75,
                    "type": "detailed",
                    "parent_topic_id": {general_topic_id},
                    "parent_topic_name": "{general_topic_name}",
                    "reasoning": "Brief explanation of why this sub-topic applies"
                }}
            ]

            Respond with only the JSON array, no additional text.
            """
            
            response = self.session.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 800
                }
            )
            
            response.raise_for_status()
            result = response.json()
            content = result['choices'][0]['message']['content'].strip()
            
            # Clean and parse JSON
            if content.startswith('```json'):
                content = content[7:-3]
            elif content.startswith('```'):
                content = content[3:-3]
            
            try:
                detailed_topics = json.loads(content)
                # Validate results
                valid_detailed = []
                for topic in detailed_topics:
                    if (isinstance(topic, dict) and 
                        'id' in topic and 
                        'probability' in topic and
                        topic['probability'] >= threshold):
                        valid_detailed.append(topic)
                
                return valid_detailed
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse detailed topics JSON: {e}. Content: {content}")
                return []
                
        except Exception as e:
            logger.error(f"Detailed topic extraction failed: {e}")
            return []
    
    def analyze_text_hierarchical(self, text: str, general_threshold: float = 0.1, 
                                detailed_threshold: float = 0.3) -> Dict[str, Any]:
        """
        Perform complete hierarchical topic analysis using API
        """
        result = {
            "text": text,
            "general_topics": [],
            "detailed_topics": [],
            "hierarchical_analysis": []
        }
        
        # Step 1: Get general topics
        general_topics = self.extract_general_topics(text, general_threshold)
        result["general_topics"] = general_topics
        
        # Step 2: For each general topic, get detailed sub-topics
        for general_topic in general_topics:
            general_id = general_topic["id"]
            detailed_topics = self.extract_detailed_topics(text, general_id, detailed_threshold)
            
            # Add to detailed topics list
            result["detailed_topics"].extend(detailed_topics)
            
            # Create hierarchical structure
            if detailed_topics:
                hierarchical_entry = {
                    "general_topic": general_topic,
                    "detailed_topics": detailed_topics,
                    "total_detailed_found": len(detailed_topics)
                }
                result["hierarchical_analysis"].append(hierarchical_entry)
        
        return result
    
    def analyze_batch(self, texts: List[str], general_threshold: float = 0.1, 
                     detailed_threshold: float = 0.3) -> List[Dict[str, Any]]:
        """
        Analyze multiple texts
        """
        results = []
        for i, text in enumerate(texts):
            if text.strip():
                analysis = self.analyze_text_hierarchical(text, general_threshold, detailed_threshold)
                analysis["index"] = i
                results.append(analysis)
            else:
                results.append({
                    "index": i,
                    "text": text,
                    "general_topics": [],
                    "detailed_topics": [],
                    "hierarchical_analysis": [],
                    "error": "Empty text"
                })
        return results
    
    def get_topic_summary(self) -> Dict[str, Any]:
        """Get summary of available topics"""
        return {
            "general_topics": GENERAL_TOPICS,
            "detailed_topics": DETAILED_TOPICS,
            "total_general_topics": len(GENERAL_TOPICS),
            "total_detailed_topics": sum(len(details) for details in DETAILED_TOPICS.values()),
            "api_based": True,
            "model_used": self.model
        }
    
    def test_api_connection(self) -> Dict[str, Any]:
        """Test if the API connection is working"""
        try:
            response = self.session.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "user", "content": "Hello, this is a test. Please respond with 'API connection successful'."}
                    ],
                    "temperature": 0.1,
                    "max_tokens": 50
                }
            )
            
            response.raise_for_status()
            result = response.json()
            return {
                "status": "success",
                "response": result['choices'][0]['message']['content'],
                "model": self.model
            }
            
        except Exception as e:
            return {
                "status": "failed",
                "error": str(e),
                "model": self.model
            }
