class RateLimiter {
    constructor(requestsPerSecond = 10) {
        this.requestsPerSecond = requestsPerSecond;
        this.queue = [];
        this.processing = false;
        this.requestCount = 0;
        this.lastResetTime = Date.now();
    }

    async addRequest(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push({ requestFn, resolve, reject });
            if (!this.processing) {
                this.processQueue();
            }
        });
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.processing = false;
            return;
        }

        this.processing = true;
        const request = this.queue.shift();
        const { requestFn, resolve, reject } = request;

        if (Date.now() - this.lastResetTime >= 1000) {
            this.requestCount = 0;
            this.lastResetTime = Date.now();
        }

        if (this.requestCount >= this.requestsPerSecond) {
            const waitTime = 1000 - (Date.now() - this.lastResetTime);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.queue.unshift(request);
            this.processQueue();
            return;
        }

        try {
            this.requestCount++;
            const result = await requestFn();
            resolve(result);
        } catch (error) {
            reject(error);
        }

        await new Promise(resolve => setTimeout(resolve, 1000 / this.requestsPerSecond));
        this.processQueue();
    }
}

class NasaService {
    static API_KEY = 'CVL3wc7WSyQjg1KiLHEVBXKLRuUGbRbzSAFtYZd0';
    static BASE_URL = 'https://api.nasa.gov';
    static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    static cache = new Map();
    static rateLimiter = new RateLimiter(5);

    static getDefaultDateRange(days = 7) {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }

    static async getAPOD(options = {}) {
        const params = new URLSearchParams({
            api_key: this.API_KEY,
            thumbs: options.thumbs ? 'true' : 'false'
        });

        if (options.date) params.append('date', options.date);
        return this.fetchCachedData('/planetary/apod', params, 'apod');
    }

    static async getSolarFlares(startDate, endDate) {
        const dates = this.getDefaultDateRange(30);
        const params = new URLSearchParams({
            api_key: this.API_KEY,
            start_date: startDate || dates.start,
            end_date: endDate || dates.end
        });
        return this.fetchCachedData('/DONKI/FLR', params, 'solar-flares');
    }

    static async getGeomagneticStorms(startDate, endDate) {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const formattedEndDate = (endDate || today.toISOString().split('T')[0]);
        
        try {
            const url = `${this.BASE_URL}/DONKI/GST?startDate=2024-01-01&endDate=${formattedEndDate}&api_key=${this.API_KEY}`;
            const data = await this.fetchWithRetry(url, 'geo-storms');
            return data;
        } catch (error) {
            console.error('Geomagnetic storms fetch error:', error);
            return [];
        }
    }

    static async getCME(startDate, endDate) {
        const dates = this.getDefaultDateRange(30);
        const params = new URLSearchParams({
            api_key: this.API_KEY,
            start_date: startDate || dates.start,
            end_date: endDate || dates.end
        });
        return this.fetchCachedData('/DONKI/CME', params, 'cme');
    }

