document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const transactionForm = document.getElementById("transactionForm");
    const customerIdInput = document.getElementById("customerId");
    const amountInput = document.getElementById("amount");
    const locationSelect = document.getElementById("location");
    const deviceIdSelect = document.getElementById("deviceId");
    const hourInput = document.getElementById("hour");
    
    const submitAuditBtn = document.getElementById("submitAuditBtn");
    const clearFormBtn = document.getElementById("clearFormBtn");
    
    // Simulation controls
    const toggleStreamBtn = document.getElementById("toggleStreamBtn");
    const loadSampleTxBtn = document.getElementById("loadSampleTxBtn");
    const simDelaySelect = document.getElementById("simDelay");
    const simLogsContainer = document.getElementById("simLogsContainer");
    
    // Settings modal
    const openSettingsBtn = document.getElementById("openSettingsBtn");
    const closeSettingsBtn = document.getElementById("closeSettingsBtn");
    const settingsModal = document.getElementById("settingsModal");
    const customApiKeyInput = document.getElementById("customApiKey");
    const saveKeyBtn = document.getElementById("saveKeyBtn");
    const clearKeyBtn = document.getElementById("clearKeyBtn");
    const apiKeyStatus = document.getElementById("apiKeyStatus");
    const keyConfigHelp = document.getElementById("keyConfigHelp");
    
    // Graph and status elements
    const pipelineStatus = document.getElementById("pipelineStatus");
    const graphNodes = document.querySelectorAll(".graph-node");
    
    // Verdict panel
    const verdictContainer = document.getElementById("verdictContainer");
    const verdictBadge = document.getElementById("verdictBadge");
    const verdictReasoning = document.getElementById("verdictReasoning");
    
    // Tabs elements
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");
    const sarTabBtn = document.getElementById("sarTabBtn");
    const sarReportCode = document.getElementById("sarReportCode");
    const copySarBtn = document.getElementById("copySarBtn");
    
    // Analytics elements
    const meterRiskIndex = document.getElementById("meter-risk-index");
    const metricRiskVal = document.getElementById("metric-risk-val");
    const meterMlProb = document.getElementById("meter-ml-prob");
    const metricMlVal = document.getElementById("metric-ml-val");
    const iconRuleFlag = document.getElementById("icon-rule-flag");
    const valRuleTrigger = document.getElementById("val-rule-trigger");
    const iconSyntheticFlag = document.getElementById("icon-synthetic-flag");
    const valSyntheticFlag = document.getElementById("val-synthetic-flag");
    
    const detGeoRisk = document.getElementById("det-geo-risk");
    const detDeviceRisk = document.getElementById("det-device-risk");
    const detBehaviorRisk = document.getElementById("det-behavior-risk");
    const detAmlPattern = document.getElementById("det-aml-pattern");
    const detBiometrics = document.getElementById("det-biometrics");
    const detVelocity = document.getElementById("det-velocity");
    const detAto = document.getElementById("det-ato");

    // Local state variables
    let sampleTransactions = [];
    let currentSampleIndex = 0;
    let streamIntervalId = null;
    let isStreaming = false;
    let isPipelineRunning = false;
    let customApiKey = localStorage.getItem("groq_api_key") || "";

    // Node configuration names
    const nodeSequence = [
        "monitor", "risk_score", "rule_based", "ml_agent",
        "geo_agent", "device_agent", "behavior_agent", "aml_pattern",
        "behavioral_biometrics", "geo_velocity", "synthetic_identity",
        "account_takeover", "llm_decision", "sar_agent"
    ];

    // Initialization
    async function init() {
        if (customApiKey) {
            customApiKeyInput.value = customApiKey;
        }
        await verifyApiKeyStatus();
        await fetchSampleTransactions();
        setupEventListeners();
    }

    // Check backend API key configuration status
    async function verifyApiKeyStatus() {
        try {
            apiKeyStatus.classList.remove("dot-active", "dot-inactive");
            const dot = apiKeyStatus.querySelector(".status-dot");
            const text = apiKeyStatus.querySelector(".status-text");
            dot.className = "status-dot dot-testing";
            text.innerText = "Verifying keys...";

            let url = "/api/check-api-key";
            if (customApiKey) {
                url += `?api_key=${encodeURIComponent(customApiKey)}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.configured) {
                dot.className = "status-dot dot-active";
                text.innerText = `Groq Key: ${data.key_preview}`;
                keyConfigHelp.innerText = `Currently using key source: ${data.source.toUpperCase()}`;
            } else {
                dot.className = "status-dot dot-inactive";
                text.innerText = "No API Key (Heuristic Fallback)";
                keyConfigHelp.innerText = "No key configured. Rule fallbacks will apply.";
            }
        } catch (error) {
            console.error("API Key check error:", error);
            const dot = apiKeyStatus.querySelector(".status-dot");
            const text = apiKeyStatus.querySelector(".status-text");
            dot.className = "status-dot dot-inactive";
            text.innerText = "Connection Error";
        }
    }

    // Load samples from server
    async function fetchSampleTransactions() {
        try {
            const response = await fetch("/api/sample-transactions");
            sampleTransactions = await response.json();
            console.log("Loaded samples:", sampleTransactions);
        } catch (error) {
            console.error("Error loading sample transactions:", error);
        }
    }

    // Set up UI Event listeners
    function setupEventListeners() {
        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                tabBtns.forEach(b => b.classList.remove("active"));
                tabContents.forEach(c => c.classList.add("hidden"));
                
                btn.classList.add("active");
                const targetTab = document.getElementById(btn.getAttribute("data-tab"));
                targetTab.classList.remove("hidden");
            });
        });

        // Submit form
        transactionForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (isPipelineRunning) return;
            
            const transaction = {
                customer_id: customerIdInput.value.trim(),
                amount: parseFloat(amountInput.value),
                location: locationSelect.value,
                device_id: deviceIdSelect.value,
                hour: parseInt(hourInput.value)
            };
            
            runTransactionAudit(transaction);
        });

        // Clear form
        clearFormBtn.addEventListener("click", () => {
            transactionForm.reset();
        });

        // Settings Modal Toggle
        openSettingsBtn.addEventListener("click", () => {
            settingsModal.classList.remove("hidden");
        });
        closeSettingsBtn.addEventListener("click", () => {
            settingsModal.classList.add("hidden");
        });
        settingsModal.addEventListener("click", (e) => {
            if (e.target === settingsModal) {
                settingsModal.classList.add("hidden");
            }
        });

        // Save Custom Key
        saveKeyBtn.addEventListener("click", async () => {
            const keyVal = customApiKeyInput.value.trim();
            customApiKey = keyVal;
            localStorage.setItem("groq_api_key", keyVal);
            settingsModal.classList.add("hidden");
            await verifyApiKeyStatus();
        });

        // Clear Custom Key
        clearKeyBtn.addEventListener("click", async () => {
            customApiKey = "";
            customApiKeyInput.value = "";
            localStorage.removeItem("groq_api_key");
            settingsModal.classList.add("hidden");
            await verifyApiKeyStatus();
        });

        // Simulation single click
        loadSampleTxBtn.addEventListener("click", () => {
            if (isPipelineRunning || sampleTransactions.length === 0) return;
            loadNextSampleToForm();
        });

        // Simulation stream play/pause toggle
        toggleStreamBtn.addEventListener("click", () => {
            if (isStreaming) {
                stopSimulationStream();
            } else {
                startSimulationStream();
            }
        });

        // Copy SAR
        copySarBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(sarReportCode.innerText)
                .then(() => {
                    const originalHTML = copySarBtn.innerHTML;
                    copySarBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
                    setTimeout(() => {
                        copySarBtn.innerHTML = originalHTML;
                    }, 2000);
                });
        });
    }

    // Hydrates transaction input fields with the next transaction in the list
    function loadNextSampleToForm() {
        const sample = sampleTransactions[currentSampleIndex];
        customerIdInput.value = sample.customer_id;
        amountInput.value = sample.amount;
        locationSelect.value = sample.location;
        deviceIdSelect.value = sample.device_id;
        hourInput.value = sample.hour;

        currentSampleIndex = (currentSampleIndex + 1) % sampleTransactions.length;
    }

    // Start automated scheduler
    function startSimulationStream() {
        if (sampleTransactions.length === 0) return;
        isStreaming = true;
        toggleStreamBtn.innerHTML = `<i class="fa-solid fa-pause"></i> Pause Stream`;
        toggleStreamBtn.classList.remove("btn-primary");
        toggleStreamBtn.classList.add("btn-secondary");
        loadSampleTxBtn.disabled = true;

        // Immediately trigger first audit
        loadNextSampleToForm();
        submitAuditBtn.click();

        const delay = parseInt(simDelaySelect.value);
        streamIntervalId = setInterval(() => {
            if (!isPipelineRunning) {
                loadNextSampleToForm();
                submitAuditBtn.click();
            }
        }, delay);
    }

    // Stop automated scheduler
    function stopSimulationStream() {
        isStreaming = false;
        toggleStreamBtn.innerHTML = `<i class="fa-solid fa-play"></i> Start Stream`;
        toggleStreamBtn.classList.add("btn-primary");
        toggleStreamBtn.classList.remove("btn-secondary");
        loadSampleTxBtn.disabled = false;
        if (streamIntervalId) {
            clearInterval(streamIntervalId);
            streamIntervalId = null;
        }
    }

    // Clean up graph nodes display state
    function resetGraphUI() {
        graphNodes.forEach(node => {
            node.className = "graph-node";
            const valSpan = node.querySelector(".node-val");
            if (valSpan) {
                valSpan.innerText = "-";
            }
        });
        pipelineStatus.innerText = "Initializing Pipeline...";
        pipelineStatus.className = "node-execution-status";
    }

    // Core transaction post request
    async function runTransactionAudit(transaction) {
        if (isPipelineRunning) return;
        isPipelineRunning = true;
        submitAuditBtn.disabled = true;
        submitAuditBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Auditing...`;
        
        resetGraphUI();

        // Lock form inputs during audit
        const inputs = transactionForm.querySelectorAll("input, select, button");
        inputs.forEach(i => i.disabled = true);

        try {
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    transaction: transaction,
                    api_key: customApiKey
                })
            });

            if (!response.ok) {
                throw new Error("Audit service failed: " + response.statusText);
            }

            const data = await response.json();
            if (data.status === "success") {
                await animateLangGraphTrace(data.trace);
            } else {
                alert("Backend error running multi-agent transaction audit.");
            }

        } catch (error) {
            console.error("Audit error:", error);
            pipelineStatus.innerText = "Error";
            pipelineStatus.className = "node-execution-status verdict-decline";
            
            // Set error UI
            verdictContainer.className = "glass-card verdict-card verdict-decline";
            verdictBadge.innerText = "AUDIT ERROR";
            verdictReasoning.innerText = `Network or service failure: ${error.message}`;
            
        } finally {
            isPipelineRunning = false;
            submitAuditBtn.disabled = false;
            submitAuditBtn.innerHTML = `<span>Run Audit</span><i class="fa-solid fa-wand-magic-sparkles"></i>`;
            
            // Unlock inputs
            inputs.forEach(i => i.disabled = false);
            // Re-disable samples buttons if stream runs
            if (isStreaming) {
                loadSampleTxBtn.disabled = true;
            }
        }
    }

    // Sequential trace animation simulating node activity in LangGraph
    async function animateLangGraphTrace(trace) {
        // Delay helper
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
        // Find maximum status score from final states to highlight
        const finalState = trace[trace.length - 1].state;

        for (let i = 0; i < trace.length; i++) {
            const step = trace[i];
            const nodeName = step.node;
            const state = step.state;

            if (nodeName === "initialize" || nodeName === "error") continue;

            pipelineStatus.innerText = `Active Agent: ${nodeName.toUpperCase()}`;
            
            // Find active element
            const activeElement = document.getElementById(`node-${nodeName}`);
            
            if (activeElement) {
                // Add active highlight
                activeElement.classList.add("active-node");
                
                // Scroll container to keep active row centered
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                // Fill values in graph nodes in real-time as they complete!
                updateNodeValueUI(nodeName, state);

                // Short delay to show active node processing
                await sleep(550);

                // Update node completion styling
                activeElement.classList.remove("active-node");
                applyCompletedNodeStyle(activeElement, nodeName, state);
            }
            
            // Feed active intermediate values into dashboard meters in real time!
            updateAnalyticsDashboard(state, false);
        }

        // Processing finished! Set final values and show decision logs.
        pipelineStatus.innerText = "Pipeline Completed";
        updateAnalyticsDashboard(finalState, true);
        displayFinalVerdict(finalState);
        addSimulationLogItem(finalState);
    }

    // Updates text values inside nodes dynamically
    function updateNodeValueUI(nodeName, state) {
        const valSpan = document.getElementById(`val-${nodeName}`);
        if (!valSpan) return;

        switch (nodeName) {
            case "risk_score":
                valSpan.innerText = `${state.risk_score}/100`;
                break;
            case "rule_based":
                valSpan.innerText = state.rule_based_flag ? "FLAGGED" : "CLEARED";
                break;
            case "ml_agent":
                valSpan.innerText = `${Math.round(state.ml_fraud_probability * 100)}%`;
                break;
            case "geo_agent":
                valSpan.innerText = state.geo_risk;
                break;
            case "device_agent":
                valSpan.innerText = state.device_risk;
                break;
            case "behavior_agent":
                valSpan.innerText = state.behavior_risk;
                break;
            case "aml_pattern":
                valSpan.innerText = state.aml_pattern_detected !== "None" ? "FLAG" : "OK";
                break;
            case "behavioral_biometrics":
                valSpan.innerText = state.behavioral_biometrics_risk;
                break;
            case "geo_velocity":
                valSpan.innerText = state.geo_velocity_risk !== "Low" ? "HIGH" : "LOW";
                break;
            case "synthetic_identity":
                valSpan.innerText = state.synthetic_identity_flag ? "SYNTHETIC" : "CLEARED";
                break;
            case "account_takeover":
                valSpan.innerText = state.account_takeover_risk !== "Low" ? "ATO" : "LOW";
                break;
        }
    }

    // Applies node color flags based on their individual safety outcome
    function applyCompletedNodeStyle(element, nodeName, state) {
        element.classList.remove("state-completed", "state-flagged", "state-declined");

        let isFlagged = false;
        let isDeclined = false;

        switch (nodeName) {
            case "risk_score":
                if (state.risk_score > 75) isDeclined = true;
                else if (state.risk_score > 40) isFlagged = true;
                break;
            case "rule_based":
                if (state.rule_based_flag) isDeclined = true;
                break;
            case "ml_agent":
                if (state.ml_fraud_probability > 0.8) isDeclined = true;
                else if (state.ml_fraud_probability > 0.4) isFlagged = true;
                break;
            case "geo_agent":
                if (state.geo_risk === "High") isFlagged = true;
                break;
            case "device_agent":
                if (state.device_risk === "High") isFlagged = true;
                break;
            case "behavior_agent":
                if (state.behavior_risk === "High") isFlagged = true;
                break;
            case "aml_pattern":
                if (state.aml_pattern_detected !== "None") isFlagged = true;
                break;
            case "behavioral_biometrics":
                if (state.behavioral_biometrics_risk !== "Low") isFlagged = true;
                break;
            case "geo_velocity":
                if (state.geo_velocity_risk !== "Low") isFlagged = true;
                break;
            case "synthetic_identity":
                if (state.synthetic_identity_flag) isDeclined = true;
                break;
            case "account_takeover":
                if (state.account_takeover_risk.includes("High") || state.account_takeover_risk.includes("ATO-Detected")) isDeclined = true;
                else if (state.account_takeover_risk !== "Low") isFlagged = true;
                break;
        }

        if (isDeclined) {
            element.classList.add("state-declined");
        } else if (isFlagged) {
            element.classList.add("state-flagged");
        } else {
            element.classList.add("state-completed");
        }
    }

    // Refresh analytics meters, lists, and values
    function updateAnalyticsDashboard(state, isFinal = false) {
        // Update Meter fills
        meterRiskIndex.style.width = `${state.risk_score}%`;
        metricRiskVal.innerText = `${state.risk_score} / 100`;

        meterMlProb.style.width = `${Math.round(state.ml_fraud_probability * 100)}%`;
        metricMlVal.innerText = state.ml_fraud_probability.toFixed(2);

        // Flag indicators
        if (state.rule_based_flag) {
            iconRuleFlag.className = "metric-icon-box triggered";
            valRuleTrigger.innerText = "True";
        } else {
            iconRuleFlag.className = "metric-icon-box";
            valRuleTrigger.innerText = "False";
        }

        if (state.synthetic_identity_flag) {
            iconSyntheticFlag.className = "metric-icon-box triggered";
            valSyntheticFlag.innerText = "True";
        } else {
            iconSyntheticFlag.className = "metric-icon-box";
            valSyntheticFlag.innerText = "False";
        }

        // List stats
        updateStatusText(detGeoRisk, state.geo_risk);
        updateStatusText(detDeviceRisk, state.device_risk);
        updateStatusText(detBehaviorRisk, state.behavior_risk);
        updateStatusText(detAmlPattern, state.aml_pattern_detected);
        updateStatusText(detBiometrics, state.behavioral_biometrics_risk);
        updateStatusText(detVelocity, state.geo_velocity_risk);
        updateStatusText(detAto, state.account_takeover_risk);

        // Highlight final states in the details card
        if (isFinal) {
            // Populate SAR report
            sarReportCode.innerText = state.sar_report;
            copySarBtn.disabled = !state.sar_report || state.sar_report.includes("not been generated");
            
            // Enable SAR tab if generated
            const decisionStr = state.final_decision.toUpperCase();
            if (decisionStr.includes("DECLINE") || decisionStr.includes("REVIEW")) {
                sarTabBtn.classList.add("pulse-tab");
            } else {
                sarTabBtn.classList.remove("pulse-tab");
            }
        }
    }

    // Color flags helper for dynamic labels list
    function updateStatusText(elem, val) {
        elem.innerText = val;
        elem.className = "";
        
        const text = String(val).toUpperCase();
        if (text.includes("HIGH") || text.includes("TRUE") || text.includes("DETECTED") || text.includes("SYNTHETIC") || text.includes("SUSPICIOUS") || text.includes("ANOMALY")) {
            elem.classList.add("risk-high");
        } else if (text.includes("MEDIUM") || text.includes("SUSPECTED") || text.includes("ANOMALOUS") || (text !== "NONE" && text !== "LOW" && text !== "FALSE" && text !== "UNKNOWN")) {
            elem.classList.add("risk-medium");
        } else {
            elem.classList.add("risk-low");
        }
    }

    // Standardizes final visual panels
    function displayFinalVerdict(state) {
        const decisionText = state.final_decision;
        let decisionType = "PENDING";
        let cleanReasoning = decisionText;

        if (decisionText.includes("APPROVE")) {
            decisionType = "APPROVE";
        } else if (decisionText.includes("DECLINE")) {
            decisionType = "DECLINE";
        } else if (decisionText.includes("REVIEW")) {
            decisionType = "REVIEW";
        }

        // Adjust Container Class
        verdictContainer.className = "glass-card verdict-card";
        verdictContainer.classList.add(`verdict-${decisionType.toLowerCase()}`);

        // Set Badges
        switch (decisionType) {
            case "APPROVE":
                verdictBadge.innerText = "TRANSACTION APPROVED";
                break;
            case "REVIEW":
                verdictBadge.innerText = "MANUAL REVIEW REQUIRED";
                break;
            case "DECLINE":
                verdictBadge.innerText = "TRANSACTION DECLINED";
                break;
            default:
                verdictBadge.innerText = "PENDING";
        }

        // Clean reasoning by converting basic markdown double stars
        cleanReasoning = cleanReasoning
            .replace(/\*\*DECISION: (APPROVE|REVIEW|DECLINE)\*\*/g, "")
            .replace(/### Rationale/g, "")
            .replace(/\*\*/g, "")
            .trim();

        // Convert newlines to breaks or paragraphs
        verdictReasoning.innerHTML = cleanReasoning.split('\n').map(p => {
            if (p.trim().startsWith('-')) {
                return `<li>${p.replace('-', '').trim()}</li>`;
            }
            return p.trim() ? `<p style="margin-bottom: 0.5rem;">${p.trim()}</p>` : '';
        }).join('');
    }

    // Appends processed item to simulation history
    function addSimulationLogItem(state) {
        // Clear placeholder
        const placeholder = simLogsContainer.querySelector(".log-placeholder");
        if (placeholder) {
            simLogsContainer.innerHTML = "";
        }

        const decisionText = state.final_decision;
        let decisionType = "REVIEW";
        if (decisionText.includes("APPROVE")) decisionType = "APPROVE";
        else if (decisionText.includes("DECLINE")) decisionType = "DECLINE";

        const logItem = document.createElement("div");
        logItem.className = `log-item verdict-${decisionType.toLowerCase()}`;

        const tx = state.transaction;
        logItem.innerHTML = `
            <div class="log-info">
                <span>Ref: ${tx.customer_id}</span>
                <p>$${tx.amount} (${tx.location})</p>
            </div>
            <div class="log-verdict ${decisionType.toLowerCase()}">${decisionType}</div>
        `;

        // Prepend to show latest at top
        simLogsContainer.insertBefore(logItem, simLogsContainer.firstChild);

        // Cap at 10 items in history
        if (simLogsContainer.children.length > 10) {
            simLogsContainer.removeChild(simLogsContainer.lastChild);
        }
    }

    // Execute application loading
    init();
});
