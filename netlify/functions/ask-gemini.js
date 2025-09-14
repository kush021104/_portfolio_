// This function will run on Netlify's servers, not in the browser.
// It acts as a secure proxy to the Google Gemini API.
const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function (event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    // Get the API key from environment variables.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API key is not configured on the server.' }),
        };
    }

    try {
        // Parse the user's query from the incoming request body.
        const body = JSON.parse(event.body);
        const userQuery = body.query; // Correctly extract the query string

        if (!userQuery) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Query is missing from the request body.' }),
            };
        }
        
        // Initialize the Google AI SDK
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        // --- FIX 1: Pass only the userQuery string to generateContent ---
        const result = await model.generateContent(userQuery);
        const geminiResponse = result.response;
        const generatedText = geminiResponse.text();

        if (!generatedText) {
             return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Received an invalid response structure from Google API.' }),
            };
        }

        // --- FIX 2: Send the successful response back using the "response" key ---
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response: generatedText }),
        };

    } catch (error) {
        console.error('Error in serverless function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "An internal server error occurred." }),
        };
    }
};

