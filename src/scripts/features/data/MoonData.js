import { NasaService } from '../../services/NasaService.js';

class MoonData {
    constructor() {
        this.dynamicData = new Map();
        this.staticData = {
            earth: [
                {
                    name: "Moon",
                    diameter: "3,474 km",
                    distance: "384,400 km",
                    orbitalPeriod: "27.3 days",
                    rotationPeriod: "27.3 days (synchronous)",
                    discoveredBy: "Prehistoric",
                    gravity: "1.62 m/s²",
                    temperature: {
                        day: "127°C",
                        night: "-173°C"
                    },
                    interesting_fact: "The Moon is the only celestial body besides Earth on which humans have set foot, with Apollo 11 landing on July 20, 1969.",
                    texture: "https://i.imgur.com/YvC7tcI.jpeg" // Earth's Moon
                }
            ],
            mars: [
                {
                    name: "Phobos",
                    diameter: "22.2 km",
                    distance: "9,377 km",
                    orbitalPeriod: "7.7 hours",
                    rotationPeriod: "7.7 hours (synchronous)",
                    discoveredBy: "Asaph Hall (1877)",
                    gravity: "0.0057 m/s²",
                    temperature: {
                        mean: "-40°C"
                    },
                    interesting_fact: "Phobos orbits Mars so closely that it completes an orbit in less than a Martian day and appears to rise in the west and set in the east.",
                    texture: "https://i.imgur.com/eZxAb9y.jpeg" // Phobos
                },
                {
                    name: "Deimos",
                    diameter: "12.4 km",
                    distance: "23,460 km",
                    orbitalPeriod: "30.3 hours",
                    rotationPeriod: "30.3 hours (synchronous)",
                    discoveredBy: "Asaph Hall (1877)",
                    gravity: "0.003 m/s²",
                    temperature: {
                        mean: "-40°C"
                    },
                    interesting_fact: "Deimos is so small and distant from Mars that it appears star-like from the Martian surface.",
                    texture: "https://i.imgur.com/uIYVRxZ.jpeg" // Deimos
                }
            ],
            jupiter: [
                {
                    name: "Io",
                    diameter: "3,643 km",
                    distance: "421,700 km",
                    orbitalPeriod: "1.8 days",
                    rotationPeriod: "1.8 days (synchronous)",
                    discoveredBy: "Galileo Galilei (1610)",
                    gravity: "1.796 m/s²",
                    temperature: {
                        mean: "-130°C",
                        volcanic: "1,600°C"
                    },
                    interesting_fact: "Io is the most volcanically active body in our solar system with hundreds of active volcanoes due to Jupiter's intense gravitational forces.",
                    texture: "https://i.imgur.com/G3phzGf.jpeg" // Io
                },
                {
                    name: "Europa",
                    diameter: "3,122 km",
                    distance: "671,000 km",
                    orbitalPeriod: "3.5 days",
                    rotationPeriod: "3.5 days (synchronous)",
                    discoveredBy: "Galileo Galilei (1610)",
                    gravity: "1.315 m/s²",
                    temperature: {
                        mean: "-160°C"
                    },
                    interesting_fact: "Europa likely has a global subsurface ocean of liquid water, making it a prime target in the search for extraterrestrial life.",
                    texture: "https://i.imgur.com/3Hm9EoY.jpeg" // Europa
                },
                {
                    name: "Ganymede",
                    diameter: "5,268 km",
                    distance: "1,070,000 km",
                    orbitalPeriod: "7.2 days",
                    rotationPeriod: "7.2 days (synchronous)",
                    discoveredBy: "Galileo Galilei (1610)",
                    gravity: "1.428 m/s²",
                    temperature: {
                        mean: "-160°C"
                    },
                    interesting_fact: "Ganymede is the largest moon in our solar system, even bigger than the planet Mercury, and the only moon known to have its own magnetic field.",
                    texture: "https://i.imgur.com/O5H5AqH.jpeg" // Ganymede
                },
                {
                    name: "Callisto",
                    diameter: "4,821 km",
                    distance: "1,883,000 km",
                    orbitalPeriod: "16.7 days",
                    rotationPeriod: "16.7 days (synchronous)",
                    discoveredBy: "Galileo Galilei (1610)",
                    gravity: "1.235 m/s²",
                    temperature: {
                        mean: "-150°C"
                    },
                    interesting_fact: "Callisto has the most heavily cratered surface in the solar system, preserving a record of ancient impacts over billions of years.",
                    texture: "https://i.imgur.com/7Vzhi3Y.jpeg" // Callisto
                }
            ],
            saturn: [
                {
                    name: "Titan",
                    diameter: "5,150 km",
                    distance: "1,221,870 km",
                    orbitalPeriod: "15.9 days",
                    rotationPeriod: "15.9 days (synchronous)",
                    discoveredBy: "Christiaan Huygens (1655)",
                    gravity: "1.352 m/s²",
                    temperature: {
                        mean: "-179°C"
                    },
                    interesting_fact: "Titan has a thick atmosphere and is the only world besides Earth known to have liquid lakes and seas on its surface, though they consist of methane and ethane.",
                    texture: "https://i.imgur.com/KzVscVR.jpeg" // Titan
                },
                {
                    name: "Enceladus",
                    diameter: "504 km",
                    distance: "238,020 km",
                    orbitalPeriod: "1.4 days",
                    rotationPeriod: "1.4 days (synchronous)",
                    discoveredBy: "William Herschel (1789)",
                    gravity: "0.113 m/s²",
                    temperature: {
                        mean: "-198°C"
                    },
                    interesting_fact: "Enceladus has geysers that spray water vapor from an underground ocean, making it another potential habitat for life.",
                    texture: "https://i.imgur.com/2MbxfbE.jpeg" // Enceladus
                },
                {
                    name: "Mimas",
                    diameter: "396 km",
                    distance: "185,520 km",
                    orbitalPeriod: "0.9 days",
                    rotationPeriod: "0.9 days (synchronous)",
                    discoveredBy: "William Herschel (1789)",
                    gravity: "0.064 m/s²",
                    temperature: {
                        mean: "-200°C"
                    },
                    interesting_fact: "Mimas has a large impact crater that makes it resemble the Death Star from Star Wars.",
                    texture: "https://i.imgur.com/5s3VYkI.jpeg" // Mimas
                }
            ],
            uranus: [
                {
                    name: "Miranda",
                    diameter: "471 km",
                    distance: "129,390 km",
                    orbitalPeriod: "1.4 days",
                    rotationPeriod: "1.4 days (synchronous)",
                    discoveredBy: "Gerard Kuiper (1948)",
                    gravity: "0.079 m/s²",
                    temperature: {
                        mean: "-187°C"
                    },
                    interesting_fact: "Miranda has one of the most extreme and varied topographies of any object in the solar system, with canyons up to 20 km deep.",
                    texture: "https://i.imgur.com/jNTbK7V.jpeg" // Miranda
                },
                {
                    name: "Ariel",
                    diameter: "1,158 km",
                    distance: "191,020 km",
                    orbitalPeriod: "2.5 days",
                    rotationPeriod: "2.5 days (synchronous)",
                    discoveredBy: "William Lassell (1851)",
                    gravity: "0.269 m/s²",
                    temperature: {
                        mean: "-213°C"
                    },
                    interesting_fact: "Ariel appears to have the youngest surface among Uranian moons, suggesting relatively recent geological activity.",
                    texture: "https://i.imgur.com/MeRbvdZ.jpeg" // Ariel
                },
                {
                    name: "Titania",
                    diameter: "1,578 km",
                    distance: "435,910 km",
                    orbitalPeriod: "8.7 days",
                    rotationPeriod: "8.7 days (synchronous)",
                    discoveredBy: "William Herschel (1787)",
                    gravity: "0.367 m/s²",
                    temperature: {
                        mean: "-203°C"
                    },
                    interesting_fact: "Titania is the largest moon of Uranus and shows evidence of geological activity in its past.",
                    texture: "https://i.imgur.com/QqGk3bL.jpeg" // Titania
                }
            ],
            neptune: [
                {
                    name: "Triton",
                    diameter: "2,707 km",
                    distance: "354,760 km",
                    orbitalPeriod: "5.9 days (retrograde)",
                    rotationPeriod: "5.9 days (synchronous)",
                    discoveredBy: "William Lassell (1846)",
                    gravity: "0.779 m/s²",
                    temperature: {
                        mean: "-235°C"
                    },
                    interesting_fact: "Triton orbits Neptune backwards (retrograde) and is likely a captured dwarf planet from the Kuiper Belt.",
                    texture: "https://i.imgur.com/dPR3Kte.jpeg" // Triton
                },
                {
                    name: "Proteus",
                    diameter: "420 km",
                    distance: "117,647 km",
                    orbitalPeriod: "1.1 days",
                    rotationPeriod: "1.1 days (synchronous)",
                    discoveredBy: "Voyager 2 (1989)",
                    gravity: "0.07 m/s²",
                    temperature: {
                        mean: "-220°C"
                    },
                    interesting_fact: "Despite being Neptune's second-largest moon, Proteus wasn't discovered until Voyager 2's flyby because it's very dark and close to Neptune.",
                    texture: "https://i.imgur.com/BHJC7iG.jpeg" // Using fallback texture
                }
            ],
            pluto: [
                {
                    name: "Charon",
                    diameter: "1,212 km",
                    distance: "19,571 km",
                    orbitalPeriod: "6.4 days",
                    rotationPeriod: "6.4 days (synchronous)",
                    discoveredBy: "James Christy (1978)",
                    gravity: "0.288 m/s²",
                    temperature: {
                        mean: "-220°C"
                    },
                    interesting_fact: "Charon is so large compared to Pluto that the two bodies orbit around a point between them, leading some to consider them a 'double dwarf planet' system.",
                    texture: "https://i.imgur.com/EzHtZhJ.jpeg" // Charon
                }
            ]
        };
        
        // Mercury, Venus, and the Sun have no moons
        this.staticData.mercury = [];
        this.staticData.venus = [];
        this.staticData.sun = [];
        
        // Texture fallbacks in case the main URLs are unavailable
        this.fallbackTextures = {
            default: "https://i.imgur.com/BHJC7iG.jpeg",
            rocky: "https://i.imgur.com/YQrKmK9.jpeg",
            icy: "https://i.imgur.com/qUXGJbj.jpeg"
        };
    }

