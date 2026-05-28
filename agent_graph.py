import os
import random
from typing import Dict, Any, TypedDict, List
from langgraph.graph import StateGraph
from langchain_groq import ChatGroq

# Define the shared state structure for the multi-agent system.
class TransactionState(TypedDict):
    transaction: Dict[str, Any]
    risk_score: int
    rule_based_flag: bool
    ml_fraud_probability: float
    geo_risk: str
    device_risk: str
    behavior_risk: str
    aml_pattern_detected: str
    behavioral_biometrics_risk: str
    geo_velocity_risk: str
    synthetic_identity_flag: bool
    account_takeover_risk: str
    final_decision: str
    sar_report: str

def create_initial_state(transaction: Dict[str, Any]) -> TransactionState:
    return {
        "transaction": transaction,
        "risk_score": 0,
        "rule_based_flag": False,
        "ml_fraud_probability": 0.0,
        "geo_risk": "Unknown",
        "device_risk": "Unknown",
        "behavior_risk": "Unknown",
        "aml_pattern_detected": "None",
        "behavioral_biometrics_risk": "Low",
        "geo_velocity_risk": "Low",
        "synthetic_identity_flag": False,
        "account_takeover_risk": "Low",
        "final_decision": "Pending",
        "sar_report": ""
    }

# 1. Transaction Monitoring Agent
def transaction_monitoring_agent(state: TransactionState) -> TransactionState:
    # Logs the transaction
    return state

# 2. Risk Scoring Agent
def risk_scoring_agent(state: TransactionState) -> TransactionState:
    # Generate risk score (mocked for demo, deterministic if transaction data repeats)
    # Using customer_id or amount to make it slightly reproducible
    cust_seed = sum(ord(c) for c in state["transaction"].get("customer_id", "CUST"))
    amt_seed = int(state["transaction"].get("amount", 100))
    random.seed(cust_seed + amt_seed)
    state["risk_score"] = random.randint(1, 100)
    return state

# 3. Rule-Based Fraud Agent
def rule_based_detection_agent(state: TransactionState) -> TransactionState:
    amount = state["transaction"].get("amount", 0)
    if amount > 1000:
        state["rule_based_flag"] = True
    else:
        state["rule_based_flag"] = False
    return state

# 4. Machine Learning Fraud Agent
def machine_learning_agent(state: TransactionState) -> TransactionState:
    cust_seed = sum(ord(c) for c in state["transaction"].get("customer_id", "CUST"))
    amt_seed = int(state["transaction"].get("amount", 100))
    random.seed(cust_seed + amt_seed + 1)
    state["ml_fraud_probability"] = random.uniform(0, 1)
    return state

# 5. Geo-Risk Agent
def geo_risk_agent(state: TransactionState) -> TransactionState:
    risky_locations = ["Russia", "Nigeria", "Unknown"]
    location = state["transaction"].get("location", "Unknown")
    if location in risky_locations:
        state["geo_risk"] = "High"
    else:
        state["geo_risk"] = "Low"
    return state

# 6. Device Intelligence Agent
def device_intelligence_agent(state: TransactionState) -> TransactionState:
    risky_devices = ["TOR_BROWSER", "VPN_DEVICE", "EMULATOR"]
    device = state["transaction"].get("device_id", "Unknown")
    if device in risky_devices:
        state["device_risk"] = "High"
    else:
        state["device_risk"] = "Low"
    return state

# 7. Behavioral Analysis Agent
def behavior_analysis_agent(state: TransactionState) -> TransactionState:
    abnormal_hours = [1, 2, 3, 4]  # 1 AM - 4 AM
    hour = state["transaction"].get("hour", 12)
    if hour in abnormal_hours:
        state["behavior_risk"] = "High"
    else:
        state["behavior_risk"] = "Low"
    return state

# 8. AML Pattern Agent
def aml_pattern_agent(state: TransactionState) -> TransactionState:
    transaction = state["transaction"]
    amount = transaction.get("amount", 0)
    location = transaction.get("location", "Unknown")
    if amount > 5000 and location in ["Russia", "Nigeria"]:
        state["aml_pattern_detected"] = "High-Risk Location & Large Amount"
    elif amount > 10000:
        state["aml_pattern_detected"] = "Unusually Large Transaction"
    else:
        state["aml_pattern_detected"] = "None"
    return state

