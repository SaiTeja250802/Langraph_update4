"""Server entry point for the LangGraph Research API."""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))
from agent.app import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)