import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api', // Point to backend
    headers: {
        'Content-Type': 'application/json'
    }
});

export const runAgent = async (data) => {
    const response = await api.post('/run-agent', data);
    return response.data;
};

export const getAgentStatus = async (id) => {
    const response = await api.get(`/status/${id}`);
    return response.data;
};

export const getAgentResults = async (id) => {
    const response = await api.get(`/results/${id}`);
    return response.data;
};

export default api;