    async initialize() {
        try {
            await this.prefetchNasaData();
            return true;
        } catch (error) {
            console.error('Failed to initialize MoonData:', error);
            return false;
        }
    }

    async prefetchNasaData() {
        // Prefetch some initial moon data for faster initial rendering
        await this.fetchNasaData('earth');
        await this.fetchNasaData('jupiter');
    }

    async fetchNasaData(planetName) {
        try {
            // Use the NasaService to fetch additional moon data
            const planetData = await NasaService.getPlanetaryData(planetName);
            
            if (!planetData) return;
            
            // Create an enhanced dataset with NASA information
            const moonEnhancedData = this.staticData[planetName.toLowerCase()]?.map(moon => {
                return {
                    ...moon,
                    nasa_recent_missions: planetData.recent_missions?.filter(mission => 
                        mission.toLowerCase().includes(moon.name.toLowerCase()) || 
                        mission.toLowerCase().includes('moon')),
                    nasa_current_research: planetData.current_research,
                    nasa_latest_discoveries: planetData.latest_discoveries
                };
            });
            
            if (moonEnhancedData?.length) {
                this.dynamicData.set(planetName.toLowerCase(), moonEnhancedData);
            }
        } catch (error) {
            console.error(`Failed to fetch NASA data for ${planetName}'s moons:`, error);
        }
    }

