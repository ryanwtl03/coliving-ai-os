#!/usr/bin/env python3
"""
Quick Start Script for Organized Topic Extraction Module
"""

import sys
import os
from pathlib import Path

# # Add the current directory to Python path
# current_dir = Path(__file__).parent
# sys.path.insert(0, str(current_dir))

def start_api_server(port=8000, reload=True):
    """Start the FastAPI server"""
    try:
        import uvicorn
        from topic.api_new import app
        
        print(f"🚀 Starting Topic Extraction API on port {port}")
        print(f"📖 API Documentation: http://localhost:{port}/docs")
        print(f"❤️  Health Check: http://localhost:{port}/health")
        print("Press Ctrl+C to stop")
        
        result = uvicorn.run(
            "topic.api_new:app",
            host="0.0.0.0",
            port=port,
            reload=reload
        )

        print(f"\nReturn text:{result}\n")
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("Please install requirements: pip install -r requirements.txt")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")

def run_tests():
    """Run the test suite"""
    try:
        import subprocess
        print("🧪 Running test suite...")
        
        # Run main API tests
        result = subprocess.run([
            sys.executable, "-m", "pytest", "tests/", "-v"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ All tests passed!")
        else:
            print("❌ Some tests failed:")
            print(result.stdout)
            print(result.stderr)
            
    except ImportError:
        print("❌ pytest not installed. Running tests manually...")
        try:
            sys.path.append("tests")
            from functions.test_api_topic_extraction import main as test_main
            test_main()
        except Exception as e:
            print(f"❌ Test execution failed: {e}")

def show_help():
    """Show help information"""
    print("""
🎯 Topic Extraction Module - Quick Start
======================================

Usage: python start.py [command]

Commands:
  server          Start the API server (default)
  server --port 8001    Start on custom port
  test            Run the test suite
  help            Show this help message

Examples:
  python start.py                    # Start API server on port 8000
  python start.py server --port 8001 # Start on port 8001  
  python start.py test              # Run tests
  
API Endpoints:
  GET  /health                      # Health check
  POST /analyze                     # Analyze text for topics
  GET  /docs                        # API documentation
  
Module Structure:
  core/           # Main API and business logic
  config/         # Configuration and topics
  tests/          # Test suites
  examples/       # Client libraries and examples
  deployment/     # Docker and deployment
  
For detailed documentation, see README_ORGANIZED.md
""")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "server":
            port = 8000
            if "--port" in sys.argv:
                try:
                    port_idx = sys.argv.index("--port") + 1
                    port = int(sys.argv[port_idx])
                except (IndexError, ValueError):
                    print("❌ Invalid port number")
                    sys.exit(1)
            start_api_server(port)
            
        elif command == "test":
            run_tests()
            
        elif command == "help":
            show_help()
            
        else:
            print(f"❌ Unknown command: {command}")
            show_help()
            sys.exit(1)
    else:
        # Default: start server
        start_api_server()
