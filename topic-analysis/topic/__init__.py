# Core API and Business Logic Module
"""
This module contains the core functionality for the Topic Extraction API.

Main Components:
- api_new.py: FastAPI server with hierarchical topic extraction endpoints
- api_topic_extractor.py: Core API-based topic extraction logic using Groq
- groq_client.py: Groq API client wrapper
- preprocessor.py: Text preprocessing utilities
"""

__version__ = "4.0.0"
__all__ = ["api_new", "api_topic_extractor", "groq_client", "preprocessor", "config"]
