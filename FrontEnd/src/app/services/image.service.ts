import { Injectable, signal } from '@angular/core';
import { Photo } from '../models/image.model';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class PhotoService {
    constructor(private http: HttpClient) { }
    private photos: Photo[] = [
        { id: 1, url: 'assets/images/plate1.jpeg', title: 'JRB 9987', description: 'At 3 January 2025.', author: 'Honda Accord', width: 960, height: 1280 },
        { id: 2, url: 'assets/images/plate2.jpeg', title: 'SLR 9987 G', description: 'At 24 January 2025.', author: 'Hundai ', width: 960, height: 1280 },
        { id: 3, url: 'assets/images/plate3.jpeg', title: 'RAP 9987', description: 'At 16 August 2024.', author: 'Perodua Aruz', width: 960, height: 1280 },
        { id: 4, url: 'assets/images/plate4.jpeg', title: 'VAB 9987', description: 'At 9 Febraury 2025.', author: 'Kia ', width: 960, height: 1280 },
        { id: 5, url: 'assets/images/plate5.jpeg', title: 'JLW 9987', description: 'At 10 February 2025.', author: 'Perodua Viva', width: 960, height: 1280 },
        { id: 6, url: 'assets/images/plate6.jpeg', title: 'JUB 9987', description: 'At 11 December 2023.', author: 'Toyota Yaris', width: 960, height: 1280 },
        { id: 7, url: 'assets/images/plate7.jpeg', title: 'JQL 9987', description: 'At 22 October 2023.', author: 'Perodua Alza', width: 960, height: 1280 },
    ];

    photos$ = signal<Photo[]>(this.photos);


    // Chatwoot Configuration
    private inboxIdentifier = 'T7EXL7pPdLeXxty1b7wzEYyw';
    private baseUrl = 'https://app.chatwoot.com';
    private sourceId: string | null = null;
    private conversationId: number | null = null;

    // Chat State
    messages = signal<any[]>([]);

    // 1. Create Contact (User)
    createContact(name: string, email: string) {
        return this.http.post<any>(`${this.baseUrl}/public/api/v1/inboxes/${this.inboxIdentifier}/contacts`, {
            name,
            email
        }).pipe(
            tap(res => {
                this.sourceId = res.source_id;
                if (res.pubsub_token) {
                    this.connectToCable(res.pubsub_token);
                }
            })
        );
    }

    // 2. Create Conversation
    createConversation() {
        if (!this.sourceId) {
            console.error('Source ID missing. Create contact first.');
            return;
        }
        return this.http.post<any>(`${this.baseUrl}/public/api/v1/inboxes/${this.inboxIdentifier}/contacts/${this.sourceId}/conversations`, {})
            .pipe(tap(res => this.conversationId = res.id));
    }

    // 3. Send Message
    sendMessage(content: string) {
        if (!this.sourceId || !this.conversationId) {
            console.error('Session not initialized. Contact or Conversation missing.');
            return;
        }
        // Optimistic update
        this.messages.update(msgs => [...msgs, { content, sender_type: 'Contact', created_at: Date.now() }]);

        return this.http.post(`${this.baseUrl}/public/api/v1/inboxes/${this.inboxIdentifier}/contacts/${this.sourceId}/conversations/${this.conversationId}/messages`, {
            content
        });
    }

    // 4. WebSocket (ActionCable)
    connectToCable(pubsubToken: string) {
        const wsUrl = `wss://app.chatwoot.com/cable?pubsub_token=${pubsubToken}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('Connected to Chatwoot WebSocket');
            const subscribeMsg = {
                command: "subscribe",
                identifier: JSON.stringify({
                    channel: "RoomChannel",
                    pubsub_token: pubsubToken
                })
            };
            socket.send(JSON.stringify(subscribeMsg));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'ping') return;

            // Handle different message types
            if (data.message) {
                console.log('New Message:', data.message);
                if (data.message.event === 'message.created') {
                    const msg = data.message.data;
                    // message_type 0 = user (us), 1 = agent
                    // We only want to push agent messages, or sync everything?
                    // Let's rely on websocket for agent messages.
                    if (msg.message_type === 1) {
                        this.messages.update(msgs => [...msgs, {
                            content: msg.content,
                            sender_type: 'Agent',
                            created_at: msg.created_at
                        }]);
                    }
                }
            }
        };

        socket.onerror = (error) => console.error('WebSocket Error:', error);
    }
}