import { Component, signal, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PhotoService } from './services/image.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('FrontEnd');

  private photoService = inject(PhotoService);

  // Chat Logic
  chatMessage = signal('');
  messages = this.photoService.messages;
  photos = this.photoService.photos$;

  ngOnInit() {
    // Unique user for demo purposes
    const uniqueEmail = `user_$${Math.floor(Math.random() * 10000)}@example.com`;
    this.photoService.createContact('Demo User', uniqueEmail).subscribe({
      next: () => {
        console.log('Contact created');
        this.photoService.createConversation()?.subscribe(() => console.log('Conversation started'));
      },
      error: (err) => console.error('Failed to init Chatwoot', err)
    });
  }

  sendMessage() {
    const msg = this.chatMessage().trim();
    if (msg) {
      this.photoService.sendMessage(msg)?.subscribe();
      this.chatMessage.set('');
    }
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      this.chatMessage.set(input.value);
    }
  }
}