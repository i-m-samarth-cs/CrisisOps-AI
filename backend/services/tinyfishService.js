const axios = require('axios');

class TinyfishService {
    constructor() {
        this.apiKey = process.env.TINYFISH_API_KEY;
        this.baseUrl = 'https://agent.tinyfish.ai/v1/automation'; 
        
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'X-API-Key': this.apiKey,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Executes a task using the TinyFish agent API via SSE manually or simulated
     * @param {Object} payload { url, goal }
     * @param {Function} onProgress Callback for streaming logs
     */
    async submitAgentTaskStreaming(payload, onProgress) {
        console.log("Submitting task to Tinyfish API with payload:", payload);
        
        if (!this.apiKey || this.apiKey === 'your_tinyfish_api_key_here') {
            console.warn("Using mock TinyFish response because TINYFISH_API_KEY is missing or invalid.");
            return this.simulateMockStreaming(payload, onProgress);
        }

        try {
            // Because SSE can be tricky to map to a standard REST response without specific parsing,
            // we'll consume the stream chunks from Axios
            const response = await this.client.post('/run-sse', payload, {
                responseType: 'stream'
            });
            
            return new Promise((resolve, reject) => {
                let finalData = null;
                
                response.data.on('data', (chunk) => {
                    const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const dataStr = line.replace('data: ', '').trim();
                                if (dataStr === '[DONE]') {
                                    continue; // End of stream
                                }
                                const data = JSON.parse(dataStr);
                                
                                // Call webhook/progress cb with current state
                                if (onProgress) onProgress(data);
                                
                                // Collect final results if present
                                if (data.status === 'completed' || data.results) {
                                    finalData = data;
                                }
                            } catch(e) { /* ignore parse error on partial chunks if any */ }
                        }
                    }
                });
                
                response.data.on('end', () => resolve(finalData || { status: 'completed' }));
                response.data.on('error', (err) => reject(err));
            });
        } catch (error) {
            console.error('Error submitting TinyFish task:', error);
            throw new Error('Failed to run TinyFish agent');
        }
    }

    async simulateMockStreaming(payload, onProgress) {
        const mockSteps = [
            `Navigating to ${payload.url}...`,
            'Analyzing page structure...',
            'Extracting availability and contact data...',
            'Filling out emergency request forms...',
            'Finalizing submission...'
        ];

        for (let i = 0; i < mockSteps.length; i++) {
            await new Promise(res => setTimeout(res, 2000));
            onProgress({ status: 'running', message: mockSteps[i] });
        }

        const mockResults = [
            { name: 'City Hospital', availability: '2 ICU Beds', contact: '555-1234', location: 'Downtown' },
            { name: 'Red Cross Relief', availability: '150 Beds', contact: 'http://redcross.org', location: 'Uptown' }
        ];

        return { status: 'completed', results: mockResults };
    }
}

module.exports = new TinyfishService();
