import PlanetData from '../data/PlanetData.js';
import { gsap } from 'gsap';

class PlanetExplorer {
    constructor(context) {
        if (!context?.THREE) {
            throw new Error('THREE must be provided in context');
        }
        this.THREE = context.THREE;
        this.OrbitControls = context.OrbitControls;
        
        this.scene = new this.THREE.Scene();
        this.camera = new this.THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 50, 150); // Moved back for better view

        this.renderer = new this.THREE.WebGLRenderer({
            canvas: document.getElementById('universe'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0);

        this.planets = {};
        this.isAutoRotating = true;
        this.planetData = new PlanetData();
        
        this.textureUrls = {
            sun: 'https://i.imgur.com/XdRTvzj.jpeg',
            mercury: 'https://i.imgur.com/SLgVbwD.jpeg',
            venus: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/Images%20and%20Textures/Venus/Venus.jpg',
            earth: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/Images%20and%20Textures/Earth/Earth.jpg',
            mars: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/Images%20and%20Textures/Mars/Mars.jpg',
            jupiter: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/Images%20and%20Textures/Jupiter/Jupiter.jpg',
            saturn: 'https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/Images%20and%20Textures/Saturn/Saturn.jpg',
            uranus: 'https://i.imgur.com/Yo4bGTx.jpeg',
            neptune: 'https://i.imgur.com/EmbuxRB.jpeg',
            pluto: 'https://i.imgur.com/tf5gNi9.jpeg',
            saturnRings: 'https://i.imgur.com/vloMQhv.jpeg'
        };
    }

    async initialize() {
        await this.init();
    }

    async init() {
        await this.planetData.initialize();
        this.addLights();
        await this.createPlanets();
        this.setupControls();
        this.addEventListeners();
        this.animate();
        // Set initial planet to Earth
        this.loadPlanetData('earth');
        const earthButton = document.querySelector('.cosmic-btn[data-planet="earth"]');
        if (earthButton) {
            earthButton.classList.add('active');
            this.focusOnPlanet('earth');
        }
    }

    addLights() {
        const ambientLight = new this.THREE.AmbientLight(0x404040, 2);
        this.scene.add(ambientLight);

        const dirLight = new this.THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(-1, 2, 4);
        this.scene.add(dirLight);

        const sunLight = new this.THREE.PointLight(0xffffff, 3);
        sunLight.position.set(-100, 0, -50); // Adjusted for new spacing
        this.scene.add(sunLight);
    }

    async createPlanets() {
        const textureLoader = new this.THREE.TextureLoader();
        
        const loadTexture = async (url) => {
            return new Promise((resolve) => {
                textureLoader.load(
                    url,
                    (texture) => {
                        texture.minFilter = this.THREE.LinearFilter;
                        texture.magFilter = this.THREE.LinearFilter;
                        resolve(texture);
                    },
                    undefined,
                    (error) => {
                        console.error(`Error loading texture: ${url}`, error);
                        resolve(null);
                    }
                );
            });
        };

        // Updated spacing for planets
        const planetData = {
            sun: { size: 12, position: [-100, 0, -50], emissive: true },
            mercury: { size: 3, position: [-75, 0, -35] },
            venus: { size: 4, position: [-50, 0, -25] },
            earth: { size: 5, position: [-25, 0, -12] },
            mars: { size: 4, position: [0, 0, 0] },
            jupiter: { size: 8, position: [25, 0, 12] },
            saturn: { size: 7, position: [60, 0, 30] }, // Moved further out for rings
            uranus: { size: 6, position: [95, 0, 45] },
            neptune: { size: 6, position: [130, 0, 60] },
            pluto: { size: 2.5, position: [165, 0, 75] }
        };

        for (const [name, data] of Object.entries(planetData)) {
            try {
                const texture = await loadTexture(this.textureUrls[name]);
                const geometry = new this.THREE.SphereGeometry(data.size, 64, 64);
                let material;

                if (data.emissive) {
                    material = new this.THREE.MeshBasicMaterial({
                        map: texture,
                        emissive: 0xffff00,
                        emissiveIntensity: 0.5
                    });
                } else {
                    material = new this.THREE.MeshStandardMaterial({
                        map: texture,
                        roughness: 0.5,
                        metalness: 0.0
                    });
                }

                this.planets[name] = new this.THREE.Mesh(geometry, material);
                this.planets[name].position.set(...data.position);

                if (name === 'earth') {
                    this.planets[name].rotation.x = this.THREE.MathUtils.degToRad(23.5);
                } else if (name === 'uranus') {
                    this.planets[name].rotation.x = this.THREE.MathUtils.degToRad(98);
                }

                this.scene.add(this.planets[name]);

                if (name === 'saturn') {
                    const ringsTexture = await loadTexture(this.textureUrls.saturnRings);
                    const ringsGeometry = new this.THREE.RingGeometry(
                        data.size * 1.4,
                        data.size * 2.2,
                        64
                    );
                    const ringsMaterial = new this.THREE.MeshBasicMaterial({
                        map: ringsTexture,
                        side: this.THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.8
                    });
                    const rings = new this.THREE.Mesh(ringsGeometry, ringsMaterial);
                    rings.rotation.x = Math.PI / 2;
                    this.planets[name].add(rings);
                }
            } catch (error) {
                console.error(`Error creating ${name}:`, error);
            }
        }
    }

    setupControls() {
        this.controls = new this.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 20;
        this.controls.maxDistance = 300; // Increased for better view of all planets
    }

    addEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        document.querySelectorAll('.cosmic-btn[data-planet]').forEach(button => {
            button.addEventListener('click', () => {
                const planetName = button.dataset.planet;
                this.focusOnPlanet(planetName);
                this.loadPlanetData(planetName);
                
                document.querySelectorAll('.cosmic-btn[data-planet]').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
            });
        });

        const autoRotateBtn = document.getElementById('auto-rotate');
        autoRotateBtn.addEventListener('click', () => {
            this.isAutoRotating = !this.isAutoRotating;
            autoRotateBtn.innerHTML = this.isAutoRotating ? 
                '<span class="btn-icon">🔄</span><span class="btn-text">Stop Rotation</span>' : 
                '<span class="btn-icon">🔄</span><span class="btn-text">Auto Rotate</span>';
        });

        document.getElementById('reset-view').addEventListener('click', () => {
            gsap.to(this.camera.position, {
                duration: 1,
                x: 0,
                y: 50,
                z: 150,
                ease: 'power2.inOut'
            });
            gsap.to(this.controls.target, {
                duration: 1,
                x: 0,
                y: 0,
                z: 0,
                ease: 'power2.inOut'
            });
        });
    }

