import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

from agent_graph import run_fraud_detection

app = FastAPI(
    title="GuardRail AI - Multi-Agent Fraud Detection",
    description="A modular LangGraph system orchestrating 12 agents for automated transaction auditing.",
    version="1.0.0"
)

# Request Models
class TransactionModel(BaseModel):
    amount: float = Field(..., description="The transaction amount in USD")
    location: str = Field(..., description="Geographical location of the transaction")
    device_id: str = Field(..., description="Hardware device ID or class")
    hour: int = Field(..., description="Hour of the transaction (0-23)")
    customer_id: str = Field(..., description="Unique customer reference identifier")

class AnalysisRequest(BaseModel):
    transaction: TransactionModel
    api_key: Optional[str] = Field(None, description="Optional custom Groq API key")

# Sample transactions matches the dataset from original notebook
SAMPLE_TRANSACTIONS = [
    {
        "customer_id": "CUST_1001",
        "amount": 2500,
        "location": "Nigeria",
        "device_id": "VPN_DEVICE",
        "hour": 2
    },
    {
        "customer_id": "CUST_1002",
        "amount": 50,
        "location": "London",
        "device_id": "MOBILE_APP_123",
        "hour": 10
    },
    {
        "customer_id": "CUST_1003",
        "amount": 1500,
        "location": "Russia",
        "device_id": "WEB_BROWSER_ABC",
        "hour": 3
    },
    {
        "customer_id": "CUST_1004",
        "amount": 250,
        "location": "New York",
        "device_id": "POS_TERMINAL_XYZ",
        "hour": 14
    },
    {
        "customer_id": "CUST_1005",
        "amount": 3000,
        "location": "Nigeria",
        "device_id": "VPN_DEVICE",
        "hour": 1
    }
]

@app.get("/api/sample-transactions")
def get_sample_transactions():
    """Retrieve sample transactions for mock feeding."""
    return SAMPLE_TRANSACTIONS

@app.post("/api/analyze")
def analyze_transaction(payload: AnalysisRequest):
    """Audits the transaction through the multi-agent LangGraph workflow."""
    # Convert Pydantic model to dictionary
    transaction_dict = payload.transaction.dict()
    
    # Retrieve API key: first check request body, then environment variables
    api_key = payload.api_key or os.getenv("GROQ_API_KEY")
    
    # Run LangGraph pipeline
    try:
        history = run_fraud_detection(transaction_dict, api_key=api_key)
        return {"status": "success", "trace": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed running detection pipeline: {str(e)}")

@app.get("/api/check-api-key")
def check_api_key(api_key: Optional[str] = None):
    """Checks if a Groq API Key is configured."""
    key_to_check = api_key or os.getenv("GROQ_API_KEY")
    is_configured = bool(key_to_check and key_to_check.strip() != "" and not key_to_check.startswith("YOUR_"))
    
    masked_key = "None"
    if is_configured:
        masked_key = f"{key_to_check[:6]}...{key_to_check[-4:]}"
        
    return {
        "configured": is_configured,
        "source": "payload" if api_key else ("env" if os.getenv("GROQ_API_KEY") else "none"),
        "key_preview": masked_key
    }

# Serve static web frontend
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

# Mount static files (HTML, CSS, JS)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def read_root():
    """Serves the dashboard index file."""
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Web application server is active. Place static/index.html to mount frontend UI."}

if __name__ == "__main__":
    import uvicorn
    # Start the server on port 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