# 9. Behavioral Biometrics Agent
def behavioral_biometrics_agent(state: TransactionState) -> TransactionState:
    cust_seed = sum(ord(c) for c in state["transaction"].get("customer_id", "CUST"))
    random.seed(cust_seed + 2)
    state["behavioral_biometrics_risk"] = random.choice(["Low", "Anomalous", "Suspicious"])
    return state

# 10. Geo-Velocity Agent
def geo_velocity_agent(state: TransactionState) -> TransactionState:
    transaction = state["transaction"]
    current_location = transaction.get("location", "Unknown")
    hour = transaction.get("hour", 12)
    if current_location == "Russia" and hour < 5:
        state["geo_velocity_risk"] = "High-Velocity Anomaly"
    elif current_location == "London" and hour < 8:
        state["geo_velocity_risk"] = "Moderate-Velocity Anomaly"
    else:
        state["geo_velocity_risk"] = "Low"
    return state

# 11. Synthetic Identity Agent
def synthetic_identity_agent(state: TransactionState) -> TransactionState:
    customer_id = state["transaction"].get("customer_id", "")
    if customer_id in ["CUST_1005", "CUST_XYZ_SYNTHETIC"]:
        state["synthetic_identity_flag"] = True
    else:
        state["synthetic_identity_flag"] = False
    return state

# 12. Account Takeover Agent
def account_takeover_agent(state: TransactionState) -> TransactionState:
    transaction = state["transaction"]
    device_id = transaction.get("device_id", "")
    hour = transaction.get("hour", 12)
    if device_id == "VPN_DEVICE" and hour < 5:
        state["account_takeover_risk"] = "ATO-Detected (High)"
    elif device_id == "WEB_BROWSER_ABC" and hour < 8:
        state["account_takeover_risk"] = "ATO-Suspected (Medium)"
    else:
        state["account_takeover_risk"] = "Low"
    return state

def heuristic_decision(state: TransactionState, error_msg: str = "") -> (str, str):
    """Heuristic fraud decision logic fallback."""
    score = state["risk_score"]
    rules = state["rule_based_flag"]
    ml = state["ml_fraud_probability"]
    ato = state["account_takeover_risk"]
    geo = state["geo_risk"]
    device = state["device_risk"]
    aml = state["aml_pattern_detected"]
    synthetic = state["synthetic_identity_flag"]
    
    reasons = []
    
    # Check declination conditions
    if rules:
        reasons.append("Rule-Based Flag: Transaction amount exceeds safety threshold ($1000)")
    if ml > 0.8:
        reasons.append(f"ML Fraud Model predicts extremely high probability of fraud ({round(ml*100, 1)}%)")
    if ato == "ATO-Detected (High)":
        reasons.append("Account Takeover risk detected (VPN access during abnormal hours)")
    if score > 75:
        reasons.append(f"Aggregate Risk Score is dangerously high ({score}/100)")
    if synthetic:
        reasons.append("Synthetic Identity indicators detected for customer file")
        
    if reasons:
        explanation = "This transaction was DECLINED due to severe risk markers:\n- " + "\n- ".join(reasons)
        if error_msg:
            explanation += f"\n\n*(Note: LLM server was unreachable. Reverted to Rule Engine fallback. Error: {error_msg})*"
        return "DECLINE", explanation
        
    # Check review conditions
    review_reasons = []
    if ml > 0.4:
        review_reasons.append(f"ML Fraud Model predicts moderate fraud probability ({round(ml*100, 1)}%)")
    if geo == "High":
        review_reasons.append(f"Geographical location '{state['transaction'].get('location')}' is listed on watchlist")
    if device == "High":
        review_reasons.append(f"Device intelligence flagged access from a '{state['transaction'].get('device_id')}'")
    if aml != "None":
        review_reasons.append(f"AML pattern warning: {aml}")
    if score > 40:
        review_reasons.append(f"Aggregate Risk Score is moderate ({score}/100)")
        
    if review_reasons:
        explanation = "This transaction requires HUMAN REVIEW due to suspicious patterns:\n- " + "\n- ".join(review_reasons)
        if error_msg:
            explanation += f"\n\n*(Note: LLM server was unreachable. Reverted to Rule Engine fallback. Error: {error_msg})*"
        return "REVIEW", explanation
        
    # Default approval
    explanation = f"Approved successfully. All 12 fraud-monitoring agents verified the transaction parameters as safe (Risk Score: {score}/100, ML Probability: {round(ml*100, 1)}%)."
    if error_msg:
        explanation += f"\n\n*(Note: LLM verification skipped. Reverted to Rule Engine fallback. Error: {error_msg})*"
    return "APPROVE", explanation

