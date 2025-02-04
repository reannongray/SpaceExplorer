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
    static CACHE_DURATION = 24 * 60 * 60 * 1000;
    static cache = new Map();
    static rateLimiter = new RateLimiter(5);
    static debug = {
      enabled: true,
      logs: [],
      errors: [],
      requestStats: {
        total: 0,
        successful: 0,
        failed: 0,
        cached: 0
      },
      log: (message, data = null) => {
        if (!NasaService.debug.enabled) return;
        const entry = { timestamp: new Date().toISOString(), message, data };
        NasaService.debug.logs.push(entry);
      },
      error: (message, error = null) => {
        const entry = { 
          timestamp: new Date().toISOString(), 
          message, 
          error, 
          stack: error?.stack 
        };
        NasaService.debug.errors.push(entry);
        console.error(`[NasaService Error] ${message}`, error || '');
      }
    };
  
    // Core API Methods
    static async getAPOD() {
      const cacheKey = 'apod';
      try {
        this.debug.requestStats.total++;
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
          this.debug.requestStats.cached++;
          this.debug.log('Using cached APOD data');
          return cachedData;
        }
  
        this.debug.log('Fetching APOD data');
        const url = `${this.BASE_URL}/planetary/apod?api_key=${this.API_KEY}`;
        const data = await this.fetchWithRetry(url, cacheKey);
        this.debug.requestStats.successful++;
        return data;
      } catch (error) {
        this.debug.requestStats.failed++;
        this.debug.error('APOD fetch error:', error);
        throw this.createNASAError('APOD_ERROR', error.message);
      }
    }
  
    // eslint-disable-next-line max-len
    static async getNeoFeed(startDate = this.getFormattedDate(0), endDate = this.getFormattedDate(7)) {
      const cacheKey = `neo-${startDate}-${endDate}`;
      try {
        this.debug.requestStats.total++;
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
          this.debug.requestStats.cached++;
          return cachedData;
        }
  
        const url = `${this.BASE_URL}/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${this.API_KEY}`;
        const data = await this.fetchWithRetry(url, cacheKey);
        this.debug.requestStats.successful++;
        return data;
      } catch (error) {
        this.debug.requestStats.failed++;
        this.debug.error('NEO feed fetch error:', error);
        throw this.createNASAError('NEO_ERROR', error.message);
      }
    }
  
    // Space Events Methods
    static async getSolarEvents() {
      const cacheKey = 'solar-events';
      try {
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
          return cachedData;
        }
  
        const endDate = this.getFormattedDate(0);
        const startDate = this.getFormattedDate(-30);
        const url = `${this.BASE_URL}/DONKI/CME?startDate=${startDate}&endDate=${endDate}&api_key=${this.API_KEY}`;
        const data = await this.fetchWithRetry(url, cacheKey);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        this.debug.error('Solar events fetch error:', error);
        return [];
      }
    }
  
    static async fetchPlanetaryEventDetails(event) {
      if (!event?.planet) {
        return {};
      }
  
      const cacheKey = `planetary-${event.planet.toLowerCase()}`;
      try {
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
          return cachedData;
        }
  
        const url = `${this.BASE_URL}/planetary/bodies/${event.planet.toLowerCase()}?api_key=${this.API_KEY}`;
        const data = await this.fetchWithRetry(url, cacheKey);
        return {
          details: data,
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        this.debug.error('Planetary details fetch error:', error);
        return {};
      }
    }
  
    static async fetchNearEarthObjects() {
      return this.getNeoFeed();
    }
  
    static async fetchEclipseDetails(event) {
      // Currently no direct NASA API for eclipse details
      // Return basic event info
      return {
        type: 'eclipse',
        details: event,
        lastUpdated: new Date().toISOString()
      };
    }
  
    static async fetchMeteorShowerDetails(event) {
      // Currently no direct NASA API for meteor shower details
      // Return basic event info
      return {
        type: 'meteor',
        details: event,
        lastUpdated: new Date().toISOString()
      };
    }
  
    static async fetchSpaceMissions() {
      const cacheKey = 'space-missions';
      try {
        const cachedData = this.getFromCache(cacheKey);
        if (cachedData) {
          return cachedData;
        }
  
        // Note: Currently returning empty array as NASA API doesn't directly provide mission data
        // This could be expanded to use other space agency APIs
        return [];
      } catch (error) {
        this.debug.error('Space missions fetch error:', error);
        return [];
      }
    }
  
    static async getPlanetaryData(planetName) {
        try {
            const url = `https://api.nasa.gov/planetary/bodies/${planetName.toLowerCase()}?api_key=${this.API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error fetching planetary data for ${planetName}:`, error);
            return null;
        }
    }

    static async getAsteroidData() {
        try {
            const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${this.getFormattedDate(0)}&end_date=${this.getFormattedDate(7)}&api_key=${this.API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching asteroid data:', error);
            return null;
        }
    }

    static async getCometData() {
        try {
            const url = `https://api.nasa.gov/neo/rest/v1/comets?api_key=${this.API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching comet data:', error);
            return null;
        }
    }

    static async getSolarFlareData() {
        try {
            const url = `https://api.nasa.gov/DONKI/FLR?startDate=${this.getFormattedDate(-30)}&endDate=${this.getFormattedDate(0)}&api_key=${this.API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching solar flare data:', error);
            return null;
        }
    }

    static async getCoronalMassEjectionData() {
        try {
            const url = `https://api.nasa.gov/DONKI/CME?startDate=${this.getFormattedDate(-30)}&endDate=${this.getFormattedDate(0)}&api_key=${this.API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching coronal mass ejection data:', error);
            return null;
        }
    }
  
    // Utility Methods
    static async fetchWithRetry(url, cacheKey, retries = 3) {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          this.debug.log(`Attempt ${attempt} of ${retries} for URL: ${url}`);
          return await this.rateLimiter.addRequest(() => this.fetchData(url, cacheKey));
        } catch (error) {
          if (attempt === retries) throw error;
          const delay = 1000 * attempt;
          this.debug.log(`Retry attempt ${attempt} failed, waiting ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  
    static async fetchData(url, cacheKey) {
      const startTime = Date.now();
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SpaceExplorer/1.0'
          }
        });
  
        if (!response.ok) {
          throw this.createNASAError(
            'API_ERROR',
            `NASA API error: ${response.status} ${response.statusText}`,
            response.status
          );
        }
  
        const data = await response.json();
        this.setCache(cacheKey, data);
        
        const duration = Date.now() - startTime;
        this.debug.log(`Request completed in ${duration}ms`, { url, status: response.status });
        
        return data;
      } catch (error) {
        const fallbackData = this.getFromCache(cacheKey);
        if (fallbackData) {
          this.debug.log('Using fallback cached data');
          return fallbackData;
        }
        throw error;
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
  
    static createNASAError(code, message, status = 500) {
      return {
        code,
        message,
        status,
        timestamp: new Date().toISOString()
      };
    }
  
    static getFormattedDate(daysOffset = 0) {
      const date = new Date();
      date.setDate(date.getDate() + daysOffset);
      return date.toISOString().split('T')[0];
    }
  
    static cleanCache() {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.CACHE_DURATION) {
          this.cache.delete(key);
        }
      }
    }
  
    static getDebugReport() {
      return {
        stats: this.debug.requestStats,
        cacheSize: this.cache.size,
        recentLogs: this.debug.logs.slice(-50),
        recentErrors: this.debug.errors.slice(-50),
        rateLimiterStatus: {
          queueLength: this.rateLimiter.queue.length,
          requestCount: this.rateLimiter.requestCount
        }
      };
    }
  }
  
  export default NasaService;
  
  setInterval(() => {
    NasaService.cleanCache();
    NasaService.debug.log('Cache cleanup completed');
  }, NasaService.CACHE_DURATION);