    static async getMarsRoverPhotos(rover = 'curiosity', camera = 'navcam') {
        const params = new URLSearchParams({
            api_key: this.API_KEY,
            camera: camera
        });

        const cacheKey = `mars-photos-${rover}-${camera}`;
        try {
            const cachedData = this.getFromCache(cacheKey);
            if (cachedData) return cachedData;

            const url = `${this.BASE_URL}/mars-photos/api/v1/rovers/${rover}/latest_photos?${params}`;
            const data = await this.fetchWithRetry(url, cacheKey);
            return data;
        } catch (error) {
            console.error('Mars rover photos fetch error:', error);
            return { latest_photos: [] };
        }
    }
    static getFallbackImage(mission) {
        const fallbackImages = {
            types: {
                'rover': 'https://images-assets.nasa.gov/image/PIA23764/PIA23764~thumb.jpg',
                'spacecraft': 'https://images-assets.nasa.gov/image/0301627/0301627~thumb.jpg',
                'space telescope': 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001465/GSFC_20171208_Archive_e001465~thumb.jpg',
                'human spaceflight': 'https://images-assets.nasa.gov/image/as11-40-5874/as11-40-5874~thumb.jpg',
                'satellite': 'https://images-assets.nasa.gov/image/PIA13115/PIA13115~thumb.jpg'
            },
            targets: {
                'mars': 'https://images-assets.nasa.gov/image/PIA24420/PIA24420~thumb.jpg',
                'moon': 'https://images-assets.nasa.gov/image/as11-44-6667/as11-44-6667~thumb.jpg',
                'jupiter': 'https://images-assets.nasa.gov/image/PIA24926/PIA24926~thumb.jpg',
                'saturn': 'https://images-assets.nasa.gov/image/PIA11141/PIA11141~thumb.jpg',
                'europa': 'https://images-assets.nasa.gov/image/PIA19048/PIA19048~thumb.jpg',
                'titan': 'https://images-assets.nasa.gov/image/PIA14910/PIA14910~thumb.jpg',
                'deep space': 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e002151/GSFC_20171208_Archive_e002151~thumb.jpg',
                'earth': 'https://images-assets.nasa.gov/image/as17-148-22727/as17-148-22727~thumb.jpg',
                'solar system': 'https://images-assets.nasa.gov/image/PIA17999/PIA17999~thumb.jpg',
                'interstellar space': 'https://images-assets.nasa.gov/image/hubble-observes-one-of-a-kind-star-nicknamed-nasty_17754652960_o/hubble-observes-one-of-a-kind-star-nicknamed-nasty_17754652960_o~thumb.jpg'
            }
        };

        const missionSpecificImages = {
            'perseverance': 'https://images-assets.nasa.gov/image/PIA23764/PIA23764~thumb.jpg',
            'james webb space telescope': 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001465/GSFC_20171208_Archive_e001465~thumb.jpg',
            'artemis program': 'https://images-assets.nasa.gov/image/KSC-20210318-PH-KLS01_0018/KSC-20210318-PH-KLS01_0018~thumb.jpg',
            'apollo 11': 'https://images-assets.nasa.gov/image/as11-40-5874/as11-40-5874~thumb.jpg',
            'voyager 1': 'https://images-assets.nasa.gov/image/PIA00451/PIA00451~thumb.jpg',
            'europa clipper': 'https://images-assets.nasa.gov/image/PIA19048/PIA19048~thumb.jpg',
            'dragonfly': 'https://images-assets.nasa.gov/image/PIA14910/PIA14910~thumb.jpg',
            'artemis iii': 'https://images-assets.nasa.gov/image/KSC-20200730-PH-KLS01_0104/KSC-20200730-PH-KLS01_0104~thumb.jpg'
        };

        if (mission.name) {
            const specificImage = missionSpecificImages[mission.name.toLowerCase()];
            if (specificImage) return specificImage;
        }

        if (mission.type) {
            const typeImage = fallbackImages.types[mission.type.toLowerCase()];
            if (typeImage) return typeImage;
        }

        if (mission.target) {
            const targetImage = fallbackImages.targets[mission.target.toLowerCase()];
            if (targetImage) return targetImage;
        }

        return 'https://images-assets.nasa.gov/image/PIA17999/PIA17999~thumb.jpg';
    }

    static getInfoLink(mission) {
        const missionLinks = {
            'perseverance': 'https://mars.nasa.gov/mars2020/',
            'james webb space telescope': 'https://webb.nasa.gov/',
            'artemis': 'https://www.nasa.gov/humans-in-space/artemis/',
            'europa clipper': 'https://europa.nasa.gov/',
            'dragonfly': 'https://dragonfly.jhuapl.edu/',
            'apollo 11': 'https://www.nasa.gov/mission/apollo-11/',
            'voyager 1': 'https://voyager.jpl.nasa.gov/',
            'hubble': 'https://hubblesite.org/'
        };

        const targetLinks = {
            'mars': 'https://mars.nasa.gov/',
            'moon': 'https://www.nasa.gov/humans-in-space/artemis/',
            'jupiter': 'https://science.nasa.gov/jupiter/',
            'saturn': 'https://science.nasa.gov/saturn/',
            'europa': 'https://europa.nasa.gov/',
            'titan': 'https://solarsystem.nasa.gov/moons/saturn-moons/titan/overview/'
        };

        const missionName = mission.name.toLowerCase();
        if (missionLinks[missionName]) {
            return missionLinks[missionName];
        }

        if (mission.target && targetLinks[mission.target.toLowerCase()]) {
            return targetLinks[mission.target.toLowerCase()];
        }

        return 'https://www.nasa.gov/missions/';
    }

