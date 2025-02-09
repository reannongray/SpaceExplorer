import { NasaService } from '../../services/NasaService.js';

class PlanetData {
    constructor() {
        this.dynamicData = new Map();
        this.staticData = {
            sun: {
                name: 'Sun',
                type: 'Star',
                physicalCharacteristics: {
                    diameter: '1.392 million km',
                    mass: '1.989 × 10^30 kg',
                    gravity: '274 m/s²',
                    rotation: '27 Earth days',
                    temperature: {
                        surface: '5,500°C',
                        core: '15 million°C'
                    }
                },
                interesting_fact: `Our Sun is a middle-aged star, about 4.6 billion years old. It converts about 600 million tons of hydrogen into helium every second through nuclear fusion, generating enormous energy. The Sun's core temperature reaches 15 million degrees Celsius, while its surface is a relatively cool 5,500°C. Despite being an average-sized star, it contains 99.86% of all mass in our solar system. Light from the Sun takes about 8 minutes to reach Earth, and one day of solar energy could power our entire planet for a year.`
            },
            mercury: {
                name: 'Mercury',
                type: 'Terrestrial Planet',
                physicalCharacteristics: {
                    diameter: '4,879 km',
                    mass: '3.285 × 10^23 kg',
                    gravity: '3.7 m/s²',
                    rotation: '59 Earth days',
                    temperature: {
                        min: '-180°C',
                        max: '430°C'
                    }
                },
                interesting_fact: `Mercury experiences the most extreme temperature variations in the solar system, ranging from -180°C at night to 430°C during the day. Despite being the closest planet to the Sun, it is not the hottest - Venus holds that title. Mercury's surface is heavily cratered, similar to our Moon, and it has no moons of its own. The planet completes an orbit around the Sun every 88 Earth days, making its years shorter than its days (one Mercury day equals 176 Earth days).`
            },
            venus: {
                name: 'Venus',
                type: 'Terrestrial Planet',
                physicalCharacteristics: {
                    diameter: '12,104 km',
                    mass: '4.867 × 10^24 kg',
                    gravity: '8.87 m/s²',
                    rotation: '243 Earth days (retrograde)',
                    temperature: {
                        surface: '462°C'
                    }
                },
                interesting_fact: `Venus, often called Earth's twin due to its similar size, is a planet of extremes. Its thick atmosphere creates a runaway greenhouse effect, making it the hottest planet in our solar system with surface temperatures hot enough to melt lead (462°C). The planet rotates backwards compared to most other planets, and its day is longer than its year. The atmospheric pressure on Venus's surface is 90 times greater than Earth's, equivalent to the pressure at a depth of 1 km in Earth's oceans.`
            },
            earth: {
                name: 'Earth',
                type: 'Terrestrial Planet',
                physicalCharacteristics: {
                    diameter: '12,742 km',
                    mass: '5.972 × 10^24 kg',
                    gravity: '9.81 m/s²',
                    rotation: '24 hours',
                    temperature: {
                        mean: '15°C'
                    }
                },
                interesting_fact: `Earth is the only known planet to harbor life, largely due to its liquid water, breathable atmosphere, and magnetic field that protects us from harmful solar radiation. Our planet's atmosphere is composed of 78% nitrogen, 21% oxygen, and 1% other gases. The Earth's core creates a magnetic field that not only protects us from solar radiation but also creates the beautiful aurora borealis (Northern Lights) and aurora australis (Southern Lights). Every day, about 100 tons of space material falls to Earth in the form of dust and meteorites.`
            },
            mars: {
                name: 'Mars',
                type: 'Terrestrial Planet',
                physicalCharacteristics: {
                    diameter: '6,779 km',
                    mass: '6.39 × 10^23 kg',
                    gravity: '3.71 m/s²',
                    rotation: '24 hours 37 minutes',
                    temperature: {
                        mean: '-63°C'
                    }
                },
                interesting_fact: `Mars hosts Olympus Mons, the largest known volcano in the solar system, standing at 21.9 km (13.6 miles) high and 600 km wide at its base. The Red Planet's color comes from iron oxide (rust) on its surface. Evidence suggests Mars once had liquid water on its surface, with dried-up river valleys, lake beds, and polar ice caps still visible today. Recent discoveries have found evidence of liquid water flowing on Mars during warm seasons, and underground lakes of liquid water have been detected beneath the southern polar ice cap, raising hopes about potential microbial life.`
            },
            jupiter: {
                name: 'Jupiter',
                type: 'Gas Giant',
                physicalCharacteristics: {
                    diameter: '139,820 km',
                    mass: '1.898 × 10^27 kg',
                    gravity: '24.79 m/s²',
                    rotation: '10 hours',
                    temperature: {
                        cloud_top: '-110°C'
                    }
                },
                interesting_fact: `Jupiter, the solar system's largest planet, has a Great Red Spot that's actually a giant storm raging for at least 400 years, large enough to fit three Earths inside. The planet's powerful magnetic field is the strongest of all planets, creating intense radiation belts and spectacular auroras. Jupiter has at least 79 moons, with the four largest (Io, Europa, Ganymede, and Callisto) discovered by Galileo in 1610. The planet's rapid rotation, despite its size, creates bands of light and dark clouds in its atmosphere, and it emits more energy than it receives from the Sun.`
            },
            saturn: {
                name: 'Saturn',
                type: 'Gas Giant',
                physicalCharacteristics: {
                    diameter: '116,460 km',
                    mass: '5.683 × 10^26 kg',
                    gravity: '10.44 m/s²',
                    rotation: '10.7 hours',
                    temperature: {
                        cloud_top: '-140°C'
                    }
                },
                interesting_fact: `Saturn's magnificent rings, though massive in diameter (about 175,000 miles wide), are incredibly thin - only about 30 feet thick in most places. Despite being mostly water ice and rock fragments, they create complex patterns and waves due to the gravitational influences of Saturn's many moons. Saturn has 82 confirmed moons, with Titan being the largest and having a thick atmosphere. The planet is so light that it could theoretically float in a bathtub large enough to hold it, as its density is less than that of water. The hexagonal storm at Saturn's north pole is a unique feature in our solar system, spanning about 20,000 miles across.`
            },
            uranus: {
                name: 'Uranus',
                type: 'Ice Giant',
                physicalCharacteristics: {
                    diameter: '50,724 km',
                    mass: '8.681 × 10^25 kg',
                    gravity: '8.69 m/s²',
                    rotation: '17 hours',
                    temperature: {
                        cloud_top: '-224°C'
                    }
                },
                interesting_fact: `Uranus is unique in the solar system as it rotates on its side, likely due to a massive impact early in its history. This unusual tilt means each pole experiences 42 years of continuous sunlight followed by 42 years of darkness. The planet's atmosphere contains 'ices' such as water, ammonia, and methane, giving it its blue-green color. Despite having the third-largest diameter in our solar system, Uranus has the coldest planetary atmosphere, reaching temperatures of -224°C. The planet has 27 known moons, all named after literary characters from the works of William Shakespeare and Alexander Pope.`
            },
            neptune: {
                name: 'Neptune',
                type: 'Ice Giant',
                physicalCharacteristics: {
                    diameter: '49,244 km',
                    mass: '1.024 × 10^26 kg',
                    gravity: '11.15 m/s²',
                    rotation: '16 hours',
                    temperature: {
                        cloud_top: '-214°C'
                    }
                },
                interesting_fact: `Neptune, the windiest planet in the solar system, has storms with speeds reaching 2,100 km/h (1,200 mph). Its Great Dark Spot, similar to Jupiter's Great Red Spot, is a storm system larger than Earth that appears and disappears over time. Neptune was the first planet located through mathematical predictions rather than direct observation, when its gravitational effects on Uranus's orbit led to its discovery. Despite being much farther from the Sun than Uranus, Neptune radiates more internal heat and has a more active atmosphere. Its blue color comes from methane in its atmosphere, which absorbs red light and reflects blue light.`
            },
            pluto: {
                name: 'Pluto',
                type: 'Dwarf Planet',
                physicalCharacteristics: {
                    diameter: '2,377 km',
                    mass: '1.303 × 10^22 kg',
                    gravity: '0.62 m/s²',
                    rotation: '6.4 Earth days',
                    temperature: {
                        mean: '-230°C'
                    }
                },
                interesting_fact: `Though reclassified as a dwarf planet in 2006, Pluto continues to surprise scientists with its complexity. The New Horizons mission revealed mountains of water ice that could rival the Rocky Mountains, a heart-shaped plain of frozen nitrogen (Tombaugh Regio), and possible underground oceans. Pluto and its largest moon Charon are so close in size that they orbit each other, creating a binary system. The surface features blue skies, red snow, and five moons, despite its tiny size and extreme distance from the Sun. Its thin atmosphere periodically freezes and falls to the surface as temperatures drop during its elongated orbit.`
            }
        };
    }

