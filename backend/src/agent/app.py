# mypy: disable - error - code = "no-untyped-def,misc"
import pathlib
from contextlib import asynccontextmanager
from fastapi import FastAPI, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from agent.database import init_db
from agent.api_routes import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database on startup
    try:
        await init_db()
        print("Real database initialized successfully")
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        print("Switching to mock database for testing")
        # Use mock database as fallback
        import agent.mock_database as mock_database
        await mock_database.init_db()
        # Replace database functions with mock versions
        import agent.database as db_module
        db_module.init_db = mock_database.init_db
        db_module.authenticate_user = mock_database.authenticate_user
        db_module.get_user_by_username = mock_database.get_user_by_username
        db_module.get_user_by_email = mock_database.get_user_by_email
        db_module.get_user_by_id = mock_database.get_user_by_id
        db_module.create_user = mock_database.create_user
        db_module.create_access_token = mock_database.create_access_token
        db_module.save_conversation = mock_database.save_conversation
        db_module.get_user_conversations = mock_database.get_user_conversations
        db_module.get_conversation_by_id = mock_database.get_conversation_by_id
        db_module.update_conversation = mock_database.update_conversation
        db_module.search_conversations = mock_database.search_conversations
    yield
    # Cleanup on shutdown if needed

# Define the FastAPI app
app = FastAPI(
    title="LangGraph Research API",
    description="Advanced AI-powered research assistant with authentication and conversation management",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:2024"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

def create_frontend_router(build_dir="../frontend/dist"):
    """Creates a router to serve the React frontend.

    Args:
        build_dir: Path to the React build directory relative to this file.

    Returns:
        A Starlette application serving the frontend.
    """
    build_path = pathlib.Path(__file__).parent.parent.parent / build_dir

    if not build_path.is_dir() or not (build_path / "index.html").is_file():
        print(
            f"WARN: Frontend build directory not found or incomplete at {build_path}. Serving frontend will likely fail."
        )
        # Return a dummy router if build isn't ready
        from starlette.routing import Route

        async def dummy_frontend(request):
            return Response(
                "Frontend not built. Run 'npm run build' in the frontend directory.",
                media_type="text/plain",
                status_code=503,
            )

        return Route("/{path:path}", endpoint=dummy_frontend)

    return StaticFiles(directory=build_path, html=True)


# Mount the frontend under /app to not conflict with the LangGraph API routes
app.mount(
    "/app",
    create_frontend_router(),
    name="frontend",
)