    static async getCurrentMissions() {
        const cacheKey = 'current-missions';
        try {
            const cachedData = this.getFromCache(cacheKey);
            if (cachedData) return cachedData;

            const missions = [
                {
                    name: "Perseverance Rover",
                    status: "Active",
                    startDate: "2021-02-18",
                    description: "Mars rover exploring Jezero Crater",
                    type: "Rover",
                    target: "Mars",
                    image: "https://images-assets.nasa.gov/image/PIA23764/PIA23764~thumb.jpg"
                },
                {
                    name: "James Webb Space Telescope",
                    status: "Active",
                    startDate: "2021-12-25",
                    description: "Most powerful space telescope observing the universe",
                    type: "Space Telescope",
                    target: "Deep Space",
                    image: "https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001465/GSFC_20171208_Archive_e001465~thumb.jpg"
                },
                {
                    name: "Artemis Program",
                    status: "In Progress",
                    startDate: "2022-11-16",
                    description: "Return humans to the Moon and prepare for Mars",
                    type: "Human Spaceflight",
                    target: "Moon",
                    image: "https://images-assets.nasa.gov/image/KSC-20210318-PH-KLS01_0018/KSC-20210318-PH-KLS01_0018~thumb.jpg"
                }
            ];

            missions.forEach(mission => {
                mission.image = mission.image || this.getFallbackImage(mission);
                mission.infoLink = this.getInfoLink(mission);
            });

            this.setCache(cacheKey, missions);
            return missions;
        } catch (error) {
            console.error('Current missions fetch error:', error);
            return [];
        }
    }

    static async getPastMissions() {
        const cacheKey = 'past-missions';
        try {
            const cachedData = this.getFromCache(cacheKey);
            if (cachedData) return cachedData;

            const missions = [
                {
                    name: "Apollo 11",
                    status: "completed",
                    startDate: "1969-07-16",
                    endDate: "1969-07-24",
                    description: "First human Moon landing mission",
                    type: "Human Spaceflight",
                    target: "Moon",
                    image: "https://images-assets.nasa.gov/image/as11-40-5874/as11-40-5874~thumb.jpg"
                },
                {
                    name: "Voyager 1",
                    status: "completed",
                    startDate: "1977-09-05",
                    description: "Interstellar space exploration mission",
                    type: "Spacecraft",
                    target: "Interstellar Space",
                    image: "https://images-assets.nasa.gov/image/PIA00451/PIA00451~thumb.jpg"
                },
                {
                    name: "Space Shuttle Program",
                    status: "completed",
                    startDate: "1981-04-12",
                    endDate: "2011-07-21",
                    description: "Reusable spacecraft program for LEO missions",
                    type: "Human Spaceflight",
                    target: "Low Earth Orbit",
                    image: "https://images-assets.nasa.gov/image/0301627/0301627~thumb.jpg"
                }
            ];

            missions.forEach(mission => {
                mission.image = mission.image || this.getFallbackImage(mission);
                mission.infoLink = this.getInfoLink(mission);
            });

            this.setCache(cacheKey, missions);
            return missions;
        } catch (error) {
            console.error('Past missions fetch error:', error);
            return [];
        }
    }

    static async getUpcomingMissions() {
        const cacheKey = 'upcoming-missions';
        try {
            const cachedData = this.getFromCache(cacheKey);
            if (cachedData) return cachedData;

            const missions = [
                {
                    name: "Europa Clipper",
                    status: "planned",
                    startDate: "2024-10-10",
                    description: "Mission to study Jupiter's moon Europa",
                    type: "Spacecraft",
                    target: "Europa",
                    image: "https://images-assets.nasa.gov/image/PIA19048/PIA19048~thumb.jpg"
                },
                {
                    name: "Dragonfly",
                    status: "planned",
                    startDate: "2027-06-01",
                    description: "Rotorcraft to explore Saturn's moon Titan",
                    type: "Spacecraft",
                    target: "Titan",
                    image: "https://images-assets.nasa.gov/image/PIA14910/PIA14910~thumb.jpg"
                },
                {
                    name: "Artemis III",
                    status: "planned",
                    startDate: "2025-12-01",
                    description: "First crewed lunar landing of the Artemis program",
                    type: "Human Spaceflight",
                    target: "Moon",
                    image: "https://images-assets.nasa.gov/image/KSC-20200730-PH-KLS01_0104/KSC-20200730-PH-KLS01_0104~thumb.jpg"
                }
            ];

            missions.forEach(mission => {
                mission.image = mission.image || this.getFallbackImage(mission);
                mission.infoLink = this.getInfoLink(mission);
            });

            this.setCache(cacheKey, missions);
            return missions;
        } catch (error) {
            console.error('Upcoming missions fetch error:', error);
            return [];
        }
    }