# 13. LLM Decision Agent
def llm_decision_agent(state: TransactionState, config: Dict[str, Any] = None) -> TransactionState:
    if config is None:
        config = {}
    configurable = config.get("configurable", {})
    api_key = configurable.get("groq_api_key") or os.environ.get("GROQ_API_KEY")

    prompt = f"""
    You are a banking fraud investigation AI.
    Analyze this transaction and return a structured decision.

    Transaction: {state["transaction"]}
    Risk Score: {state["risk_score"]}
    Rule Flag: {state["rule_based_flag"]}
    ML Fraud Probability: {state["ml_fraud_probability"]}
    Geo Risk: {state["geo_risk"]}
    Device Risk: {state["device_risk"]}
    Behavior Risk: {state["behavior_risk"]}
    AML Pattern Detected: {state["aml_pattern_detected"]}
    Behavioral Biometrics Risk: {state["behavioral_biometrics_risk"]}
    Geo-Velocity Risk: {state["geo_velocity_risk"]}
    Synthetic Identity Flag: {state["synthetic_identity_flag"]}
    Account Takeover Risk: {state["account_takeover_risk"]}

    Decide exactly one of the following decisions:
    DECISION: APPROVE
    DECISION: REVIEW
    DECISION: DECLINE

    Provide a concise, professional explanation for your decision, outlining the main risk factors.
    Use Markdown format. Structure your output exactly like this:
    **DECISION: [APPROVE/REVIEW/DECLINE]**
    
    ### Rationale
    [Write your rationale here]
    """

    if not api_key:
        decision, explanation = heuristic_decision(state, "No Groq API key set")
        state["final_decision"] = f"**DECISION: {decision}**\n\n### Rationale\n{explanation}"
        return state

    try:
        llm = ChatGroq(
            temperature=0.2,
            groq_api_key=api_key,
            model_name="llama-3.3-70b-versatile"
        )
        response = llm.invoke(prompt)
        state["final_decision"] = response.content
    except Exception as e:
        decision, explanation = heuristic_decision(state, str(e))
        state["final_decision"] = f"**DECISION: {decision}**\n\n### Rationale\n{explanation}"
        
    return state

# 14. SAR Agent
def sar_agent(state: TransactionState) -> TransactionState:
    # Check if the decision contains DECLINE or REVIEW to generate a SAR
    decision_str = state.get("final_decision", "")
    is_suspicious = "DECLINE" in decision_str or "REVIEW" in decision_str or state["risk_score"] > 50 or state["rule_based_flag"]
    
    if not is_suspicious:
        state["sar_report"] = "No Suspicious Activity Report (SAR) generated. Transaction does not meet alert thresholds."
        return state

    sar_report = f"""====================================================================
SUSPICIOUS ACTIVITY REPORT (SAR) - FINANCIAL CRIME COMPLIANCE
====================================================================
DATE GENERATED: 2026-05-23
INVESTIGATION ID: SAR-{random.randint(100000, 999999)}
CUSTOMER ID: {state["transaction"].get("customer_id", "N/A")}

[1] SUBJECT OF ALERT:
    - Customer ID: {state["transaction"].get("customer_id", "N/A")}
    - Primary Location: {state["transaction"].get("location", "N/A")}
    - Device Signature: {state["transaction"].get("device_id", "N/A")}

[2] TRANSACTION DESCRIPTION:
    - Amount: ${state["transaction"].get("amount", 0)} USD
    - Timestamp Hour: {state["transaction"].get("hour", 12)}:00 UTC

[3] FRAUD DETECTION SUMMARY:
    - Aggregate Risk Score: {state["risk_score"]}/100
    - Rule-Based Alert Triggered: {state["rule_based_flag"]}
    - Machine Learning Fraud Prob: {round(state["ml_fraud_probability"] * 100, 1)}%
    - AML Pattern Detected: {state["aml_pattern_detected"]}
    - Account Takeover Score: {state["account_takeover_risk"]}
    - Synthetic Identity Marker: {state["synthetic_identity_flag"]}

[4] INVESTIGATION DECISION DETAILS:
{state["final_decision"]}

[5] REGULATORY FILING RECOMMENDATION:
    - Filing Status: RECOMMENDED (Form TD F 90-22.47)
    - Action Item: Block source device, flag customer account for enhanced due diligence (EDD), and route to Compliance Review Board.
===================================================================="""
    
    state["sar_report"] = sar_report
    return state

