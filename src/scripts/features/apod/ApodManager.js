import { NasaService } from '../../services/NasaService.js';

class ApodManager {
    constructor() {
        this.apodContainer = document.querySelector('.apod-container');
        this.apodImage = document.querySelector('.apod-image');
        this.apodTitle = document.querySelector('.apod-title');
        this.apodDescription = document.querySelector('.apod-description');
        this.apodDate = document.querySelector('.apod-date');
    }

    async initialize() {
        try {
            await this.loadAPODData();
        } catch (error) {
            console.error('Failed to initialize APOD Manager:', error);
            this.showError('Failed to load astronomy picture. Please try again later.');
        }
    }

    async loadAPODData() {
        try {
            const data = await NasaService.getAPOD();
            console.log('APOD Data received:', data); // Debug log

            if (data && data.url) {
                if (data.media_type === 'video') {
                    // Handle video content
                    this.apodImage.innerHTML = `
                        <iframe 
                            src="${data.url}"
                            frameborder="0"
                            allowfullscreen
                            class="video-content"
                        ></iframe>`;
                } else {
                    // Handle image content
                    console.log('Setting image URL:', data.url); // Debug log
                    this.apodImage.style.cssText = `
                        background-image: url('${data.url}');
                        background-size: cover;
                        background-position: center;
                        min-height: 400px;
                        border-radius: 10px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    `;
                }

                // Update text content
                this.apodTitle.textContent = data.title || 'Astronomy Picture of the Day';
                this.apodDescription.textContent = data.explanation || 'No description available.';
                this.apodDate.textContent = data.date ? 
                    new Date(data.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : '';
            } else {
                throw new Error('Invalid APOD data received');
            }
        } catch (error) {
            console.error('Error loading APOD data:', error);
            this.showError('Error loading astronomy picture');
        }
    }

    showError(message) {
        if (this.apodContainer) {
            this.apodContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${message}</p>
                </div>
            `;
        }
    }
}

export default ApodManager;