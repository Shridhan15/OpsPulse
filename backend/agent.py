import os
import json
from typing import Dict, Any
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from schema import AgentState, ParsedLogPayload, ResolutionOutput

# =====================================================================
# 0. INITIALIZATION
# =====================================================================
# Load Groq model. Temperature is set to 0.0 for strict, reliable parsing.
llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    temperature=0.0,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

# =====================================================================
# 1. NODE DEFINITIONS
# =====================================================================

def parse_logs_node(state: AgentState) -> Dict[str, Any]:
    """Node 1: Extract structured data from messy raw system logs."""
    try:
        # Enforce our structured Pydantic schema using Groq's tool-calling engine
        structured_llm = llm.with_structured_output(ParsedLogPayload)
        
        system_prompt = (
            "You are an expert infrastructure analyzer. Read the provided raw server logs, "
            "isolate the exact root fatal exception string, extract the exact timestamp, "
            "and identify which underlying service component threw the error."
        )
        
        # Invoke Groq
        result = structured_llm.invoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": state.raw_logs}
        ])
        
        return {"parsed_data": result}
    except Exception:
        # If anything breaks, flip our global error flag to trigger safe fallback routes
        return {"error_flag": True}


def query_runbooks_node(state: AgentState) -> Dict[str, Any]:
    """Node 2: Local RAG. Search company manuals for a matching error signature."""
    if state.error_flag or not state.parsed_data:
        return {}

    try:
        # Open our local corporate runbook repository
        runbooks_path = os.path.join(os.path.dirname(__file__), "mock_data", "company_runbooks.json")
        with open(runbooks_path, "r") as f:
            data = json.load(f)
        
        detected_signature = state.parsed_data.error_signature.lower()
        matched_runbook = None

        # Scan for an overlapping error keyword/signature
        for rb in data.get("runbooks", []):
            if rb["error_signature"].lower() in detected_signature or detected_signature in rb["error_signature"].lower():
                matched_runbook = rb
                break
        
        return {"matched_runbook": matched_runbook}
    except Exception:
        return {"error_flag": True}


def generate_resolution_node(state: AgentState) -> Dict[str, Any]:
    """Node 3: Formulate final structured action recipe and automation script."""
    # Fallback Mechanism: If an earlier node errored out, generate a safe triage response
    if state.error_flag or not state.parsed_data:
        fallback_output = ResolutionOutput(
            severity="CRITICAL",
            root_cause_summary="An unidentified pipeline exception occurred during autonomous diagnosis.",
            matched_runbook_id="NONE",
            steps_to_resolve="1. Alert the on-call DevOps infrastructure manager immediately.\n2. Review raw backend system storage traces manually.",
            automated_recovery_script="echo 'CRITICAL: Automation bypassed. Please audit system nodes manually.'"
        )
        return {"final_resolution": fallback_output}

    try:
        structured_llm = llm.with_structured_output(ResolutionOutput)
        
        # Build prompt variables dynamically based on whether RAG found an engineering runbook
        rb_context = "NO MATCHING CORPORATE RUNBOOK FOUND IN HISTORY."
        rb_id = "NONE"
        if state.matched_runbook:
            rb_context = f"MATCHED RUNBOOK DETAILS:\nSteps: {state.matched_runbook['resolution_steps']}\nScript: {state.matched_runbook['recovery_script']}"
            rb_id = state.matched_runbook["id"]

        system_prompt = (
            "You are an Elite AI Site Reliability Engineer. Synthesize the raw parsed error details "
            "along with internal corporate runbook guidelines. Compile a finalized, polished, and "
            "strictly formatted operational resolution output."
        )
        
        user_content = (
            f"SUSPECTED COMPONENT: {state.parsed_data.suspected_component}\n"
            f"ERROR SIGNATURE: {state.parsed_data.error_signature}\n"
            f"TIMESTAMP: {state.parsed_data.timestamp}\n"
            f"CORPORATE KNOWLEDGE CONTEXT:\n{rb_context}"
        )

        result = structured_llm.invoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ])
        
        # Overwrite/ensure the matched runbook ID tracks perfectly
        result.matched_runbook_id = rb_id
        return {"final_resolution": result}
    except Exception:
        # Ultimate fail-safe wrapper
        return {"final_resolution": ResolutionOutput(
            severity="CRITICAL",
            root_cause_summary="Final resolution node generation failure.",
            matched_runbook_id="NONE",
            steps_to_resolve="Manually check active infrastructure state logs.",
            automated_recovery_script="echo 'Error generating recovery pipeline.'"
        )}

# =====================================================================
# 2. STATEGRAPH COMPOSITION & COMPILATION
# =====================================================================
# Initialize our pipeline structure using our Pydantic tracking model
workflow = StateGraph(AgentState)

# Register our processing nodes inside the graph
workflow.add_node("parse_logs", parse_logs_node)
workflow.add_node("query_runbooks", query_runbooks_node)
workflow.add_node("generate_resolution", generate_resolution_node)

# Map our assembly lines explicitly from start to finish
workflow.set_entry_point("parse_logs")
workflow.add_edge("parse_logs", "query_runbooks")
workflow.add_edge("query_runbooks", "generate_resolution")
workflow.add_edge("generate_resolution", END)

# Compile the compiled runnable engine
app_agent = workflow.compile()