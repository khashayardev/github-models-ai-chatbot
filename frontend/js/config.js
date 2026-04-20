/**
 * Application Configuration File
 * IMPORTANT: Replace the placeholder values with your actual GitHub details
 */

const APP_CONFIG = {
    // GitHub Repository Configuration
    github: {
        // Your GitHub username (e.g., 'khashayar')
        owner: 'YOUR_GITHUB_USERNAME',
        
        // Name of the repository you created (e.g., 'github-models-ai-chatbot')
        repo: 'github-models-ai-chatbot',
        
        // Your Personal Access Token with 'repo' scope
        // Get it from: https://github.com/settings/tokens
        token: 'ghp_xxxxxxxxxxxx'
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
        modelsEndpoint: 'https://models.inference.ai.azure.com/models'
    },
    
    // UI Defaults
    ui: {
        theme: 'light',  // 'light' or 'dark'
        language: 'fa',  // 'fa' for Persian, 'en' for English
        temperature: 0.7,
        maxTokens: 1000
    }
};

// Do not modify below this line
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}
