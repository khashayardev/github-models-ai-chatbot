/**
 * API Communication Module
 * Handles all communication with GitHub API
 */

class GitHubAPI {
    constructor(config) {
        this.owner = config.github.owner;
        this.repo = config.github.repo;
        this.token = config.github.token;
        this.baseUrl = 'https://api.github.com';
        this.debug = config.app.debugMode || false;
    }
    
    /**
     * Make authenticated request to GitHub API
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`GitHub API Error (${response.status}): ${error}`);
        }
        
        return response.json();
    }
    
    /**
     * Send chat message to trigger workflow
     */
    async sendChatMessage(message, modelId, history = []) {
        const endpoint = `/repos/${this.owner}/${this.repo}/dispatches`;
        
        const payload = {
            event_type: 'chat-request',
            client_payload: {
                message: message,
                model_id: modelId,
                history: JSON.stringify(history),
                timestamp: new Date().toISOString()
            }
        };
        
        if (this.debug) {
            console.log('Sending dispatch request:', payload);
        }
        
        await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        // Wait a moment for workflow to start
        await this.sleep(1000);
        
        // Get the latest workflow run
        return this.getLatestWorkflowRun();
    }
    
    /**
     * Get latest workflow runs
     */
    async getLatestWorkflowRun() {
        const endpoint = `/repos/${this.owner}/${this.repo}/actions/runs`;
        const data = await this.request(endpoint);
        
        if (data.workflow_runs && data.workflow_runs.length > 0) {
            return data.workflow_runs[0];
        }
        return null;
    }
    
    /**
     * Poll for workflow completion
     */
    async pollForResponse(runId, maxAttempts = 30, interval = 1000) {
        for (let i = 0; i < maxAttempts; i++) {
            const endpoint = `/repos/${this.owner}/${this.repo}/actions/runs/${runId}`;
            const run = await this.request(endpoint);
            
            if (this.debug) {
                console.log(`Poll attempt ${i + 1}: Run status = ${run.status}, conclusion = ${run.conclusion}`);
            }
            
            if (run.status === 'completed') {
                if (run.conclusion === 'success') {
                    // Get the response from artifacts
                    return this.getWorkflowResponse(runId);
                } else {
                    throw new Error(`Workflow failed with conclusion: ${run.conclusion}`);
                }
            }
            
            await this.sleep(interval);
        }
        
        throw new Error('Timeout waiting for workflow response');
    }
    
    /**
     * Get workflow response from artifacts
     */
    async getWorkflowResponse(runId) {
        const endpoint = `/repos/${this.owner}/${this.repo}/actions/runs/${runId}/artifacts`;
        const artifacts = await this.request(endpoint);
        
        if (artifacts.artifacts && artifacts.artifacts.length > 0) {
            const responseArtifact = artifacts.artifacts.find(a => a.name === 'chat-response');
            
            if (responseArtifact) {
                // Download and parse the artifact
                const downloadUrl = responseArtifact.archive_download_url;
                const response = await fetch(downloadUrl, {
                    headers: {
                        'Authorization': `token ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (response.ok) {
                    const zipBlob = await response.blob();
                    // In production, you'd parse the zip file
                    // For now, we'll simulate reading the response
                    return this.parseArtifactResponse(zipBlob);
                }
            }
        }
        
        // Fallback: return a default response
        return {
            success: true,
            response: "Response received but artifact not found. This is a fallback message.",
            model: "unknown",
            processing_time: 0
        };
    }
    
    /**
     * Parse artifact response (simplified)
     */
    async parseArtifactResponse(zipBlob) {
        // In a real implementation, you'd use JSZip to extract the file
        // For now, return a placeholder
        return {
            success: true,
            response: "Message processed successfully! (Artifact parsing would happen here)",
            model: "GPT-4o",
            processing_time: 2.5
        };
    }
    
    /**
     * Get available models from GitHub Models catalog
     */
    async getAvailableModels() {
        // This would call the GitHub Models catalog API
        // For now, return configured models
        const endpoint = 'https://models.github.ai/catalog/models';
        
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github+json'
                }
            });
            
            if (response.ok) {
                const models = await response.json();
                return models.map(model => ({
                    id: model.id,
                    name: model.name,
                    publisher: model.publisher,
                    capabilities: model.capabilities,
                    rateLimitTier: model.rate_limit_tier,
                    maxInputTokens: model.limits?.max_input_tokens,
                    maxOutputTokens: model.limits?.max_output_tokens
                }));
            }
        } catch (error) {
            console.warn('Failed to fetch models from catalog:', error);
        }
        
        // Fallback to default models
        return [
            { id: 'gpt-4o', name: 'GPT-4o', publisher: 'OpenAI', rateLimitTier: 'high' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', publisher: 'OpenAI', rateLimitTier: 'high' },
            { id: 'DeepSeek-R1', name: 'DeepSeek-R1', publisher: 'DeepSeek', rateLimitTier: 'medium' },
            { id: 'Llama-3.3-70b-Instruct', name: 'Llama 3.3 70B', publisher: 'Meta', rateLimitTier: 'medium' },
            { id: 'Phi-3.5-mini-instruct', name: 'Phi-3.5 Mini', publisher: 'Microsoft', rateLimitTier: 'low' },
            { id: 'Mistral-large-2407', name: 'Mistral Large', publisher: 'Mistral AI', rateLimitTier: 'medium' },
            { id: 'Cohere-command-r-plus', name: 'Cohere Command R+', publisher: 'Cohere', rateLimitTier: 'medium' },
            { id: 'AI21-Jamba-1.5-Large', name: 'AI21 Jamba 1.5', publisher: 'AI21', rateLimitTier: 'medium' }
        ];
    }
    
    /**
     * Utility: Sleep/delay function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize API instance
const api = new GitHubAPI(APP_CONFIG);