    async initialize() {
        try {
            await this.prefetchNasaData();
            return true;
        } catch (error) {
            console.error('Failed to initialize PlanetData:', error);
            return false;
        }
    }

    async prefetchNasaData() {
        // Start with Earth data
        await this.fetchNasaData('earth');
    }

    async fetchNasaData(planetName) {
        try {
            const nasaData = await NasaService.getPlanetaryData(planetName);
            if (nasaData) {
                this.dynamicData.set(planetName.toLowerCase(), nasaData);
            }
        } catch (error) {
            console.error(`Failed to fetch NASA data for ${planetName}:`, error);
        }
    }

    getPlanetData(planetName) {
        const baseData = this.staticData[planetName.toLowerCase()];
        const nasaData = this.dynamicData.get(planetName.toLowerCase());
        
        if (!baseData) {
            console.warn(`No data found for planet: ${planetName}`);
            return null;
        }
        
        if (nasaData) {
            return {
                ...baseData,
                nasa_data: nasaData
            };
        }
        
        // Trigger a fetch for next time if don't have NASA data
        this.fetchNasaData(planetName);
        return baseData;
    }

    getAllPlanets() {
        return Object.keys(this.staticData).map(planetName => ({
            name: planetName,
            ...this.getPlanetData(planetName)
        }));
    }
}

export default PlanetData;