from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
try:
    from api_topic_extractor import APITopicExtractor
except ImportError:
    # # If relative import fails, try absolute import
    # import sys
    # from pathlib import Path
    # sys.path.append(str(Path(__file__).parent.parent))
    from api_topic_extractor import APITopicExtractor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Rojak Analyzer API - Co-Living Edition (API-based)", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize API-based topic extractor
topic_extractor = APITopicExtractor()

# Test API connection on startup
try:
    connection_test = topic_extractor.test_api_connection()
    if connection_test["status"] == "success":
        logger.info("✅ Groq API connection successful")
    else:
        logger.warning(f"⚠️ Groq API connection issue: {connection_test['error']}")
except Exception as e:
    logger.error(f"❌ Failed to test API connection: {e}")

# Pydantic models for API requests
class TextAnalysisRequest(BaseModel):
    text: str
    general_threshold: Optional[float] = 0.1
    detailed_threshold: Optional[float] = 0.3
    include_hierarchical: Optional[bool] = True

class BatchAnalysisRequest(BaseModel):
    texts: List[str]
    general_threshold: Optional[float] = 0.1
    detailed_threshold: Optional[float] = 0.3
    include_hierarchical: Optional[bool] = True

class TrainingRequest(BaseModel):
    texts: List[str]

@app.get("/")
async def root():
    return {"message": "Rojak Analyzer API - Co-Living Edition (API-based)", "version": "4.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        api_test = topic_extractor.test_api_connection()
        return {
            "status": "healthy",
            "api_connected": api_test["status"] == "success",
            "model_used": topic_extractor.model,
            "api_based": True
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_text(request: TextAnalysisRequest) -> Dict[str, Any]:
    """Analyze a single text for hierarchical topics using API"""
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        if request.include_hierarchical:
            # Get full hierarchical analysis
            result = topic_extractor.analyze_text_hierarchical(
                request.text, 
                general_threshold=request.general_threshold,
                detailed_threshold=request.detailed_threshold
            )
        else:
            # Get only general topics
            general_topics = topic_extractor.extract_general_topics(
                request.text, 
                threshold=request.general_threshold
            )
            result = {
                "text": request.text,
                "general_topics": general_topics,
                "detailed_topics": [],
                "hierarchical_analysis": []
            }
        
        logger.info(f"Analyzed text: '{request.text[:50]}...' - Found {len(result.get('general_topics', []))} general topics")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Text analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-batch")
async def analyze_batch(request: BatchAnalysisRequest) -> List[Dict[str, Any]]:
    """Analyze multiple texts for hierarchical topics using API"""
    try:
        if not request.texts:
            raise HTTPException(status_code=400, detail="Texts list cannot be empty")
        
        results = topic_extractor.analyze_batch(
            request.texts,
            general_threshold=request.general_threshold,
            detailed_threshold=request.detailed_threshold
        )
        
        logger.info(f"Batch analyzed {len(request.texts)} texts")
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def train_model(request: TrainingRequest) -> Dict[str, Any]:
    """Training endpoint - not needed for API-based approach"""
    return {
        "status": "info",
        "message": "Training not required for API-based topic extraction",
        "note": "This system uses Groq API for real-time topic classification",
        "api_model": topic_extractor.model
    }

@app.get("/topics")
async def get_topics() -> Dict[str, Any]:
    """Get information about all available topics"""
    try:
        return topic_extractor.get_topic_summary()
    except Exception as e:
        logger.error(f"Failed to get topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/topics/general")
async def get_general_topics() -> Dict[str, Any]:
    """Get only general topic information"""
    try:
        try:
            from .config import GENERAL_TOPICS
        except ImportError:
            from .config import GENERAL_TOPICS
        return {
            "general_topics": GENERAL_TOPICS,
            "total_count": len(GENERAL_TOPICS)
        }
    except Exception as e:
        logger.error(f"Failed to get general topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/topics/detailed/{general_topic_id}")
async def get_detailed_topics(general_topic_id: int) -> Dict[str, Any]:
    """Get detailed topics for a specific general topic"""
    try:
        try:
            from .config import DETAILED_TOPICS, GENERAL_TOPICS
        except ImportError:
            from .config import DETAILED_TOPICS, GENERAL_TOPICS
        
        if general_topic_id not in DETAILED_TOPICS:
            raise HTTPException(status_code=404, detail=f"General topic {general_topic_id} not found")
        
        return {
            "general_topic_id": general_topic_id,
            "general_topic_name": GENERAL_TOPICS.get(general_topic_id, f"Topic {general_topic_id}"),
            "detailed_topics": DETAILED_TOPICS[general_topic_id],
            "total_detailed_count": len(DETAILED_TOPICS[general_topic_id])
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get detailed topics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test-api")
async def test_api_connection():
    """Test the Groq API connection"""
    try:
        result = topic_extractor.test_api_connection()
        return result
    except Exception as e:
        logger.error(f"API test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 API-based Co-Living Topic Analyzer ready")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("API shutting down")
