"""Server entry point for the LangGraph Research API."""

from agent.app import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)