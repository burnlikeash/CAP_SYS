// Clean Database-Only Product Data Integration

// Fallback data when database is not available
const FALLBACK_PRODUCTS = [
    {
        id: 1,
        name: "iPhone 15 Pro",
        brand: "Apple",
        category: "Smartphones",
        description: "Exceptional camera quality and performance. Users praise the titanium build and improved battery life. The Action Button is a welcome addition that enhances daily usability.",
        sentiment: "positive",
        rating: 4.5,
        icon: "📱"
    },
    {
        id: 2,
        name: "Samsung Galaxy S24",
        brand: "Samsung",
        category: "Smartphones",
        description: "Outstanding display quality and AI features. Users appreciate the improved camera system and longer software support. Great value for flagship features.",
        sentiment: "positive",
        rating: 4.3,
        icon: "📱"
    },
    {
        id: 3,
        name: "MacBook Air M3",
        brand: "Apple",
        category: "Laptops",
        description: "Incredible performance and battery life. Users love the silent operation and crisp display. Perfect for productivity and creative work with excellent build quality.",
        sentiment: "positive",
        rating: 4.6,
        icon: "💻"
    },
    {
        id: 4,
        name: "Sony WH-1000XM5",
        brand: "Sony",
        category: "Headphones",
        description: "Best-in-class noise cancellation and audio quality. Users highlight the comfortable fit and excellent call quality. Premium headphones worth the investment.",
        sentiment: "positive",
        rating: 4.4,
        icon: "🎧"
    },
    {
        id: 5,
        name: "Tesla Model 3",
        brand: "Tesla",
        category: "Electric Vehicles",
        description: "Revolutionary electric vehicle with impressive range and technology. Users praise the autopilot features and over-the-air updates. Sustainable luxury redefined.",
        sentiment: "positive",
        rating: 4.2,
        icon: "🚗"
    },
    {
        id: 6,
        name: "Nintendo Switch OLED",
        brand: "Nintendo",
        category: "Gaming",
        description: "Enhanced gaming experience with vibrant OLED display. Users enjoy the improved kickstand and better audio. Perfect for both handheld and docked gaming.",
        sentiment: "positive",
        rating: 4.3,
        icon: "🎮"
    }
];

const FALLBACK_BRANDS = [
    "All Brands",
    "Apple",
    "Samsung",
    "Google",
    "Sony",
    "Microsoft",
    "Tesla",
    "Nintendo",
    "Dell",
    "HP"
];

let TOPICS = [];

const FILTERS = [
    { name: "Positive", type: "sentiment", value: "positive" },
    { name: "Negative", type: "sentiment", value: "negative" },
    { name: "Price: High", type: "price", value: "high" },
    { name: "Price: Low", type: "price", value: "low" }
];

// Database-only data manager
class DataManager {
    constructor() {
        this.products = [];
        this.brands = [];
        this.topics = [];
        this.isLoading = false;
        this.useDatabase = true;
        this.lastFetch = null;
        this.fetchInterval = 5 * 60 * 1000; // 5 minutes
    }

    async initialize() {
        console.log('Initializing DataManager - Database Only Mode...');
        
        // Check if Database API is available
        const apiAvailable = await this.checkApiAvailability();
        
        if (apiAvailable && this.useDatabase) {
            await this.loadFromDatabase();
        } else {
            console.log('Database API not available, using fallback data');
            this.loadFallbackData();
        }
    }

    async checkApiAvailability() {
        try {
            const response = await fetch('http://localhost:8000/', {
                method: 'GET',
                timeout: 3000
            });
            return response.ok;
        } catch (error) {
            console.log('Database API not available:', error.message);
            return false;
        }
    }

    async loadFromDatabase() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            console.log('Loading data from database via Database API...');

            // Load brands first
            const brandsData = await window.apiService.getBrands();
            this.brands = ['All Brands', ...brandsData.map(b => b.brand_name)];

            // Load all phones with their processed data
            const phonesData = await window.apiService.getAllPhones();

            // Derive unique topics across phones
            const topicSet = new Set();
            phonesData.forEach(p => {
                if (typeof p.topics === 'string' && p.topics.trim().length > 0) {
                    p.topics.split(',').forEach(t => topicSet.add(t.trim()))
                }
            });
            this.topics = Array.from(topicSet).filter(Boolean);

            // Transform database phones to frontend format
            this.products = await Promise.all(
                phonesData.map(async (phone) => {
                    try {
                        const sentiments = await window.apiService.getSentimentsByPhone(phone.phone_id);
                        return window.apiService.transformPhoneData(phone, sentiments.sentiments || {});
                    } catch (error) {
                        console.warn(`Failed to get sentiments for phone ${phone.phone_id}:`, error);
                        return window.apiService.transformPhoneData(phone, {});
                    }
                })
            );

