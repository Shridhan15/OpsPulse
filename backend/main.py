import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load our environment variables from the .env file
load_dotenv()

# Import our compiled LangGraph agent and our structural schemas
from agent import app_agent
from schema import ResolutionOutput

# Initialize the FastAPI application shell
app = FastAPI(
    title="OpsPulse AI - Autonomous SRE Backend",
    description="State-driven incident response orchestration engine using LangGraph and Groq."
)

# =====================================================================
# 1. SECURITY & CORS CONFIGURATION
# =====================================================================
# This allows your React UI (running on localhost:3000 or 5173) to 
# safely send data requests to your Python server (on localhost:8000).
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Double-check that this is an exact asterisk string
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# 2. REQUEST SCHEMAS
# =====================================================================
class IncidentRequest(BaseModel):
    raw_logs: str

# =====================================================================
# 3. API ENDPOINT ROUTING
# =====================================================================

@app.get("/")
def health_check():
    """Simple route to verify the server is active on your laptop."""
    return {"status": "ONLINE", "engine": "FastAPI + LangGraph + Groq"}


@app.post("/api/analyze", response_model=ResolutionOutput)
async def analyze_incident(payload: IncidentRequest):
    """
    Main execution highway. Receives raw log strings from the UI,
    routes them through the LangGraph workflow, and returns the final fix card.
    """
    if not payload.raw_logs.strip():
        raise HTTPException(status_code=400, detail="Log payload cannot be empty.")
    
    try:
        # Prepare the initial state container for LangGraph
        initial_input = {"raw_logs": payload.raw_logs}
        
        # Invoke our LangGraph state machine synchronously
        # app_agent runs Node 1 -> Node 2 -> Node 3 automatically
        final_state = app_agent.invoke(initial_input)
        
        # print("Final LangGraph State:", final_state)  # Debugging output to trace the final state structure
        # Check if a valid resolution layout was built inside the graph state
        if "final_resolution" in final_state and final_state["final_resolution"]:
            return final_state["final_resolution"]
        
        raise HTTPException(status_code=500, detail="Agent workflow failed to build a resolution.")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# =====================================================================
# 4. RUNNER
# =====================================================================
if __name__ == "__main__":
    import uvicorn
    # Boots up the local development gateway server
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)