import { NasaService } from '../../services/NasaService.js';

class EventsManager {
    constructor() {
        this.events = {
            solarFlare: [],
            geoStorm: [],
            cme: []
        };
        this.setupScrollButtons();
    }

    setupScrollButtons() {
        document.querySelectorAll('.scroll-btn').forEach(button => {
            button.addEventListener('click', () => {
                const container = button.closest('.events-rows-container');
                const rows = container.querySelectorAll('.events-row');
                const direction = button.classList.contains('left') ? -1 : 1;
                const scrollAmount = 300; // Adjust based on card width

                rows.forEach(row => {
                    row.scrollBy({
                        left: direction * scrollAmount,
                        behavior: 'smooth'
                    });
                });
            });
        });
    }

    async initialize() {
        try {
            await this.fetchAllEvents();
            this.displayEvents();
        } catch (error) {
            console.error('Failed to initialize Events Manager:', error);
            this.showError('Failed to load space events. Please try again later.');
        }
    }

    async fetchAllEvents() {
        try {
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            
            const startDate = thirtyDaysAgo.toISOString().split('T')[0];
            const endDate = today.toISOString().split('T')[0];
    
            console.log('Fetching events for date range:', { startDate, endDate });
    
            const [solarFlares, geoStorms, cmeData] = await Promise.all([
                NasaService.getSolarFlares(startDate, endDate),
                NasaService.getGeomagneticStorms(startDate, endDate),
                NasaService.getCME(startDate, endDate)
            ]);
    
            console.log('Raw data received:', {
                solarFlares,
                geoStorms,
                cmeData
            });
    
            if (Array.isArray(solarFlares)) {
                this.events.solarFlare = this.processSolarFlareData(solarFlares);
            }
            if (Array.isArray(geoStorms)) {
                this.events.geoStorm = this.processGeoStormData(geoStorms);
                console.log('Processed geoStorm data:', this.events.geoStorm);
            }
            if (Array.isArray(cmeData)) {
                this.events.cme = this.processCMEData(cmeData);
            }
    
            console.log('Final processed events:', this.events);
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }

    processSolarFlareData(data) {
        return data.map(flare => ({
            type: 'solarFlare',
            title: `Solar Flare ${flare.classType || 'Event'}`,
            date: flare.beginTime || flare.peakTime,
            description: this.formatFlareDescription(flare),
            impact: this.calculateFlareImpact(flare)
        })).filter(event => event.date && event.title);
    }

    processGeoStormData(data) {
        return data.map(storm => ({
            type: 'geoStorm',
            title: `Geomagnetic Storm`,
            date: storm.startTime,
            description: this.formatStormDescription(storm),
            impact: this.calculateStormImpact(storm)
        })).filter(event => event.date && event.title);
    }

    processCMEData(data) {
        return data.map(cme => ({
            type: 'cme',
            title: 'Coronal Mass Ejection',
            date: cme.startTime,
            description: this.formatCMEDescription(cme),
            impact: this.calculateCMEImpact(cme)
        })).filter(event => event.date && event.title);
    }

    formatFlareDescription(flare) {
        return `Class: ${flare.classType || 'Unknown'}\n` +
               `Duration: ${this.formatDuration(flare.beginTime, flare.endTime)}\n` +
               `Source: ${flare.sourceLocation || 'Unknown location'}`;
    }

    formatStormDescription(storm) {
        return `KP Index: ${storm.kpIndex || 'Unknown'}\n` +
               `Duration: ${this.formatDuration(storm.startTime, storm.endTime)}\n` +
               `Type: ${storm.type || 'General storm activity'}`;
    }

    formatCMEDescription(cme) {
        return `Speed: ${cme.speed || 'Unknown'} km/s\n` +
               `Type: ${cme.type || 'Standard'}\n` +
               `Duration: ${this.formatDuration(cme.startTime, cme.endTime)}`;
    }

    calculateFlareImpact(flare) {
        const classMap = { 'X': 'High', 'M': 'Medium', 'C': 'Low' };
        const flareClass = flare.classType?.[0] || 'C';
        return classMap[flareClass] || 'Low';
    }

    calculateStormImpact(storm) {
        const kpIndex = parseInt(storm.kpIndex) || 0;
        if (kpIndex >= 7) return 'High';
        if (kpIndex >= 5) return 'Medium';
        return 'Low';
    }

    calculateCMEImpact(cme) {
        const speed = parseInt(cme.speed) || 0;
        if (speed >= 1000) return 'High';
        if (speed >= 500) return 'Medium';
        return 'Low';
    }

    formatDuration(start, end) {
        if (!start || !end) return 'Duration unknown';
        try {
            const startDate = new Date(start);
            const endDate = new Date(end);
            const hours = Math.round((endDate - startDate) / (1000 * 60 * 60));
            return `${hours} hours`;
        } catch (error) {
            return 'Duration unknown';
        }
    }

    splitIntoRows(events) {
        if (!Array.isArray(events)) return [[], []];
        const midpoint = Math.ceil(events.length / 2);
        return [
            events.slice(0, midpoint),
            events.slice(midpoint)
        ];
    }

    displayEvents() {
        const categories = ['solarFlare', 'geoStorm', 'cme'];
        
        categories.forEach(category => {
            const events = this.events[category] || [];
            const [row1Events, row2Events] = this.splitIntoRows(events);
            
            const row1Element = document.querySelector(`[data-type="${category}-row1"]`);
            const row2Element = document.querySelector(`[data-type="${category}-row2"]`);
            
            if (row1Element) {
                row1Element.innerHTML = row1Events.map(event => this.createEventCard(event)).join('');
            }
            if (row2Element) {
                row2Element.innerHTML = row2Events.map(event => this.createEventCard(event)).join('');
            }
        });
    }

    createEventCard(event) {
        const eventDate = new Date(event.date);
        const timeRemaining = this.getTimeRemaining(eventDate);

        return `
            <li class="event-card" data-type="${event.type}">
                <div class="event-type-icon">
                    <i class="fas ${this.getEventIcon(event.type)}" aria-hidden="true"></i>
                </div>
                <h3 class="event-title">${event.title}</h3>
                <p class="event-description">${event.description}</p>
                <div class="event-details">
                    <div class="event-date">
                        <i class="far fa-calendar" aria-hidden="true"></i>
                        <span>${eventDate.toLocaleDateString()}</span>
                    </div>
                    <div class="event-countdown ${timeRemaining.expired ? 'expired' : ''}">
                        <i class="far fa-clock" aria-hidden="true"></i>
                        <span>${timeRemaining.text}</span>
                    </div>
                    ${event.impact ? `
                        <div class="event-impact impact-${event.impact.toLowerCase()}">
                            <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
                            <span>Impact: ${event.impact}</span>
                        </div>
                    ` : ''}
                </div>
            </li>
        `;
    }

    getEventIcon(type) {
        switch (type) {
            case 'solarFlare': return 'fa-sun';
            case 'geoStorm': return 'fa-bolt';
            case 'cme': return 'fa-broadcast-tower';
            default: return 'fa-star';
        }
    }

    getTimeRemaining(date) {
        const now = new Date();
        const difference = date - now;

        if (difference < 0) {
            return { expired: true, text: 'Event has passed' };
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
            return { expired: false, text: `${days} days ${hours} hours` };
        }
        return { expired: false, text: `${hours} hours remaining` };
    }

    showError(message) {
        const categories = ['solarFlare', 'geoStorm', 'cme'];
        categories.forEach(category => {
            const rows = document.querySelectorAll(`[data-type="${category}-row1"], [data-type="${category}-row2"]`);
            rows.forEach(row => {
                if (row) {
                    row.innerHTML = `
                        <li class="error-message">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>${message}</p>
                        </li>
                    `;
                }
            });
        });
    }
}

export default EventsManager;