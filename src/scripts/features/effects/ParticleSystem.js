class ParticleSystem {
    constructor() {
      this.particles = [];
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.numberOfParticles = 500;
      this.particleMaxSize = 2;
      this.maxVelocity = 0.2;
      this.colors = [
        'rgba(255, 255, 255, 0.9)',
        'rgba(0, 212, 255, 0.8)',
        'rgba(255, 97, 216, 0.8)',
        'rgba(129, 180, 255, 0.8)'
      ];
      this.mouseX = 0;
      this.mouseY = 0;
      this.isActive = false;
    }
  
    async init() {
      try {
        this.setupCanvas();
        this.addEventListeners();
        this.createParticles();
        this.isActive = true;
        this.animate();
        return true;
      } catch (error) {
        console.error('Failed to initialize particle system:', error);
        this.destroy();
        return false;
      }
    }
  
    setupCanvas() {
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.zIndex = '-1';
      this.canvas.style.pointerEvents = 'none';
      this.canvas.className = 'particle-canvas';
      document.body.appendChild(this.canvas);
      this.handleResize();
    }
  
    addEventListeners() {
      window.addEventListener('resize', () => this.handleResize());
      window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }
  
    createParticles() {
      for (let i = 0; i < this.numberOfParticles; i++) {
        const baseColor = this.colors[Math.floor(Math.random() * this.colors.length)];
        this.particles.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          size: Math.random() * this.particleMaxSize + 0.5,
          velocityX: (Math.random() - 0.5) * this.maxVelocity,
          velocityY: (Math.random() - 0.5) * this.maxVelocity,
          color: baseColor,
          glowColor: baseColor.replace(/([\d.]+)\)$/, '0.3)'),
          alpha: Math.random() * 0.5 + 0.5,
          pulse: Math.random() * Math.PI,
          glowSize: Math.random() * 1 + 1
        });
      }
    }
  
    drawParticles() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      
      this.particles.forEach(particle => {
        // Mouse interaction
        const dx = this.mouseX - particle.x;
        const dy = this.mouseY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 100;
        
        if (distance < maxDistance) {
          const influence = (1 - distance / maxDistance) * 0.05;
          particle.velocityX -= dx * influence;
          particle.velocityY -= dy * influence;
        }
  
        // Update position
        particle.velocityX *= 0.99;
        particle.velocityY *= 0.99;
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
  
        // Screen wrapping
        if (particle.x < -50) particle.x = this.canvas.width + 50;
        if (particle.x > this.canvas.width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = this.canvas.height + 50;
        if (particle.y > this.canvas.height + 50) particle.y = -50;
  
        // Pulsing and glow effect
        particle.pulse += 0.02;
        const pulseFactor = Math.sin(particle.pulse) * 0.2 + 0.8;
        const size = particle.size * pulseFactor;
  
        // Draw glow
        const gradient = this.ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, size * particle.glowSize * 2
        );
        
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(0.4, particle.glowColor);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
        // Draw larger glow
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, size * particle.glowSize * 2, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.globalAlpha = particle.alpha * 0.3;
        this.ctx.fill();
  
        // Draw core
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        this.ctx.fillStyle = particle.color;
        this.ctx.globalAlpha = particle.alpha;
        this.ctx.fill();
      });
    }
  
    handleResize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  
    handleMouseMove(e) {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    }
  
    animate() {
      if (!this.isActive) return;
      
      this.drawParticles();
      requestAnimationFrame(() => this.animate());
    }
  
    destroy() {
      this.isActive = false;
      
      window.removeEventListener('resize', this.handleResize);
      window.removeEventListener('mousemove', this.handleMouseMove);
      
      if (this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
  
      this.particles = [];
      this.ctx = null;
    }
  }
  
  export default ParticleSystem;