const express = require('express');
const app = express();

// define a port that ngrok can public it then chatwoot backend can listen to it
const port = 3000;

const bodyParser = require('body-parser');
const axios = require('axios');

/** 
 * Port configuration for the Express server.
 * This port should be exposed publicly for Chatwoot to send webhooks.
 * (via ngrok: https://joye-unflagging-albertine.ngrok-free.dev/)
 * @type {number} 
 */
const port = 3000;

const app = express();

// Use 'body-parser' middleware to parse incoming JSON requests
app.use(bodyParser.json());

const API_ACCESS_TOKEN = '2s14c6WNKQKJw44MCzAxm9wh';
const APP_HOST = 'https://app.chatwoot.com';
const ACCOUNT_ID = 151642;

// Axios instance with default headers
const api = axios.create({
    baseURL: `${APP_HOST}/api/v1/accounts/${ACCOUNT_ID}`,
    headers: {
        'api_access_token': API_ACCESS_TOKEN,
        'Content-Type': 'application/json'
    }
});

const teamIDs = {
    team1: 11193,
    team2: 11257
};

const getTeamToBeAssignedTo = (messageContent) => {
    const content = messageContent.toLowerCase(); // Convert to lowercase for case-insensitive matching

    if (content.includes('abc') || content.includes('test') || content.includes('price')) {
        return {
            teamId: teamIDs.team1,
            label: ['banned'],
        };
    }

    if (content.includes('123') || content.includes('test123') || content.includes('abc123')) {
        return {
            teamId: teamIDs.team2,
            label: ['test123']
        };
    }

    return {}; // Return empty object if no match found
};

const setConversationTeamAndLabel = async (conversationId, messageContent) => {
    try {
        console.log(`>> Processing conversation ${conversationId}...`);

        // Get conversation details
        // GET /api/v1/accounts/{account_id}/conversations/{conversation_id}
        const convResponse = await api.get(`/conversations/${conversationId}`);
        const meta = convResponse.data.meta || {};

        // Only assign if not already assigned to a team
        if (!meta.team) {
            const { teamId, label } = getTeamToBeAssignedTo(messageContent);

            if (teamId) {
                console.log(`>> Assigning conversation ${conversationId} to team ${teamId} with label ${label}`);

                // Assign Team
                // POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/assignments
                await api.post(`/conversations/${conversationId}/assignments`, {
                    team_id: teamId
                });

                // Add Labels
                // POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/labels
                if (label && label.length > 0) {
                    await api.post(`/conversations/${conversationId}/labels`, {
                        labels: label
                    });
                }

                console.log('>> Assignment successful');
            } else {
                console.log('No matching team found for message content.');
            }
        } else {
            console.log(`Conversation ${conversationId} already assigned to team ${meta.team.id}`);
        }
    } catch (error) {
        if (error.response) {
            console.error('Error processing conversation:', error.response.status, error.response.data);
        } else {
            console.error('Error processing conversation:', error.message);
        }
    }
};

/**
 * Webhook endpoint for capturing Chatwoot events.
 * Listens for new messages and triggers the automated assignment logic.
 * 
 * @name POST /webhook
 * @function
 * @param {express.Request} req - Express request object containing the Chatwoot event payload.
 * @param {express.Response} res - Express response object for acknowledging the webhook.
 */
app.post('/webhook', (req, res) => {
    const data = req.body;
    console.log(">> Received event:", data.event);

    const { conversation: { id: conversationId }, message_type: messageType, content } = req.body;

    if (messageType !== 'incoming') {
        console.log("stop here.")
        return res.send();
    }

    console.log(`>> Received new message from ID ${conversationId}: ${content}`);

    // Process async but respond immediately to avoid timeout
    setConversationTeamAndLabel(conversationId, content || '');

    res.send();
});


/**
 * Initializes and starts the Express HTTP server.
 */
app.listen(port, () => {
    console.log(`>> Server is running on http://localhost:${port}`);
});
