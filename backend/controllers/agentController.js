const Job = require('../models/Job');
const tinyfishService = require('../services/tinyfishService');

exports.runAgent = async (req, res) => {
    try {
        const { location, crisisType, requirement } = req.body;

        if (!location || !crisisType || !requirement) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Create a tracking job in our database
        const job = new Job({ location, crisisType, requirement, status: 'running' });
        await job.save();

        // 2. Define the exact goal for TinyFish
        const goalPrompt = `Identify and navigate websites relevant to the ${crisisType} crisis in ${location}. Your objective is to find: ${requirement}. Extract detailed provider name, availability status, and contact information into JSON. If you find an emergency request form, fill it out with generic details and submit. Return final result as JSON array.`;
        
        // Let's use a dummy URL for the initial entry point, or construct a dynamic search URL
        const startUrl = `https://google.com/search?q=${encodeURIComponent(`${requirement} available in ${location}`)}`;

        const payload = {
            url: startUrl,
            goal: goalPrompt
        };

        job.logs.push({ message: `Agent launched successfully. Target: Find ${requirement} in ${location}.` });
        await job.save();

        // 3. Kick off Tinyfish in background asynchronously
        startTinyFishWorkflow(job, payload);

        res.status(202).json({
            message: 'Agent workflow initiated',
            jobId: job._id
        });

    } catch (error) {
        console.error('Error starting agent:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

async function startTinyFishWorkflow(job, payload) {
    try {
        // Stream progress updates from Tinyfish directly into our MongoDB job
        const finalResults = await tinyfishService.submitAgentTaskStreaming(payload, async (progressData) => {
            if (progressData.message) {
                job.logs.push({ message: progressData.message });
                await job.save();
            }
        });

        // Finished
        job.status = 'completed';
        job.logs.push({ message: 'Agent completed operations successfully.' });
        if (finalResults && finalResults.results) {
            job.results = finalResults.results;
        } else {
            job.results = [finalResults]; // fallback just in case
        }
        await job.save();

    } catch (err) {
        job.status = 'failed';
        job.logs.push({ message: `Agent failed: ${err.message}` });
        await job.save();
    }
}

// Polling endpoint for frontend
exports.getAgentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.status(200).json(job);
    } catch (error) {
        console.error('Error checking agent status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.getAgentResults = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.status(200).json(job.results || []);
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
