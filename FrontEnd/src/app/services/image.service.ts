import { Injectable, signal } from '@angular/core';
import { Photo } from '../models/image.model';

@Injectable({
    providedIn: 'root',
})
export class PhotoService {
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
}
