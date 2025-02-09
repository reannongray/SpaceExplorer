import ParticleSystem from './features/effects/ParticleSystem.js';
import ApodManager from './features/apod/ApodManager.js';
import EventsManager from './features/events/EventsManager.js';
import MissionsManager from './features/missions/MissionsManager.js';

class App {
    #particleSystem;
    #apodManager;
    #eventsManager;
    #missionsManager;


    async initialize() {
        try {
            // Initialize particle system
            this.#particleSystem = new ParticleSystem();
            await this.#particleSystem.init();

            // Initialize other managers only if particles are working
            if (this.#particleSystem) {
                this.#apodManager = new ApodManager();
                await this.#apodManager.initialize();

                this.#eventsManager = new EventsManager();
                await this.#eventsManager.initialize();

                this.#missionsManager = new MissionsManager();
                await this.#missionsManager.initialize();
            }
        } catch (error) {
            console.error('Error initializing application:', error);
        }
    }

    static async start() {
        const app = new App();
        await app.initialize();
        return app;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    App.start().catch(error => {
        console.error('Failed to start application:', error);
    });
});