    focusOnPlanet(planetName) {
        const planet = this.planets[planetName];
        if (planet) {
            const offset = planet.geometry.parameters.radius * 4;
            const position = planet.position.clone();
            position.z += offset;
            position.y += offset / 2;

            gsap.to(this.camera.position, {
                duration: 1,
                x: position.x,
                y: position.y,
                z: position.z + 20,
                ease: 'power2.inOut'
            });

            gsap.to(this.controls.target, {
                duration: 1,
                x: planet.position.x,
                y: planet.position.y,
                z: planet.position.z,
                ease: 'power2.inOut'
            });
        }
    }

    async loadPlanetData(planetName) {
        try {
            const planetData = this.planetData.getPlanetData(planetName);
            const infoPanel = document.querySelector('.info-panel');
            const celestialName = infoPanel.querySelector('.celestial-name');
            const dataTable = infoPanel.querySelector('.data-table');
            const nasaContent = infoPanel.querySelector('.nasa-content');

            celestialName.textContent = planetData.name;
            
            const rows = [
                ['Type', planetData.type],
                ['Radius', planetData.physicalCharacteristics.radius],
                ['Mass', planetData.physicalCharacteristics.mass],
                ['Gravity', planetData.physicalCharacteristics.gravity],
                ['Temperature', this.getTemperatureDisplay(planetData.physicalCharacteristics.temperature)]
            ];

            dataTable.innerHTML = `
                <thead>
                    <tr>
                        <th scope="col">Property</th>
                        <th scope="col">Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(([property, value]) => `
                        <tr>
                            <td>${property}</td>
                            <td>${value}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;

            // Update NASA insights content
            nasaContent.innerHTML = planetData.interesting_fact ? 
                `<p class="nasa-fact">${planetData.interesting_fact}</p>` :
                '<div class="loading-animation">No additional data available</div>';

        } catch (error) {
            console.error('Error loading planet data:', error);
        }
    }

    getTemperatureDisplay(temp) {
        if (temp.mean) return temp.mean;
        if (temp.surface) return temp.surface;
        if (temp.cloud_top) return temp.cloud_top;
        if (temp.average) return temp.average;
        return `${temp.min} to ${temp.max}`;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.isAutoRotating) {
            Object.values(this.planets).forEach(planet => {
                if (planet) planet.rotation.y += 0.005;
            });
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

export default PlanetExplorer;