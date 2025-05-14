import PlanetData from '../data/PlanetData.js';
import MoonData from '../data/MoonData.js';
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
        this.camera.position.set(0, 30, 200);

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
        this.moonData = new MoonData();
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.originalPlanetContent = null;
        this.boundShowMoonPopup = null;
        
        // Moon 3D rendering properties
        this.moonScene = null;
        this.moonCamera = null;
        this.moonRenderer = null;
        this.moonMesh = null;
        this.moonAnimation = null;
        this.moonRendererInitialized = false;
        
        // Add raycaster for planet clicking
        this.raycaster = new this.THREE.Raycaster();
        this.mouse = new this.THREE.Vector2();
        
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
        await this.moonData.initialize();
        this.addLights();
        await this.createPlanets();
        this.setupControls();
        this.setupPlanetClickInteraction();
        this.addEventListeners();
        this.setupInteraction();
        this.setupMoonPopup();
        this.animate();
        // Set initial planet to Earth
        this.loadPlanetData('earth');
        const earthButton = document.querySelector('.cosmic-btn[data-planet="earth"]');
        if (earthButton) {
            earthButton.classList.add('active');
            this.focusOnPlanet('earth');
        }
    }

    // Method to set up the moon popup
    setupMoonPopup() {
        // Get the popup elements
        this.moonPopup = document.getElementById('moon-popup');
        this.moonPlanetName = document.getElementById('moon-planet-name');
        this.moonSelector = document.getElementById('moon-selector');
        this.selectedMoonName = document.getElementById('selected-moon-name');
        this.moonDataTable = document.getElementById('moon-data-table');
        this.moonDetails = document.getElementById('moon-details');
        
        // Add close button event listener
        const closeButton = this.moonPopup.querySelector('.moon-popup-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.closeMoonPopup();
            });
        }
        
        // Add escape key listener to close popup
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.moonPopup.style.display === 'flex') {
                this.closeMoonPopup();
            }
        });
        
        // Add click outside to close
        this.moonPopup.addEventListener('click', (e) => {
            if (e.target === this.moonPopup) {
                this.closeMoonPopup();
            }
        });
    }
    
    // Method to set up the moon 3D renderer - only called when needed
    setupMoonRenderer() {
        // Get the canvas element
        const canvas = document.getElementById('moon-canvas');
        if (!canvas) {
            console.error("Moon canvas element not found!");
            return;
        }
        
        // Set fixed size for the renderer (200x200 to match the container)
        const width = 200;
        const height = 200;
        
        console.log("Initializing moon renderer with size:", width, height);
        
        // Create scene, camera, and renderer
        this.moonScene = new this.THREE.Scene();
        this.moonCamera = new this.THREE.PerspectiveCamera(
            75,
            width / height,
            0.1,
            1000
        );
        this.moonCamera.position.z = 5;
        
        this.moonRenderer = new this.THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        
        // Set size explicitly
        this.moonRenderer.setSize(width, height);
        this.moonRenderer.setPixelRatio(window.devicePixelRatio);
        this.moonRenderer.setClearColor(0x000000, 0);
        
        // Add ambient light
        const ambientLight = new this.THREE.AmbientLight(0xffffff, 0.5);
        this.moonScene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new this.THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 3, 5);
        this.moonScene.add(directionalLight);
        
        // Add a subtle point light for highlights
        const pointLight = new this.THREE.PointLight(0xffffff, 0.5);
        pointLight.position.set(-3, 2, 1);
        this.moonScene.add(pointLight);
        
        this.moonRendererInitialized = true;
    }

    // Method to close the moon popup
    closeMoonPopup() {
        if (this.moonPopup) {
            this.moonPopup.style.display = 'none';
            
            // Cancel the animation frame if it exists
            if (this.moonAnimation) {
                cancelAnimationFrame(this.moonAnimation);
                this.moonAnimation = null;
            }
            
            // Clear the moon scene
            if (this.moonScene && this.moonMesh) {
                this.moonScene.remove(this.moonMesh);
                this.moonMesh = null;
            }
        }
    }

    addLights() {
        const ambientLight = new this.THREE.AmbientLight(0x404040, 2);
        this.scene.add(ambientLight);

        const dirLight = new this.THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(-1, 2, 4);
        this.scene.add(dirLight);

        const sunLight = new this.THREE.PointLight(0xffffff, 3);
        sunLight.position.set(-100, 0, -50);
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

        const planetData = {
            sun: { size: 9.6, position: [-80, 0, -8] },
            mercury: { size: 2.4, position: [-60, 0, -6] },
            venus: { size: 3.2, position: [-40, 0, -4] },
            earth: { size: 4, position: [-20, 0, -2] },
            mars: { size: 3.2, position: [0, 0, 0] },
            jupiter: { size: 6.4, position: [20, 0, 2] },
            saturn: { size: 5.6, position: [40, 0, 4] },
            uranus: { size: 4.8, position: [60, 0, 6] },
            neptune: { size: 4.8, position: [80, 0, 8] },
            pluto: { size: 2, position: [100, 0, 10] }
        };
        for (const [name, data] of Object.entries(planetData)) {
            try {
                const texture = await loadTexture(this.textureUrls[name]);
                const geometry = new this.THREE.SphereGeometry(data.size, 64, 64);
                let material;

                if (data.emissive) {
                    material = new this.THREE.MeshStandardMaterial({
                        map: texture,
                        emissive: 0xffff00,
                        emissiveIntensity: 0.5,
                        emissiveMap: texture
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
        this.controls.maxDistance = 300;
        this.controls.maxPolarAngle = Math.PI / 1.5;
        this.controls.minPolarAngle = Math.PI / 3;
    }

    setupPlanetClickInteraction() {
        const renderer = this.renderer.domElement;
        let startPosition = { x: 0, y: 0 };

        renderer.addEventListener('mousedown', (event) => {
            startPosition = { x: event.clientX, y: event.clientY };
        });

        renderer.addEventListener('mouseup', (event) => {
            const moveDistance = Math.sqrt(
                Math.pow(event.clientX - startPosition.x, 2) + 
                Math.pow(event.clientY - startPosition.y, 2)
            );
            
            if (moveDistance < 5) {
                this.mouse.x = (event.offsetX / renderer.clientWidth) * 2 - 1;
                this.mouse.y = -(event.offsetY / renderer.clientHeight) * 2 + 1;

                this.raycaster.setFromCamera(this.mouse, this.camera);
                const intersects = this.raycaster.intersectObjects(Object.values(this.planets), true);

                if (intersects.length > 0) {
                    const clickedPlanet = Object.entries(this.planets).find(([name, mesh]) => {
                        return mesh === intersects[0].object || mesh.children.includes(intersects[0].object);
                    });

                    if (clickedPlanet) {
                        const planetName = clickedPlanet[0];
                        
                        document.querySelectorAll('.cosmic-btn[data-planet]').forEach(btn => {
                            btn.classList.remove('active');
                            if (btn.dataset.planet === planetName) {
                                btn.classList.add('active');
                            }
                        });

                        this.focusOnPlanet(planetName);
                        this.loadPlanetData(planetName);
                    }
                }
            }
        });

        renderer.addEventListener('touchstart', (event) => {
            event.preventDefault();
            startPosition = { 
                x: event.touches[0].clientX, 
                y: event.touches[0].clientY 
            };
        });

        renderer.addEventListener('touchend', (event) => {
            event.preventDefault();
            if (event.changedTouches.length === 0) return;
            
            const touch = event.changedTouches[0];
            const moveDistance = Math.sqrt(
                Math.pow(touch.clientX - startPosition.x, 2) + 
                Math.pow(touch.clientY - startPosition.y, 2)
            );

            if (moveDistance < 5) {
                this.mouse.x = (touch.clientX / renderer.clientWidth) * 2 - 1;
                this.mouse.y = -(touch.clientY / renderer.clientHeight) * 2 + 1;

                this.raycaster.setFromCamera(this.mouse, this.camera);
                const intersects = this.raycaster.intersectObjects(Object.values(this.planets), true);

                if (intersects.length > 0) {
                    const clickedPlanet = Object.entries(this.planets).find(([name, mesh]) => {
                        return mesh === intersects[0].object || mesh.children.includes(intersects[0].object);
                    });

                    if (clickedPlanet) {
                        const planetName = clickedPlanet[0];
                        document.querySelectorAll('.cosmic-btn[data-planet]').forEach(btn => {
                            btn.classList.remove('active');
                            if (btn.dataset.planet === planetName) {
                                btn.classList.add('active');
                            }
                        });

                        this.focusOnPlanet(planetName);
                        this.loadPlanetData(planetName);
                    }
                }
            }
        });
    }
    setupInteraction() {
        const renderer = this.renderer.domElement;

        renderer.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.previousMousePosition = {
                x: e.offsetX,
                y: e.offsetY
            };
            this.controls.enabled = false;
        });
        renderer.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const deltaMove = {
                x: e.offsetX - this.previousMousePosition.x,
                y: e.offsetY - this.previousMousePosition.y
            };

            const activePlanetButton = document.querySelector('.cosmic-btn[data-planet].active');
            if (activePlanetButton) {
                const planetName = activePlanetButton.dataset.planet;
                const planet = this.planets[planetName];
                if (planet) {
                    const wasAutoRotating = this.isAutoRotating;
                    this.isAutoRotating = false;

                    planet.rotation.y += deltaMove.x * 0.005;
                    planet.rotation.x += deltaMove.y * 0.005;

                    this.isAutoRotating = wasAutoRotating;
                }
            }

            this.previousMousePosition = {
                x: e.offsetX,
                y: e.offsetY
            };
        });

        renderer.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.controls.enabled = true;
        });

        renderer.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.controls.enabled = true;
        });

        renderer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
            this.controls.enabled = false;
        });

        renderer.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.isDragging) return;

            const deltaMove = {
                x: e.touches[0].clientX - this.previousMousePosition.x,
                y: e.touches[0].clientY - this.previousMousePosition.y
            };

            const activePlanetButton = document.querySelector('.cosmic-btn[data-planet].active');
            if (activePlanetButton) {
                const planetName = activePlanetButton.dataset.planet;
                const planet = this.planets[planetName];
                if (planet) {
                    const wasAutoRotating = this.isAutoRotating;
                    this.isAutoRotating = false;

                    planet.rotation.y += deltaMove.x * 0.005;
                    planet.rotation.x += deltaMove.y * 0.005;

                    this.isAutoRotating = wasAutoRotating;
                }
            }

            this.previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        });

        renderer.addEventListener('touchend', () => {
            this.isDragging = false;
            this.controls.enabled = true;
        });
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
        if (autoRotateBtn) {
            autoRotateBtn.addEventListener('click', () => {
                this.isAutoRotating = !this.isAutoRotating;
                autoRotateBtn.innerHTML = this.isAutoRotating ? 
                    '<span class="btn-icon">🔄</span><span class="btn-text">Stop Rotation</span>' : 
                    '<span class="btn-icon">🔄</span><span class="btn-text">Auto Rotate</span>';
            });
        }

        const resetBtn = document.getElementById('reset-view');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                gsap.to(this.camera.position, {
                    duration: 1,
                    x: 0,
                    y: 30,
                    z: 200,
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
                ['Diameter', planetData.physicalCharacteristics.diameter],
                ['Mass', planetData.physicalCharacteristics.mass],
                ['Gravity', planetData.physicalCharacteristics.gravity],
                ['Rotation', planetData.physicalCharacteristics.rotation],
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

            nasaContent.innerHTML = planetData.interesting_fact ? 
                `<p class="nasa-fact">${planetData.interesting_fact}</p>` :
                '<div class="loading-animation">No additional data available</div>';

            // Update the moon button in the top menu
            const moonButton = document.getElementById('view-moons');
            if (moonButton) {
                if (this.moonData.hasMoons(planetName)) {
                    const moonCount = this.moonData.getMoonCount(planetName);
                    moonButton.querySelector('.btn-text').textContent = `View ${moonCount} Moon${moonCount > 1 ? 's' : ''}`;
                    moonButton.dataset.planet = planetName;
                    moonButton.disabled = false;
                    moonButton.classList.remove('disabled');
                    
                    // Add event listener (remove old ones first to prevent duplicates)
                    moonButton.removeEventListener('click', this.boundShowMoonPopup);
                    this.boundShowMoonPopup = () => this.showMoonPopup(planetName);
                    moonButton.addEventListener('click', this.boundShowMoonPopup);
                } else {
                    moonButton.querySelector('.btn-text').textContent = 'No Moons';
                    moonButton.disabled = true;
                    moonButton.classList.add('disabled');
                    moonButton.removeEventListener('click', this.boundShowMoonPopup);
                }
            }

        } catch (error) {
            console.error('Error loading planet data:', error);
            const infoPanel = document.querySelector('.info-panel');
            if (infoPanel) {
                infoPanel.innerHTML = `
                    <div class="error-message">
                        <h3>Error Loading Data</h3>
                        <p>Unable to load planet information. Please try again later.</p>
                    </div>
                `;
            }
        }
    }

    getTemperatureDisplay(temp) {
        if (!temp) return 'Not available';
        if (temp.mean) return temp.mean;
        if (temp.surface) return temp.surface;
        if (temp.cloud_top) return temp.cloud_top;
        if (temp.min && temp.max) return `${temp.min} to ${temp.max}`;
        return 'Not available';
    }

    // Method to show the moon popup
    showMoonPopup(planetName) {
        // Get the moons data
        const moons = this.moonData.getMoons(planetName);
        if (!moons || moons.length === 0) {
            alert("No moons available for this planet.");
            return;
        }
        
        // Get planet's proper name for display
        const planetData = this.planetData.getPlanetData(planetName);
        const planetDisplayName = planetData ? planetData.name : planetName.charAt(0).toUpperCase() + planetName.slice(1);
        
        // Update popup title
        this.moonPlanetName.textContent = planetDisplayName;
        
        // Create moon selector buttons
        this.moonSelector.innerHTML = moons.map((moon, index) => 
            `<button class="cosmic-btn ${index === 0 ? 'active' : ''}" data-moon="${moon.name}">${moon.name}</button>`
        ).join('');
        
        // Make sure the renderer is initialized when the popup is displayed
        if (!this.moonRendererInitialized) {
            this.setupMoonRenderer();
        }
        
        // Show the popup first so that elements have dimensions
        this.moonPopup.style.display = 'flex';
        
        // Show the first moon by default
        this.displayMoonDetails(moons[0], planetName);
        
        // Add event listeners to moon selector buttons
        const moonButtons = this.moonSelector.querySelectorAll('.cosmic-btn');
        moonButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active class
                moonButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Get selected moon data
                const selectedMoonName = button.dataset.moon;
                const selectedMoon = moons.find(m => m.name === selectedMoonName);
                if (selectedMoon) {
                    this.displayMoonDetails(selectedMoon, planetName);
                }
            });
        });
    }

    // Helper method to display moon details
    displayMoonDetails(moon, planetName) {
        // Update moon name
        this.selectedMoonName.textContent = moon.name;
        
        // Update moon data table
        this.moonDataTable.innerHTML = `
            <thead>
                <tr>
                    <th scope="col">Property</th>
                    <th scope="col">Value</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>Diameter</td><td>${moon.diameter}</td></tr>
                <tr><td>Distance</td><td>${moon.distance}</td></tr>
                <tr><td>Orbital Period</td><td>${moon.orbitalPeriod}</td></tr>
                <tr><td>Rotation Period</td><td>${moon.rotationPeriod}</td></tr>
                <tr><td>Gravity</td><td>${moon.gravity}</td></tr>
                <tr><td>Temperature</td><td>${this.moonData.getTemperatureDisplay(moon.temperature)}</td></tr>
                <tr><td>Discovered By</td><td>${moon.discoveredBy}</td></tr>
            </tbody>
        `;
        
        // Update moon details
        this.moonDetails.innerHTML = `<p>${moon.interesting_fact}</p>`;
        
        // Add NASA info if available
        if (moon.nasa_latest_discoveries) {
            this.moonDetails.innerHTML += `
                <h4 class="glow" style="margin-top: 1rem;">Latest Discoveries</h4>
                <p>${moon.nasa_latest_discoveries}</p>
            `;
        }
        
        if (moon.nasa_recent_missions && moon.nasa_recent_missions.length > 0) {
            this.moonDetails.innerHTML += `
                <h4 class="glow" style="margin-top: 1rem;">Recent Missions</h4>
                <p>${moon.nasa_recent_missions.join(', ')}</p>
            `;
        }
        
        // Render the 3D moon
        this.renderMoon(moon, planetName);
    }
    
    // Method to render the 3D moon with enhanced procedural textures
    renderMoon(moon, planetName) {
        if (!this.moonScene || !this.moonRenderer || !this.moonCamera) return;
        
        // Clear previous moon if exists
        if (this.moonMesh) {
            this.moonScene.remove(this.moonMesh);
            this.moonMesh = null;
        }
        
        // Cancel previous animation if exists
        if (this.moonAnimation) {
            cancelAnimationFrame(this.moonAnimation);
            this.moonAnimation = null;
        }
        
        // Create a geometry for the moon
        const geometry = new this.THREE.SphereGeometry(2, 64, 64);
        
        // Create a canvas for the procedural texture
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Determine moon type for specialized texturing
        let moonType = 'default';
        if (moon.name === 'Moon') moonType = 'earths-moon';
        else if (moon.name === 'Io') moonType = 'volcanic';
        else if (moon.name === 'Europa' || moon.name === 'Enceladus') moonType = 'icy';
        else if (planetName === 'mars') moonType = 'mars-moon';
        else if (planetName === 'jupiter' || planetName === 'saturn') moonType = 'gas-giant-moon';
        
        // Create the base texture with gradient background
        this.createMoonBaseTexture(ctx, canvas.width, canvas.height, moonType);
        
        // Add surface details based on moon type
        this.addMoonSurfaceDetails(ctx, canvas.width, canvas.height, moonType);
        
        // Create a texture from the canvas
        const texture = new this.THREE.CanvasTexture(canvas);
        texture.wrapS = this.THREE.RepeatWrapping;
        texture.wrapT = this.THREE.RepeatWrapping;
        
        // Create bump map for terrain
        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = 1024;
        bumpCanvas.height = 512;
        const bumpCtx = bumpCanvas.getContext('2d');
        this.createMoonBumpMap(bumpCtx, bumpCanvas.width, bumpCanvas.height, moonType);
        const bumpTexture = new this.THREE.CanvasTexture(bumpCanvas);
        
        // Create material with the texture and bump map
        const material = new this.THREE.MeshStandardMaterial({
            map: texture,
            bumpMap: bumpTexture,
            bumpScale: 0.05,
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Create the mesh and add it to the scene
        this.moonMesh = new this.THREE.Mesh(geometry, material);
        this.moonScene.add(this.moonMesh);
        
        // Start the animation
        this.animateMoon();
    }

    // Helper to create the base texture for different moon types
    createMoonBaseTexture(ctx, width, height, moonType) {
        // Base colors for different moon types
        let baseColor, spotColor;
        
        switch(moonType) {
            case 'earths-moon':
                baseColor = '#c0c0c0';
                spotColor = '#a0a0a0';
                break;
            case 'volcanic':
                baseColor = '#c8a060';
                spotColor = '#f8c040';
                break;
            case 'icy':
                baseColor = '#e0f0ff';
                spotColor = '#c0e0f0';
                break;
            case 'mars-moon':
                baseColor = '#d0a080';
                spotColor = '#b08060';
                break;
            case 'gas-giant-moon':
                baseColor = '#d0d0d8';
                spotColor = '#a0a0b0';
                break;
            default:
                baseColor = '#c0c0c0';
                spotColor = '#a0a0a0';
        }
        
        // Fill the base color
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, width, height);
        
        // Create a noisy background for texture variation
        for (let i = 0; i < width * height / 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 1 + Math.random() * 3;
            const opacity = 0.1 + Math.random() * 0.2;
            
            ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add larger spots/regions
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 20 + Math.random() * 60;
            const opacity = 0.1 + Math.random() * 0.3;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, spotColor);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // For volcanic moons, add lava patterns
        if (moonType === 'volcanic') {
            for (let i = 0; i < 15; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = 5 + Math.random() * 25;
                
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
                gradient.addColorStop(0, 'rgba(255, 100, 0, 0.7)');
                gradient.addColorStop(0.7, 'rgba(200, 50, 0, 0.3)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // For icy moons, add bright reflective regions
        if (moonType === 'icy') {
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const size = 10 + Math.random() * 40;
                
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
                gradient.addColorStop(0.7, 'rgba(200, 250, 255, 0.3)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // Helper to add surface details for different moon types
    addMoonSurfaceDetails(ctx, width, height, moonType) {
        // Add craters appropriate to the moon type
        let maxCraters = 100;
        let craterColor1, craterColor2;
        
        switch(moonType) {
            case 'earths-moon':
                maxCraters = 200;
                craterColor1 = 'rgba(50, 50, 50, 0.6)';
                craterColor2 = 'rgba(180, 180, 180, 0.5)';
                break;
            case 'volcanic':
                maxCraters = 50;
                craterColor1 = 'rgba(80, 30, 0, 0.6)';
                craterColor2 = 'rgba(200, 150, 0, 0.5)';
                break;
            case 'icy':
                maxCraters = 70;
                craterColor1 = 'rgba(70, 100, 120, 0.5)';
                craterColor2 = 'rgba(220, 240, 255, 0.6)';
                break;
            case 'mars-moon':
                maxCraters = 300; // Mars moons are heavily cratered
                craterColor1 = 'rgba(60, 40, 30, 0.6)';
                craterColor2 = 'rgba(180, 150, 120, 0.5)';
                break;
            case 'gas-giant-moon':
                maxCraters = 150;
                craterColor1 = 'rgba(50, 50, 60, 0.6)';
                craterColor2 = 'rgba(160, 160, 180, 0.5)';
                break;
            default:
                maxCraters = 100;
                craterColor1 = 'rgba(50, 50, 50, 0.6)';
                craterColor2 = 'rgba(180, 180, 180, 0.5)';
        }
        
        // Draw craters with varied sizes
        for (let i = 0; i < maxCraters; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const outerRadius = 3 + Math.random() * 25;
            const innerRadius = outerRadius * 0.8;
            
            // Outer crater rim (lighter)
            const rimGradient = ctx.createRadialGradient(
                x, y, innerRadius * 0.8,
                x, y, outerRadius
            );
            rimGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            rimGradient.addColorStop(0.7, craterColor2);
            rimGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = rimGradient;
            ctx.beginPath();
            ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner crater (darker)
            const craterGradient = ctx.createRadialGradient(
                x, y, 0,
                x, y, innerRadius
            );
            craterGradient.addColorStop(0, craterColor1);
            craterGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.3)');
            craterGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = craterGradient;
            ctx.beginPath();
            ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add special features based on moon type
        switch(moonType) {
            case 'earths-moon':
                // Add mare (dark areas)
                this.addLargeDarkPatches(ctx, width, height, 6, 'rgba(50, 50, 60, 0.3)');
                break;
            case 'volcanic':
                // Add volcanic features
                this.addVolcanicFeatures(ctx, width, height);
                break;
            case 'icy':
                // Add ice cracks
                this.addIceCracks(ctx, width, height);
                break;
            case 'mars-moon':
                // Add irregular shape simulation
                this.addIrregularEdges(ctx, width, height);
                break;
        }
    }

    // Helper to create bump map for 3D terrain effect
    createMoonBumpMap(ctx, width, height, moonType) {
        // Clear canvas
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        
        // Draw noise pattern
        for (let i = 0; i < width * height / 50; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 1 + Math.random() * 4;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw crater bumps
        let maxCraters = 150;
        if (moonType === 'mars-moon') maxCraters = 300;
        if (moonType === 'volcanic') maxCraters = 70;
        
        for (let i = 0; i < maxCraters; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const outerRadius = 3 + Math.random() * 25;
            const innerRadius = outerRadius * 0.8;
            
            // Crater rim (bright in bump map = raised)
            const rimGradient = ctx.createRadialGradient(
                x, y, innerRadius * 0.8,
                x, y, outerRadius
            );
            rimGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            rimGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
            rimGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = rimGradient;
            ctx.beginPath();
            ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Crater depression (dark in bump map = lowered)
            const craterGradient = ctx.createRadialGradient(
                x, y, 0,
                x, y, innerRadius
            );
            craterGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
            craterGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.4)');
            craterGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = craterGradient;
            ctx.beginPath();
            ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add specific bump features for each moon type
        switch(moonType) {
            case 'volcanic':
                // Raised volcanic features
                for (let i = 0; i < 15; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const size = 10 + Math.random() * 30;
                    
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
                    gradient.addColorStop(0, 'white');
                    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            case 'icy':
                // Add crack bump patterns
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 2;
                for (let i = 0; i < 30; i++) {
                    const x1 = Math.random() * width;
                    const y1 = Math.random() * height;
                    const length = 20 + Math.random() * 100;
                    const angle = Math.random() * Math.PI * 2;
                    const x2 = x1 + Math.cos(angle) * length;
                    const y2 = y1 + Math.sin(angle) * length;
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
                break;
        }
    }

    // Helper to add large dark patches (mare on Moon)
    addLargeDarkPatches(ctx, width, height, count, color) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 50 + Math.random() * 150;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Helper to add volcanic features
    addVolcanicFeatures(ctx, width, height) {
        // Add lava flows
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            
            // Random flow direction
            const angle = Math.random() * Math.PI * 2;
            const length = 30 + Math.random() * 100;
            
            // Create flow path
            ctx.beginPath();
            ctx.moveTo(x, y);
            
            let currentX = x;
            let currentY = y;
            const segments = 5 + Math.floor(Math.random() * 5);
            
            for (let j = 0; j < segments; j++) {
                const segmentLength = length / segments;
                const wiggle = Math.random() * 20 - 10;
                const newX = currentX + Math.cos(angle + wiggle * 0.1) * segmentLength;
                const newY = currentY + Math.sin(angle + wiggle * 0.1) * segmentLength;
                
                ctx.lineTo(newX, newY);
                currentX = newX;
                currentY = newY;
            }
            
            ctx.lineWidth = 5 + Math.random() * 10;
            ctx.strokeStyle = `rgba(${200 + Math.random() * 55}, ${100 + Math.random() * 50}, 0, 0.6)`;
            ctx.stroke();
        }
        
        // Add volcanic calderas
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 10 + Math.random() * 25;
            
            // Caldera depression
            const gradient1 = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient1.addColorStop(0, 'rgba(80, 0, 0, 0.8)');
            gradient1.addColorStop(0.5, 'rgba(150, 50, 0, 0.6)');
            gradient1.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Caldera rim
            const rimSize = size * 1.2;
            const gradient2 = ctx.createRadialGradient(x, y, size * 0.9, x, y, rimSize);
            gradient2.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient2.addColorStop(0.5, 'rgba(180, 100, 50, 0.7)');
            gradient2.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient2;
            ctx.beginPath();
            ctx.arc(x, y, rimSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Helper to add ice cracks for icy moons
    addIceCracks(ctx, width, height) {
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
        ctx.lineWidth = 3;
        
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const length = 50 + Math.random() * 150;
            const angle = Math.random() * Math.PI * 2;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            
            let currentX = x;
            let currentY = y;
            const segments = 3 + Math.floor(Math.random() * 5);
            
            for (let j = 0; j < segments; j++) {
                const segmentLength = length / segments;
                const wiggle = Math.random() * 0.5 - 0.25;
                const newX = currentX + Math.cos(angle + wiggle) * segmentLength;
                const newY = currentY + Math.sin(angle + wiggle) * segmentLength;
                
                ctx.lineTo(newX, newY);
                currentX = newX;
                currentY = newY;
            }
            
            ctx.stroke();
        }
        
        // Add bright ice patches
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 10 + Math.random() * 30;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
            gradient.addColorStop(0.7, 'rgba(200, 240, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Helper to simulate irregular moon edges for small moons
    addIrregularEdges(ctx, width, height) {
        // This is a simplified simulation of irregular shape
        // We'll add dark patches near the edges to simulate an irregular shape
        const edgeCount = 15;
        const edgeRadius = 100;
        
        for (let i = 0; i < edgeCount; i++) {
            // Position mostly near the edge of the texture
            const angle = (i / edgeCount) * Math.PI * 2;
            const distanceFromCenter = (width / 2) * 0.8; // 80% of the way to the edge
            
            const x = (width / 2) + Math.cos(angle) * distanceFromCenter;
            const y = (height / 2) + Math.sin(angle) * distanceFromCenter;
            
            // Create large dark patch that extends beyond the visible sphere
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, edgeRadius);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
            gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.4)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, edgeRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Method to animate the moon
    animateMoon() {
        // Rotate the moon
        if (this.moonMesh) {
            this.moonMesh.rotation.y += 0.01;
        }
        
        // Render the scene
        if (this.moonRenderer && this.moonScene && this.moonCamera) {
            this.moonRenderer.render(this.moonScene, this.moonCamera);
        }
        
        // Continue animation
        this.moonAnimation = requestAnimationFrame(() => this.animateMoon());
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.isAutoRotating && !this.isDragging) {
            Object.values(this.planets).forEach(planet => {
                if (planet) {
                    planet.rotation.y += 0.005;
                }
            });
        }

        if (this.controls) {
            this.controls.update();
        }

        this.renderer.render(this.scene, this.camera);
    }
}

export default PlanetExplorer;