import { NasaService } from '../../services/NasaService.js';

class MissionsManager {
    constructor() {
        this.timelineContent = document.getElementById('mission-content');
        this.timelineControls = document.querySelectorAll('.timeline-controls button');
        this.activeTimeframe = 'present';
        this.missions = {
            past: [],
            present: [],
            future: []
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.timelineControls?.forEach(button => {
            button.addEventListener('click', () => {
                this.activeTimeframe = button.dataset.time;
                this.updateActiveTimeframe();
                this.displayMissions();
            });
        });

        // Add scroll buttons event listeners
        const leftScroll = document.querySelector('.missions-timeline .scroll-btn.left');
        const rightScroll = document.querySelector('.missions-timeline .scroll-btn.right');
        
        if (leftScroll && this.timelineContent) {
            leftScroll.addEventListener('click', () => {
                this.timelineContent.scrollBy({ left: -300, behavior: 'smooth' });
            });
        }
        
        if (rightScroll && this.timelineContent) {
            rightScroll.addEventListener('click', () => {
                this.timelineContent.scrollBy({ left: 300, behavior: 'smooth' });
            });
        }
    }

    updateActiveTimeframe() {
        this.timelineControls?.forEach(button => {
            button.classList.toggle('active', button.dataset.time === this.activeTimeframe);
            button.setAttribute('aria-selected', button.dataset.time === this.activeTimeframe);
        });
    }

    async initialize() {
        try {
            this.showLoading();
            await this.fetchMissionData();
            this.displayMissions();
        } catch (error) {
            console.error('Failed to initialize Missions Manager:', error);
            this.showError('Failed to load mission data. Please try again later.');
        }
    }

    async fetchMissionData() {
        try {
            const [pastMissions, currentMissions, upcomingMissions, marsData] = await Promise.all([
                NasaService.getPastMissions(),
                NasaService.getCurrentMissions(),
                NasaService.getUpcomingMissions(),
                NasaService.getMarsRoverPhotos()
            ]);

            // Clear existing missions
            this.missions = {
                past: [],
                present: [],
                future: []
            };

            // Process past missions
            this.missions.past = pastMissions.map(mission => ({
                id: mission.id || mission.name.toLowerCase().replace(/\s+/g, '-'),
                title: mission.name,
                description: mission.description || 'Historic NASA mission',
                status: 'completed',
                lastUpdate: mission.endDate || mission.startDate,
                image: mission.image,
                type: mission.type || 'spacecraft',
                target: mission.target || 'Space',
                infoLink: mission.infoLink
            }));

            // Process current missions
            this.missions.present = currentMissions.map(mission => ({
                id: mission.name.toLowerCase().replace(/\s+/g, '-'),
                title: mission.name,
                description: mission.description,
                status: mission.status.toLowerCase(),
                lastUpdate: mission.startDate,
                image: mission.image,
                type: mission.type.toLowerCase(),
                target: mission.target || 'Space',
                infoLink: mission.infoLink
            }));

            // Add Mars rover if we have recent photos
            if (marsData?.latest_photos?.length > 0) {
                const latestPhoto = marsData.latest_photos[0];
                this.missions.present.push({
                    id: 'mars-rover',
                    title: `${latestPhoto.rover.name} Rover Mission`,
                    description: `Latest images from ${latestPhoto.rover.name} rover on Mars`,
                    status: 'active',
                    lastUpdate: latestPhoto.earth_date,
                    image: latestPhoto.img_src,
                    type: 'rover',
                    target: 'Mars',
                    infoLink: 'https://mars.nasa.gov/mars2020/'
                });
            }

            // Process upcoming missions
            this.missions.future = upcomingMissions.map(mission => ({
                id: mission.name.toLowerCase().replace(/\s+/g, '-'),
                title: mission.name,
                description: mission.description,
                status: 'planned',
                lastUpdate: mission.startDate,
                image: mission.image,
                type: mission.type.toLowerCase(),
                target: mission.target || 'Space',
                infoLink: mission.infoLink
            }));

            // Sort all mission arrays by date
            ['past', 'present', 'future'].forEach(timeframe => {
                this.missions[timeframe].sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
            });
        } catch (error) {
            console.error('Error fetching mission data:', error);
            throw error;
        }
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Date unavailable';
        }
    }

    getStatusIcon(status) {
        const icons = {
            active: 'fa-satellite-dish',
            completed: 'fa-check-circle',
            planned: 'fa-rocket',
            'in progress': 'fa-spinner fa-spin'
        };
        return icons[status.toLowerCase()] || 'fa-question-circle';
    }