    getMoons(planetName) {
        if (!planetName) return [];
        
        // Get the base static moon data
        const staticMoons = this.staticData[planetName.toLowerCase()];
        if (!staticMoons || staticMoons.length === 0) return [];
        
        // Check if we have enhanced NASA data
        const enhancedData = this.dynamicData.get(planetName.toLowerCase());
        
        if (enhancedData) {
            return enhancedData;
        }
        
        // If no enhanced data yet, trigger a fetch and return static data
        this.fetchNasaData(planetName);
        return staticMoons;
    }

    async getMoonDetails(moonName, planetName) {
        if (!moonName || !planetName) return null;
        
        const moons = await this.getMoons(planetName);
        const moon = moons.find(m => m.name.toLowerCase() === moonName.toLowerCase());
        
        if (!moon) return null;
        
        // If we don't have enhanced data yet, try to fetch it
        if (!this.dynamicData.has(planetName.toLowerCase())) {
            await this.fetchNasaData(planetName);
            // Get the updated moon data after fetch
            const updatedMoons = await this.getMoons(planetName);
            return updatedMoons.find(m => m.name.toLowerCase() === moonName.toLowerCase()) || moon;
        }
        
        return moon;
    }

    hasMoons(planetName) {
        if (!planetName) return false;
        const moons = this.staticData[planetName.toLowerCase()];
        return moons && moons.length > 0;
    }

    getMoonCount(planetName) {
        if (!planetName) return 0;
        const moons = this.staticData[planetName.toLowerCase()];
        return moons ? moons.length : 0;
    }

    getTexture(moonName, planetName) {
        if (!moonName || !planetName) return this.fallbackTextures.default;
        
        const moons = this.staticData[planetName.toLowerCase()];
        if (!moons) return this.fallbackTextures.default;
        
        const moon = moons.find(m => m.name.toLowerCase() === moonName.toLowerCase());
        if (!moon || !moon.texture) return this.fallbackTextures.default;
        
        return moon.texture;
    }

    // Helper to get temperature display similar to planet data
    getTemperatureDisplay(temp) {
        if (!temp) return 'Not available';
        if (temp.mean) return temp.mean;
        if (temp.day && temp.night) return `${temp.day} (day) / ${temp.night} (night)`;
        if (temp.day) return temp.day;
        if (temp.night) return temp.night;
        return 'Not available';
    }
}

export default MoonData;