// Filter Component Logic - Single Active Filter

class FilterComponent {
    constructor() {
        this.sentimentButtons = document.querySelectorAll('.sentiment-btn');
        this.topicButtons = document.querySelectorAll('.topic-btn');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.topicsGrid = document.querySelector('.topics-grid');
        this.filterButtonsContainer = document.querySelector('.filter-buttons');
        
        this.activeFilters = {
            sentiment: null,
            topic: null,
            brand: null,
            search: null,
            activeFilter: null // Only one additional filter can be active
        };
        
        this.init();
    }

    init() {
        this.populateTopics();
        this.populateFilters();
        this.setupEventListeners();
    }

    populateTopics() {
        // Clear existing topics
        this.topicsGrid.innerHTML = '';
        
        // Get topics
        const topics = (window.dataManager && typeof window.dataManager.getTopics === 'function')
            ? window.dataManager.getTopics()
            : TOPICS;
        
        // Shuffle topics randomly
        const shuffled = [...topics].sort(() => 0.5 - Math.random());
        
        // Pick 6 topics (or fewer if less than 6 available)
        const selectedTopics = shuffled.slice(0, 6);
        
        // Add topic buttons
        selectedTopics.forEach(topic => {
            const button = createElement('button', ['topic-btn'], topic);
            button.addEventListener('click', () => this.selectTopic(topic));
            this.topicsGrid.appendChild(button);
        });
        
        // Update topic buttons reference
        this.topicButtons = document.querySelectorAll('.topic-btn');
    }
    

    populateFilters() {
        // Clear existing filters
        this.filterButtonsContainer.innerHTML = '';
        
        // Add label
        const label = createElement('span', [], 'Average Sentiment (Stars):');
        label.style.marginRight = '8px';
        this.filterButtonsContainer.appendChild(label);
    
        // Create star rating buttons 1★ to 5★
        [1, 2, 3, 4, 5].forEach(val => {
            const filter = { name: `${val}★`, type: 'avg_sentiment', value: val };
            const button = createElement('button', ['filter-btn'], `${val}★`, {
                'data-type': filter.type,
                'data-value': String(filter.value)
            });
            button.addEventListener('click', () => this.selectFilter(filter, button));
            this.filterButtonsContainer.appendChild(button);
        });
        
        // Update filter buttons reference
        this.filterButtons = document.querySelectorAll('.filter-btn');
    }
    

    setupEventListeners() {
        // Sentiment buttons
        this.sentimentButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                let sentiment = null;
                if (btn.classList.contains('positive')) sentiment = 'positive';
                else if (btn.classList.contains('negative')) sentiment = 'negative';
                this.selectSentiment(sentiment, btn);
            });
        });

        // Listen for external filter changes
        document.addEventListener('brandChanged', (e) => {
            this.activeFilters.brand = e.detail.selectedBrand;
            this.applyFilters();
        });

        document.addEventListener('searchPerformed', (e) => {
            this.activeFilters.search = e.detail.query;
            this.applyFilters();
        });

        document.addEventListener('searchCleared', () => {
            this.activeFilters.search = null;
            this.applyFilters();
        });
    }

    selectSentiment(sentiment, button) {
        // Remove active class from all sentiment buttons
        this.sentimentButtons.forEach(btn => btn.classList.remove('active'));
        
        // Toggle sentiment selection
        if (this.activeFilters.sentiment === sentiment) {
            this.activeFilters.sentiment = null;
        } else {
            this.activeFilters.sentiment = sentiment;
            button.classList.add('active');
        }
        
        this.applyFilters();
    }

    selectTopic(topic) {
        // Remove active class from all topic buttons
        this.topicButtons.forEach(btn => btn.classList.remove('active'));
        
        // Toggle topic selection
        if (this.activeFilters.topic === topic) {
            this.activeFilters.topic = null;
        } else {
            this.activeFilters.topic = topic;
            // Add active class to clicked topic
            const clickedButton = Array.from(this.topicButtons).find(btn => btn.textContent === topic);
            if (clickedButton) {
                clickedButton.classList.add('active');
            }
        }
        
        this.applyFilters();
    }

    selectFilter(filter, button) {
        // Remove active class from all filter buttons
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        
        // Toggle filter selection - only one can be active at a time
        if (this.activeFilters.activeFilter && 
            this.activeFilters.activeFilter.type === filter.type && 
            this.activeFilters.activeFilter.value === filter.value) {
            // Clicking the same filter deactivates it
            this.activeFilters.activeFilter = null;
        } else {
            // Activate the clicked filter
            this.activeFilters.activeFilter = filter;
            button.classList.add('active');
        }
        
        this.applyFilters();
    }

    applyFilters() {
        // Emit filter change event
        document.dispatchEvent(new CustomEvent('filtersChanged', {
            detail: { filters: this.activeFilters }
        }));
        
        console.log('Active filters:', this.activeFilters);
    }

    clearAllFilters() {
        // Reset all filters
        this.activeFilters = {
            sentiment: null,
            topic: null,
            brand: null,
            search: null,
            activeFilter: null
        };
        
        // Remove active classes
        this.sentimentButtons.forEach(btn => btn.classList.remove('active'));
        this.topicButtons.forEach(btn => btn.classList.remove('active'));
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        
        this.applyFilters();
    }

    getActiveFilters() {
        return this.activeFilters;
    }

    // Helper method to get currently active filter for display
    getActiveFilterName() {
        if (this.activeFilters.activeFilter) {
            return this.activeFilters.activeFilter.name;
        }
        return null;
    }

    // Method to programmatically set a filter
    setActiveFilter(filterName) {
        const targetFilter = FILTERS.find(f => f.name === filterName);
        if (targetFilter) {
            // Clear all filter buttons
            this.filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Activate the target filter
            const targetButton = Array.from(this.filterButtons).find(btn => 
                btn.getAttribute('data-type') === targetFilter.type && 
                btn.getAttribute('data-value') === targetFilter.value
            );
            
            if (targetButton) {
                targetButton.classList.add('active');
                this.activeFilters.activeFilter = targetFilter;
                this.applyFilters();
            }
        }
    }
}