    getMissionTypeIcon(type) {
        const icons = {
            rover: 'fa-robot',
            spacecraft: 'fa-satellite',
            telescope: 'fa-telescope',
            'space telescope': 'fa-telescope',
            'human spaceflight': 'fa-user-astronaut',
            satellite: 'fa-satellite'
        };
        return icons[type.toLowerCase()] || 'fa-space-shuttle';
    }

    createMissionCard(mission) {
        const card = document.createElement('div');
        card.className = 'mission-card glass-panel';
        card.dataset.status = mission.status;
        card.dataset.type = mission.type;

        const statusIcon = this.getStatusIcon(mission.status);
        const formattedDate = this.formatDate(mission.lastUpdate);

        card.innerHTML = `
            <div class="mission-image" style="background-image: url('${mission.image}')">
                <div class="mission-status ${mission.status}">
                    <i class="fas ${statusIcon}" aria-hidden="true"></i>
                    ${mission.status.charAt(0).toUpperCase() + mission.status.slice(1)}
                </div>
            </div>
            <div class="mission-content">
                <h3 class="mission-title">${mission.title}</h3>
                <p class="mission-description">${mission.description}</p>
                <div class="mission-details">
                    <span class="mission-date">
                        <i class="far fa-calendar-check" aria-hidden="true"></i>
                        ${formattedDate}
                    </span>
                    <span class="mission-target">
                        <i class="fas fa-crosshairs" aria-hidden="true"></i>
                        ${mission.target}
                    </span>
                </div>
                <div class="mission-type">
                    <i class="fas ${this.getMissionTypeIcon(mission.type)}" aria-hidden="true"></i>
                    ${mission.type.charAt(0).toUpperCase() + mission.type.slice(1)}
                </div>
                ${mission.infoLink ? `
                <a href="${mission.infoLink}" target="_blank" rel="noopener noreferrer" class="mission-info-link cosmic-btn">
                    <i class="fas fa-external-link-alt"></i> Learn More
                </a>
                ` : ''}
            </div>
        `;

        // Handle image load errors
        const imgElement = card.querySelector('.mission-image');
        imgElement.style.backgroundImage = `url('${mission.image}')`;
        this.handleImageError(imgElement, mission);

        // Add click event for mission details
        card.addEventListener('click', (e) => {
            // Don't trigger if clicking the "Learn More" link
            if (!e.target.closest('.mission-info-link')) {
                this.showMissionDetails(mission);
            }
        });

        return card;
    }

    handleImageError(imgElement, mission) {
        const testImage = new Image();
        testImage.onerror = () => {
            // Try to get a fallback image from NasaService
            const fallbackImage = NasaService.getFallbackImage(mission);
            imgElement.style.backgroundImage = `url('${fallbackImage}')`;
        };
        testImage.src = mission.image;
    }

    showMissionDetails(mission) {
        // Future enhancement: implement modal or detailed view
        console.log('Mission details:', mission);
    }

    displayMissions() {
        if (!this.timelineContent) return;

        // Clear current content
        this.timelineContent.innerHTML = '';

        const missionsToShow = this.missions[this.activeTimeframe];

        if (missionsToShow.length === 0) {
            this.showEmpty();
            return;
        }

        // Create and append mission cards
        const fragment = document.createDocumentFragment();
        missionsToShow.forEach(mission => {
            const missionCard = this.createMissionCard(mission);
            fragment.appendChild(missionCard);
        });

        this.timelineContent.appendChild(fragment);
        this.addTimelineConnectors();
    }

    addTimelineConnectors() {
        const cards = this.timelineContent.querySelectorAll('.mission-card');
        const fragment = document.createDocumentFragment();
        
        cards.forEach((card, index) => {
            if (index < cards.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'timeline-connector';
                fragment.appendChild(connector.cloneNode(true));
            }
        });

        this.timelineContent.appendChild(fragment);
    }

    showLoading() {
        if (this.timelineContent) {
            this.timelineContent.innerHTML = `
                <div class="loading-message">
                    <div class="loading-spinner"></div>
                    <p>Loading mission data...</p>
                </div>
            `;
        }
    }

    showEmpty() {
        if (this.timelineContent) {
            this.timelineContent.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-satellite"></i>
                    <p>No ${this.activeTimeframe} missions found</p>
                </div>
            `;
        }
    }

    showError(message) {
        if (this.timelineContent) {
            this.timelineContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${message}</p>
                    <button class="cosmic-btn retry-btn" onclick="window.location.reload()">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}

export default MissionsManager;