# Compile LangGraph State Graph
graph = StateGraph(TransactionState)

# Add Nodes
graph.add_node("monitor", transaction_monitoring_agent)
graph.add_node("risk_score", risk_scoring_agent)
graph.add_node("rule_based", rule_based_detection_agent)
graph.add_node("ml_agent", machine_learning_agent)
graph.add_node("geo_agent", geo_risk_agent)
graph.add_node("device_agent", device_intelligence_agent)
graph.add_node("behavior_agent", behavior_analysis_agent)
graph.add_node("aml_pattern", aml_pattern_agent)
graph.add_node("behavioral_biometrics", behavioral_biometrics_agent)
graph.add_node("geo_velocity", geo_velocity_agent)
graph.add_node("synthetic_identity", synthetic_identity_agent)
graph.add_node("account_takeover", account_takeover_agent)
graph.add_node("llm_decision", llm_decision_agent)
graph.add_node("sar_agent", sar_agent)

# Set Entry Point
graph.set_entry_point("monitor")

# Add Edges
graph.add_edge("monitor", "risk_score")
graph.add_edge("risk_score", "rule_based")
graph.add_edge("rule_based", "ml_agent")
graph.add_edge("ml_agent", "geo_agent")
graph.add_edge("geo_agent", "device_agent")
graph.add_edge("device_agent", "behavior_agent")
graph.add_edge("behavior_agent", "aml_pattern")
graph.add_edge("aml_pattern", "behavioral_biometrics")
graph.add_edge("behavioral_biometrics", "geo_velocity")
graph.add_edge("geo_velocity", "synthetic_identity")
graph.add_edge("synthetic_identity", "account_takeover")
graph.add_edge("account_takeover", "llm_decision")
graph.add_edge("llm_decision", "sar_agent")

fraud_pipeline = graph.compile()

def run_fraud_detection(transaction: Dict[str, Any], api_key: str = None) -> List[Dict[str, Any]]:
    """Runs the LangGraph transaction monitoring pipeline.
    Returns a list of trace steps, each step containing the active node and the transaction state.
    """
    # Reset random seed dynamically to allow variations on repeats
    random.seed(None)
    
    current_state = create_initial_state(transaction)
    config = {"configurable": {"groq_api_key": api_key}}
    
    history = []
    
    # Store initial state
    history.append({
        "node": "initialize",
        "state": current_state.copy()
    })
    
    # Execute LangGraph and stream state transitions
    try:
        events = fraud_pipeline.stream(current_state, config=config)
        for chunk in events:
            for node_name, state_update in chunk.items():
                for key, val in state_update.items():
                    current_state[key] = val
                history.append({
                    "node": node_name,
                    "state": current_state.copy()
                })
    except Exception as e:
        # If execution fails, create a fallback single step failure
        current_state["final_decision"] = f"**DECISION: REVIEW**\n\n### Rationale\nPipeline execution failed: {str(e)}"
        current_state["sar_report"] = f"Error during pipeline execution: {str(e)}"
        history.append({
            "node": "error",
            "state": current_state.copy()
        })
        
    return history
