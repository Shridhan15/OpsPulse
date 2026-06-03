import os
import json
import re
from typing import Dict, Any
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from schema import AgentState, ParsedLogPayload, ResolutionOutput
from dotenv import load_dotenv

load_dotenv()

# =====================================================================
# 0. INITIALIZATION
# =====================================================================
llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    temperature=0.0,
    groq_api_key=os.getenv("GROQ_API_KEY")
)

# =====================================================================
# HELPER: UTILITY JSON CLEANER
# =====================================================================
def extract_clean_json(raw_text: str) -> dict:
    """Uses regex to isolate and extract only the valid JSON block from LLM text, safely handling line breaks."""
    # Find anything enclosed between the first '{' and the last '}'
    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
    if not match:
        raise ValueError("No structural JSON block found in the model response.")
    
    clean_block = match.group(0)
    
    # Replace literal unescaped tabs and structural newlines within text strings to prevent 404/500 control character blocks
    clean_block = re.sub(r'\n(?!\s*[{}"\[\]])', r'\\n', clean_block)
    
    try:
        return json.loads(clean_block)
    except json.JSONDecodeError:
        # Fallback repair: if strict regex substitution alters structural boundaries, try standard raw string loading
        # replacing literal newlines with escaped wrappers
        repaired = clean_block.replace('\n', '\\n').replace('\\n\\n', '\\n')
        # Restore brackets that shouldn't be escaped
        repaired = repaired.replace('\\n{', '{').replace('\\n}', '}').replace('}\\n', '}')
        return json.loads(repaired)
# =====================================================================
# 1. NODE DEFINITIONS
# =====================================================================

def parse_logs_node(state: AgentState) -> Dict[str, Any]:
    """Node 1: Extract telemetry fields securely."""
    try:
        system_prompt = (
            "You are an expert infrastructure analyzer. Read the provided raw server logs.\n"
            "Extract the required metrics and format them into a single valid JSON object matching this exact structure:\n\n"
            "{\n"
            '  "error_signature": "The core fatal error line or exception message string",\n'
            '  "timestamp": "The extracted timestamp string",\n'
            '  "suspected_component": "The name of the service/db that crashed"\n'
            "}"
        )
        
        response = llm.invoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": state.raw_logs}
        ])
        
        # Clean and safely map the dictionary variables
        data_dict = extract_clean_json(response.content)
        
        parsed_obj = ParsedLogPayload(
            error_signature=data_dict.get("error_signature", "Unknown Error"),
            timestamp=data_dict.get("timestamp", "Unknown Time"),
            suspected_component=data_dict.get("suspected_component", "Unknown Component")
        )
        
        return {"parsed_data": parsed_obj, "error_flag": False}
    except Exception as e:
        print(f"\n❌ CRITICAL DEBUG: Node 1 failed. Error details: {str(e)}\n")
        return {"error_flag": True}


def query_runbooks_node(state: AgentState) -> Dict[str, Any]:
    """Node 2: Local RAG scan."""
    if state.error_flag or not state.parsed_data:
        return {"matched_runbook": None}

    try:
        runbooks_path = os.path.join(os.path.dirname(__file__), "mock_data", "company_runbooks.json")
        with open(runbooks_path, "r") as f:
            data = json.load(f)
        
        detected_signature = state.parsed_data.error_signature.lower()
        matched_runbook = None

        for rb in data.get("runbooks", []):
            if rb["error_signature"].lower() in detected_signature or detected_signature in rb["error_signature"].lower():
                matched_runbook = rb
                break
        
        return {"matched_runbook": matched_runbook, "error_flag": False}
    except Exception as e:
        print(f"\n❌ CRITICAL DEBUG: Node 2 failed. Error details: {str(e)}\n")
        return {"error_flag": True}


def generate_resolution_node(state: AgentState) -> Dict[str, Any]:
    """Node 3: Compile final resolution card layout."""
    if state.error_flag or not state.parsed_data:
        fallback_output = ResolutionOutput(
            severity="CRITICAL",
            root_cause_summary="An extraction pipeline formatting mismatch occurred inside the agent engine.",
            matched_runbook_id="NONE",
            steps_to_resolve="1. Verify Groq inference token availability.\n2. Review raw data streams manually inside the backend console context.",
            automated_recovery_script="echo 'CRITICAL: Structural validation failure. Triage aborted.'"
        )
        return {"final_resolution": fallback_output}

    try:
        rb_context = "NO MATCHING CORPORATE RUNBOOK FOUND IN HISTORY."
        rb_id = "NONE"
        if state.matched_runbook:
            rb_context = f"MATCHED RUNBOOK DETAILS:\nSteps: {state.matched_runbook['resolution_steps']}\nScript: {state.matched_runbook['recovery_script']}"
            rb_id = state.matched_runbook["id"]

        system_prompt = (
            "You are an Elite AI Site Reliability Engineer. Synthesize the raw parsed error details along with internal corporate runbook guidelines.\n"
            "Compile your analysis into a single valid JSON object matching this exact structure:\n\n"
            "{\n"
            '  "severity": "CRITICAL or WARNING or INFO",\n'
            '  "root_cause_summary": "A concise one-sentence breakdown of why the system crashed.",\n'
            '  "steps_to_resolve": "Clear, bulleted structural steps an engineer must take separated by newlines.",\n'
            '  "automated_recovery_script": "A copy-pasteable terminal script command to run the recovery."\n'
            "}"
        )
        
        user_content = (
            f"SUSPECTED COMPONENT: {state.parsed_data.suspected_component}\n"
            f"ERROR SIGNATURE: {state.parsed_data.error_signature}\n"
            f"TIMESTAMP: {state.parsed_data.timestamp}\n"
            f"CORPORATE KNOWLEDGE CONTEXT:\n{rb_context}"
        )

        response = llm.invoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ])
        
        # Clean and safely extract data dictionary fields
        data_dict = extract_clean_json(response.content)

        final_output = ResolutionOutput(
            severity=data_dict.get("severity", "CRITICAL"),
            root_cause_summary=data_dict.get("root_cause_summary", "System crash isolated."),
            matched_runbook_id=rb_id,
            steps_to_resolve=data_dict.get("steps_to_resolve", "Contact systems engineer."),
            automated_recovery_script=data_dict.get("automated_recovery_script", "echo 'No script generated.'")
        )

        return {"final_resolution": final_output}
        
    except Exception as e:
        print(f"\n❌ CRITICAL DEBUG: Node 3 failed. Error details: {str(e)}\n")
        return {"final_resolution": ResolutionOutput(
            severity="CRITICAL",
            root_cause_summary="Resolution compilation fatal error exception.",
            matched_runbook_id="NONE",
            steps_to_resolve="Check backend engine connectivity variables immediately.",
            automated_recovery_script="echo 'Error processing automation matrix.'"
        )}

# =====================================================================
# 2. STATEGRAPH COMPOSITION
# =====================================================================
workflow = StateGraph(AgentState)

workflow.add_node("parse_logs", parse_logs_node)
workflow.add_node("query_runbooks", query_runbooks_node)
workflow.add_node("generate_resolution", generate_resolution_node)

workflow.set_entry_point("parse_logs")
workflow.add_edge("parse_logs", "query_runbooks")
workflow.add_edge("query_runbooks", "generate_resolution")
workflow.add_edge("generate_resolution", END)

app_agent = workflow.compile()