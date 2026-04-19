/**
 * Application Configuration
 * IMPORTANT: Replace these values with your actual GitHub details
 */

const APP_CONFIG = {
    // GitHub Repository Configuration
    github: {
        owner: 'YOUR_GITHUB_USERNAME',      // Replace with your GitHub username
        repo: 'github-models-ai-chatbot',    // Your repository name
        token: 'YOUR_GITHUB_PAT_TOKEN'       // Your Personal Access Token (with repo scope)
    },
    
    // Application Settings
    app: {
        name: 'AI ChatBot',
        version: '1.0.0',
        defaultModel: 'gpt-4o',
        maxHistoryItems: 50,
        autoSaveChat: true,
        debugMode: false  // Set to true for console logging
    },
    
    // API Endpoints
    api: {
        baseUrl: 'https://api.github.com',
        dispatchEndpoint: (owner, repo) => `/repos/${owner}/${repo}/dispatches`,
        workflowRunsEndpoint: (owner, repo) => `/repos/${owner}/${repo}/actions/runs`,
        workflowArtifactsEndpoint: (owner, repo, runId) => `/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`
    },
    
    // UI Defaults
    ui: {
        theme: 'light',  // 'light' or 'dark'
        language: 'fa',  // 'fa' for Persian, 'en' for English
        temperature: 0.7,
        maxTokens: 1000
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}
