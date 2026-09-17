import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from dotenv import load_dotenv

from finwise_agent.agent import run_agent

load_dotenv()

app = FastAPI(
    title="FINWISE AI Agent API",
    description="Backend API exposing Strands Agent & financial calculation tools",
    version="1.0.0",
)

# Enable CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    profile: Optional[Dict[str, Any]] = None
    goal: Optional[Dict[str, Any]] = None


@app.get("/health")
def health_check():
    has_key = bool(os.environ.get("OPENAI_API_KEY"))
    return {
        "status": "ok",
        "agent_ready": has_key,
        "message": "FINWISE Agent API is running" if has_key else "OPENAI_API_KEY missing",
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
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
