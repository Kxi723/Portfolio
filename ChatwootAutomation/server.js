/**
 * @file Chatwoot Webhook Automation Server.
 * Listens for incoming Chatwoot webhooks and automatically assigns 
 * conversations to specific teams based on message content.
 */

// -------------------------------------------------
// Import Modules
// -------------------------------------------------
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

/**
 * Port configuration for the Express server.
 * This port should be exposed publicly for Chatwoot to send webhooks.
 * (via ngrok: https://joye-unflagging-albertine.ngrok-free.dev/)
 * @type {number}
 */
const PORT = 3000;

const app = express();

// Use 'body-parser' middleware to parse JSON requests
app.use(bodyParser.json());

// -------------------------------------------------
// Chatwoot API Configuration
// -------------------------------------------------
require('dotenv').config();
const API_ACCESS_TOKEN = process.env.API_ACCESS_TOKEN;
const APP_HOST = 'https://app.chatwoot.com';
const ACCOUNT_ID = process.env.ACCOUNT_ID;

/**
 * Axios instance pre-configured with the Chatwoot base URL
 * and required authentication headers.
 */
const api = axios.create({
    baseURL: `${APP_HOST}/api/v1/accounts/${ACCOUNT_ID}`,
    headers: {
        'api_access_token': API_ACCESS_TOKEN,
        'Content-Type': 'application/json'
    }
});

/**
 * Analyzes the content of an incoming message to determine 
 * the appropriate team assignment.
 * @param {string} message - The content of the received message.
 * @returns { teamID } - The team ID or undefined if no rules match.
 */
const teamMatching = (message) => {
    // Convert to lowercase for case-insensitive matching
    const content = message.toLowerCase();

    if (content.includes('camera') || content.includes('lens')) {
        return 11193;
    }

    if (content.includes('how much') || content.includes('price')) {
        return 11257;
    }

    // Return undefined if no match found
    return;
};

/**
 * Assigns a conversation to a specific team based on the first message received.
 * @param {number} userID - The unique identifier of the Chatwoot conversation.
 * @param {string} message - The content of the incoming message to analyze.
 * @param {string} userName - The user name displayed in the incoming message.
 * @returns {Promise<void>} Resolves when the assignment is complete or if assignment is skipped.
 */
const assignTeam = async (userID, message, userName) => {
    try {
        // Fetch conversation details to check its current routing status
        const payload = await api.get(`/conversations/${userID}`);
        const teamData = payload.data.meta || {};

        // Only assign if not already assigned to a team
        if (!teamData.team) {
            const teamID = teamMatching(message);

            if (teamID) {
                // Assign the team
                await api.post(`/conversations/${userID}/assignments`, { team_id: teamID });
                console.log(`>> Assigning '${userName}' successfully.`);
            }
            else { console.log('<< No matching team found.'); }
        }
        else {
            console.log(`<< '${userName}' has already been assigned to '${teamData.team.name}'.`);
        }
    }

    catch (error) {
        console.error('>> Error:', error.message);
    }
};


/**
 * Webhook endpoint for capturing Chatwoot events.
 * Listens for new messages and triggers the automated assignment logic.
 * @name POST /customlink
 * @function
 * @param {express.Request} req - Express request object containing the Chatwoot event payload.
 * @param {express.Response} res - Express response object for acknowledging the webhook.
 */
app.post('/customlink', (req, res) => {
    // Events & URL are set at Chatwoot -> Settings -> Integrations.
    // Online Source: https://www.chatwoot.com/hc/user-guide/articles/1677693021-how-to-use-webhooks

    // Ensure these data won't changed within the execution
    const data = req.body;
    const userName = data.sender?.name ?? 'Unknown';
    const userID = data.conversation?.id;
    const message = data.content ?? '';

    console.log("<< Received event:", data.event);

    // Only process incoming messages. Ignore outgoing/agent messages.
    if (data.message_type != 'incoming') {
        return res.send();
    }

    console.log(`<< Received new message from '${userName}'.`);

    assignTeam(userID, message || '', userName);

    res.send();
});

/**
 * Initializes and starts the Express HTTP server.
 */
app.listen(PORT, () => {
    console.log(`>> Server is running on http://localhost:${PORT}`);
});