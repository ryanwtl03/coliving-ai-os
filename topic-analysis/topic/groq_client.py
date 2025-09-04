import requests
import logging
from typing import List, Dict, Any, Optional
import json
from .config import GROQ_API_KEY, GROQ_MODEL, GROQ_BASE_URL

logger = logging.getLogger(__name__)

class GroqClient:
    """
    Client to interact with Groq Cloud API for enhanced text analysis
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
    
    def enhance_topic_analysis(self, text: str, detected_topics: List[Dict]) -> Dict[str, Any]:
        """
        Use Groq to enhance topic analysis with sentiment and context
        """
        try:
            topics_str = ", ".join([topic.get('label', topic.get('name', '')) for topic in detected_topics])
            
            prompt = f"""
            Analyze the following text and provide enhanced insights:
            
            Text: "{text}"
            Detected Topics: {topics_str}
            
            Please provide:
            1. Sentiment analysis (positive/negative/neutral with confidence)
            2. Key themes beyond the detected topics
            3. Emotional tone
            4. Urgency level (low/medium/high)
            5. Brief summary in 1-2 sentences
            
            Respond in JSON format with keys: sentiment, additional_themes, emotional_tone, urgency, summary
            """
            
            response = self.session.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 500
                }
            )
            
            response.raise_for_status()
            result = response.json()
            
            # Extract the content and try to parse as JSON
            content = result['choices'][0]['message']['content']
            try:
                enhanced_analysis = json.loads(content)
            except json.JSONDecodeError:
                # Fallback if response isn't valid JSON
                enhanced_analysis = {
                    "sentiment": "neutral",
                    "additional_themes": [],
                    "emotional_tone": "neutral",
                    "urgency": "low",
                    "summary": content[:200] + "..." if len(content) > 200 else content
                }
            
            return enhanced_analysis
            
        except Exception as e:
            logger.error(f"Groq enhancement failed: {e}")
            return {
                "sentiment": "unknown",
                "additional_themes": [],
                "emotional_tone": "unknown",
                "urgency": "unknown",
                "summary": "Enhancement unavailable",
                "error": str(e)
            }
    
    def generate_topic_insights(self, topic_distribution: List[Dict]) -> str:
        """
        Generate insights about topic distribution using Groq
        """
        try:
            topics_info = []
            for topic in topic_distribution:
                topics_info.append(f"- {topic.get('label', topic.get('name', ''))}: {topic.get('probability', 0):.2%}")
            
            topics_str = "\n".join(topics_info)
            
            prompt = f"""
            Based on this topic distribution analysis, provide insights:
            
            {topics_str}
            
            Please provide:
            1. The dominant theme
            2. Secondary themes
            3. Overall pattern interpretation
            4. Recommendations for content strategy
            
            Keep response concise and actionable.
            """
            
            response = self.session.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.5,
                    "max_tokens": 300
                }
            )
            
            response.raise_for_status()
            result = response.json()
            return result['choices'][0]['message']['content']
            
        except Exception as e:
            logger.error(f"Groq insights generation failed: {e}")
            return f"Insights unavailable: {str(e)}"
    
    def summarize_conversation(self, messages: List[str]) -> str:
        """
        Summarize a conversation using Groq
        """
        try:
            conversation = "\n".join([f"Message {i+1}: {msg}" for i, msg in enumerate(messages)])
            
            prompt = f"""
            Summarize this conversation and identify key topics discussed:
            
            {conversation}
            
            Provide:
            1. Brief summary (2-3 sentences)
            2. Main topics discussed
            3. Key decisions or outcomes
            4. Action items (if any)
            """
            
            response = self.session.post(
                f"{self.base_url}/chat/completions",
                json={
                    "model": self.model,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.4,
                    "max_tokens": 400
                }
            )
            
            response.raise_for_status()
            result = response.json()
            return result['choices'][0]['message']['content']
            
        except Exception as e:
            logger.error(f"Groq conversation summary failed: {e}")
            return f"Summary unavailable: {str(e)}"