import os
import sys

# Ensure backend directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from dotenv import load_dotenv

from backend.database import init_db
from backend.transactions.router import router as transactions_router
from backend.reports.router import router as reports_router

try:
    from finwise_agent.agent import run_agent
except ImportError:
    # If strands or ollama cannot be imported, fallback gracefully
    def run_agent(user_message: str, profile: dict = None, goal: dict = None) -> str:
        return "Agent is running in offline mode. Please configure Ollama or your LLM credentials."

load_dotenv()

app = FastAPI(
    title="FINWISE AI Financial Engine API",
    description="Backend API exposing Strands Agent, Financial Calculations, Transaction Tracking & Historical Reports",
    version="2.0.0",
)

# Enable CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include modules routers
app.include_router(transactions_router)
app.include_router(reports_router)


@app.on_event("startup")
def on_startup():
    init_db()


class ChatRequest(BaseModel):
    message: str
    profile: Optional[Dict[str, Any]] = None
    goal: Optional[Dict[str, Any]] = None


@app.get("/health")
def health_check():
    has_key = bool(os.environ.get("OPENAI_API_KEY"))
    return {
        "status": "ok",
        "agent_ready": True,
        "message": "FINWISE Backend API is running with Transaction Tracking & Reporting modules active",
    }


@app.post("/api/chat")
def chat_endpoint(req: ChatRequest):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        response_text = run_agent(
            user_message=req.message,
            profile=req.profile,
            goal=req.goal,
        )
        return {
            "success": True,
            "response": response_text,
        }
    except Exception as e:
        err_msg = str(e)
        print(f"Error executing Strands agent: {err_msg}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to execute Strands Agent: {err_msg}",
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.server:app", host="0.0.0.0", port=8000, reload=True)
