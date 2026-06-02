from pydantic import BaseModel, Field
from typing import List, Optional

# =====================================================================
# 1. AI EXTRACTION SCHEMA (Used by the Log Parser Node)
# =====================================================================
class ParsedLogPayload(BaseModel):
    error_signature: str = Field(
        description="The primary fatal error line or core exception message extracted from the logs."
    )
    timestamp: str = Field(
        description="The timestamp when the critical failure or crash occurred."
    )
    suspected_component: str = Field(
        description="The name of the microservice, database, or layer that appears to have caused the crash."
    )

# =====================================================================
# 2. FINAL RESOLUTION SCHEMA (The final card displayed on your UI)
# =====================================================================
class ResolutionOutput(BaseModel):
    severity: str = Field(
        description="The calculated operational threat level. Must be: CRITICAL, WARNING, or INFO."
    )
    root_cause_summary: str = Field(
        description="A concise, one-sentence breakdown of why the system crashed."
    )
    matched_runbook_id: str = Field(
        description="The ID of the company runbook used to solve this (e.g., 'RB-402'), or 'NONE' if no match found."
    )
    steps_to_resolve: str = Field(
        description="Clear, bulleted structural steps an engineer must take to resolve the root cause."
    )
    automated_recovery_script: str = Field(
        description="A copy-pasteable, valid terminal script or command to instantly execute the recovery."
    )

# =====================================================================
# 3. GLOBAL AGENT STATE SCHEMA (The LangGraph Memory Object)
# =====================================================================
# This dictionary tracks the history of our execution pipeline.
class AgentState(BaseModel):
    raw_logs: str                        # Input: The raw text pasted from the UI
    parsed_data: Optional[ParsedLogPayload] = None  # Added by Node 1
    matched_runbook: Optional[dict] = None          # Added by Node 2
    final_resolution: Optional[ResolutionOutput] = None  # Added by Node 3
    error_flag: bool = False             # Set to True if any node catches an exception