            console.log(`✅ Loaded ${this.products.length} products from database`);
            this.lastFetch = Date.now();

        } catch (error) {
            console.error('❌ Failed to load from database:', error);
            this.loadFallbackData();
        } finally {
            this.isLoading = false;
        }
    }

    loadFallbackData() {
        console.log('📦 Loading fallback data...');
        this.products = [...FALLBACK_PRODUCTS];
        this.brands = [...FALLBACK_BRANDS];
        TOPICS = ["Smartphones","Laptops","Headphones","Cameras","Gaming","Wearables"];
        this.useDatabase = false;
    }

    async refreshData() {
        if (this.useDatabase && !this.isLoading) {
            const now = Date.now();
            if (!this.lastFetch || (now - this.lastFetch) > this.fetchInterval) {
                console.log('🔄 Refreshing data from database...');
                await this.loadFromDatabase();
                
                // Notify components about data refresh
                document.dispatchEvent(new CustomEvent('dataRefreshed', {
                    detail: { 
                        products: this.products, 
                        brands: this.brands 
                    }
                }));
            } else {
                console.log('⏰ Data is fresh, skipping refresh');
            }
        }
    }

    getProducts() {
        return this.products;
    }

    getBrands() {
        return this.brands;
    }

    getTopics() {
        return this.useDatabase ? this.topics : TOPICS;
    }

    async searchProducts(query, filters = {}) {
        if (this.useDatabase && !this.isLoading) {
            try {
                // Use database search if available
                const searchParams = new URLSearchParams();
                searchParams.append('query', query);
                
                if (filters.sentiment) {
                    searchParams.append('sentiment_filter', filters.sentiment);
                }
                if (filters.brand && filters.brand !== 'All Brands') {
                    // Find brand ID
                    const brands = await window.apiService.getBrands();
                    const brand = brands.find(b => b.brand_name === filters.brand);
                    if (brand) {
                        searchParams.append('brand_filter', brand.brand_id);
                    }
                }

                const searchResults = await window.apiService.apiCall(`/search?${searchParams.toString()}`);
                
                // Transform search results to frontend format
                return searchResults.phones.map(phone => 
                    window.apiService.transformPhoneData(phone, {})
                );
            } catch (error) {
                console.warn('Database search failed, using local filter:', error);
            }
        }

        // Fallback to local filtering
        return this.products.filter(product => {
            const searchTerm = query.toLowerCase();
            const productText = `${product.name} ${product.description} ${product.brand}`.toLowerCase();
            return productText.includes(searchTerm);
        });
    }

    async getPhoneDetails(phoneId) {
        if (this.useDatabase) {
            try {
                return await window.apiService.getCompletePhoneData(phoneId);
            } catch (error) {
                console.error('Failed to get phone details from database:', error);
            }
        }

        // Fallback to local data
        return this.products.find(p => p.id === phoneId);
    }

    toggleDatabaseMode(enabled) {
        this.useDatabase = enabled;
        if (enabled) {
            this.initialize();
        } else {
            this.loadFallbackData();
        }
        
        console.log(`Database mode ${enabled ? 'enabled' : 'disabled'}`);
        
        // Emit status change event
        document.dispatchEvent(new CustomEvent('databaseStatusChanged', {
            detail: { status: this.getDataStatus() }
        }));
    }

    isUsingDatabase() {
        return this.useDatabase && this.products.length > 0 && this.lastFetch !== null;
    }

    getDataStatus() {
        return {
            usingDatabase: this.isUsingDatabase(),
            productsCount: this.products.length,
            brandsCount: this.brands.length,
            lastFetch: this.lastFetch,
            isLoading: this.isLoading
        };
    }

    // Get processing statistics from database
    async getProcessingStats() {
        if (!this.useDatabase) {
            return {
                totalReviews: 'N/A',
                processedSentiments: 'N/A',
                totalTopics: 'N/A',
                message: 'Using fallback data'
            };
        }

        try {
            const stats = await window.apiService.apiCall('/stats');
            return {
                totalReviews: stats.reviews || 0,
                processedSentiments: stats.processed_sentiments || 0,
                totalTopics: stats.topics || 0,
                totalBrands: stats.brands || 0,
                totalPhones: stats.phones || 0,
                message: 'Data from database'
            };
        } catch (error) {
            console.error('Failed to get processing stats:', error);
            return {
                totalReviews: 'Error',
                processedSentiments: 'Error',
                totalTopics: 'Error',
                message: 'Failed to fetch stats'
            };
        }
    }
}

// Create global data manager instance
window.dataManager = new DataManager();

// Legacy exports for backward compatibility
let SAMPLE_PRODUCTS = [];
let BRANDS = [];

// Initialize data when script loads
document.addEventListener('DOMContentLoaded', async () => {
    await window.dataManager.initialize();
    
    // Update legacy variables for backward compatibility
    SAMPLE_PRODUCTS = window.dataManager.getProducts();
    BRANDS = window.dataManager.getBrands();
    
    // Notify that initial data is ready
    document.dispatchEvent(new CustomEvent('dataInitialized'));
});

// Auto-refresh data from database every 5 minutes
setInterval(async () => {
    if (window.dataManager && window.dataManager.isUsingDatabase()) {
        await window.dataManager.refreshData();
    }
}, 5 * 60 * 1000);