    static async getPlanetaryData(planetName) {
        const cacheKey = `planetary-data-${planetName.toLowerCase()}`;
        try {
            const cachedData = this.getFromCache(cacheKey);
            if (cachedData) return cachedData;
    
            // Simulated NASA API data
            const nasaData = {
                earth: {
                    recent_missions: ["Landsat 9", "GOES-R", "ICESat-2"],
                    current_research: "Climate monitoring, weather patterns, and polar ice studies",
                    latest_discoveries: "New patterns in global atmospheric circulation detected"
                },
                mars: {
                    recent_missions: ["Perseverance", "InSight", "Curiosity"],
                    current_research: "Search for signs of ancient microbial life",
                    latest_discoveries: "Organic molecules found in Jezero Crater sediments"
                },
                jupiter: {
                    recent_missions: ["Juno", "Europa Clipper (upcoming)"],
                    current_research: "Atmospheric composition and moon studies",
                    latest_discoveries: "New insights into Jupiter's atmospheric circulation"
                },
                saturn: {
                    recent_missions: ["Cassini (completed)"],
                    current_research: "Ring system dynamics and moon interactions",
                    latest_discoveries: "Complex organic molecules found in rings"
                },
                venus: {
                    recent_missions: ["Parker Solar Probe flybys"],
                    current_research: "Atmospheric composition and surface mapping",
                    latest_discoveries: "Possible signs of current volcanic activity"
                },
                mercury: {
                    recent_missions: ["BepiColombo (en route)"],
                    current_research: "Surface composition and magnetic field studies",
                    latest_discoveries: "Evidence of recent geological activity"
                },
                uranus: {
                    recent_missions: ["Voyager 2 (1986 flyby)"],
                    current_research: "Atmospheric dynamics and ring studies",
                    latest_discoveries: "Aurora activity detected by Hubble"
                },
                neptune: {
                    recent_missions: ["Voyager 2 (1989 flyby)"],
                    current_research: "Storm system tracking and atmospheric studies",
                    latest_discoveries: "Changes in dark spot storm systems observed"
                },
                pluto: {
                    recent_missions: ["New Horizons (2015 flyby)"],
                    current_research: "Surface composition and atmospheric studies",
                    latest_discoveries: "Complex organic molecules found on surface"
                }
            };
    
            const data = nasaData[planetName.toLowerCase()];
            if (!data) {
                return {
                    recent_missions: ["Solar Orbiter", "Parker Solar Probe"],
                    current_research: "Solar dynamics and space weather prediction",
                    latest_discoveries: "New insights into solar magnetic field behavior"
                };
            }
    
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error(`Failed to fetch planetary data for ${planetName}:`, error);
            return null;
        }
    }

    static async fetchCachedData(endpoint, params, cacheKey) {
        try {
            const cachedData = this.getFromCache(cacheKey);
            if (cachedData) return cachedData;

            const url = `${this.BASE_URL}${endpoint}?${params}`;
            const data = await this.fetchWithRetry(url, cacheKey);
            return data;
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            throw error;
        }
    }

    static async fetchWithRetry(url, cacheKey, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                    mode: 'cors',
                });
                
                if (!response.ok) {
                    throw new Error(`NASA API error: ${response.status}`);
                }
                
                const data = await response.json();
                this.setCache(cacheKey, data);
                return data;
            } catch (error) {
                if (attempt === retries) throw error;
                const delay = 1000 * attempt;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    static getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    static setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    static cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.CACHE_DURATION) {
                this.cache.delete(key);
            }
        }
    }
}

// Clean cache periodically
setInterval(() => {
    NasaService.cleanCache();
}, NasaService.CACHE_DURATION);

export { NasaService };