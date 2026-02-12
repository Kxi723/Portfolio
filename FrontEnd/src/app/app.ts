import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PhotoService } from './services/image.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('FrontEnd');

  private photoService = inject(PhotoService);

  photos = this.photoService.photos$;

}