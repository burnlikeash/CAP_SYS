// Main Application Entry Point

class SentimentScopeApp {
    constructor() {
        this.components = {};
        this.isInitialized = false;
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeComponents();
            });
        } else {
            this.initializeComponents();
        }
    }

    initializeComponents() {
        try {
            // Initialize all components
            this.components.header = new HeaderComponent();
            this.components.dropdown = new DropdownComponent();
            this.components.search = new SearchComponent();
            this.components.filters = new FilterComponent();
            this.components.productCards = new ProductCardsComponent();

            // Setup global event listeners
            this.setupGlobalEventListeners();

            // Mark as initialized
            this.isInitialized = true;

            console.log('SentimentScope application initialized successfully');
        } catch (error) {
            console.error('Error initializing SentimentScope:', error);
            this.handleInitializationError(error);
        }
    }

    setupGlobalEventListeners() {
        // Handle view review requests
        document.addEventListener('viewReviewRequested', (e) => {
            this.handleViewReview(e.detail.product);
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeydown(e);
        });

        // Handle window resize
        window.addEventListener('resize', debounce(() => {
            this.handleWindowResize();
        }, 250));

        // Handle browser back/forward navigation
        window.addEventListener('popstate', (e) => {
            this.handlePopState(e);
        });
    }

    handleViewReview(product) {
        // Create and show modal or navigate to detailed view
        console.log('Opening detailed view for:', product.name);
        
        // Example modal implementation (you can enhance this)
        this.showProductModal(product);
    }

    showProductModal(product) {
        // Create modal overlay
        const modal = createElement('div', ['product-modal']);
        modal.innerHTML = `
            <div class="modal-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            ">
                <div class="modal-content" style="
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 90%;
                    max-height: 80vh;
                    overflow-y: auto;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h2 style="margin: 0; color: #111827;">${product.name}</h2>
                        <button class="close-modal" style="
                            background: none;
                            border: none;
                            font-size: 1.5rem;
                            cursor: pointer;
                            color: #6b7280;
                        ">×</button>
                    </div>
                    <div style="text-align: center; margin-bottom: 1rem;">
                        <div style="font-size: 4rem; margin-bottom: 0.5rem;">${product.icon}</div>
                        <span style="
                            display: inline-block;
                            padding: 0.25rem 0.75rem;
                            background: ${product.sentiment === 'positive' ? '#dcfce7' : product.sentiment === 'negative' ? '#fee2e2' : '#fef3c7'};
                            color: ${product.sentiment === 'positive' ? '#166534' : product.sentiment === 'negative' ? '#991b1b' : '#92400e'};
                            border-radius: 20px;
                            font-size: 0.875rem;
                            font-weight: 500;
                        ">
                            ${capitalize(product.sentiment)} Reviews
                        </span>
                    </div>
                    <p style="color: #6b7280; line-height: 1.6; margin-bottom: 1rem;">
                        ${product.description}
                    </p>
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding-top: 1rem;
                        border-top: 1px solid #f3f4f6;
                    ">
                        <span style="color: #9ca3af; font-size: 0.875rem;">Brand: ${product.brand}</span>
                        <span style="color: #9ca3af; font-size: 0.875rem;">Category: ${product.category}</span>
                    </div>
                </div>
            </div>
        `;

        // Add to document
        document.body.appendChild(modal);

        // Handle close
        const closeBtn = modal.querySelector('.close-modal');
        const overlay = modal.querySelector('.modal-overlay');
        
        const closeModal = () => {
            modal.remove();
        };

        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });

        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    handleGlobalKeydown(event) {
        // Global keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch(event.key) {
                case 'k':
                    event.preventDefault();
                    this.components.search.focusSearch();
                    break;
                case '/':
                    event.preventDefault();
                    this.components.search.focusSearch();
                    break;
            }
        }

        // Escape key to clear search
        if (event.key === 'Escape') {
            this.components.search.clearSearch();
        }
    }

    handleWindowResize() {
        // Handle responsive behavior
        console.log('Window resized');
        
        // You can add responsive logic here
        // For example, collapsing mobile navigation
    }

    handlePopState(event) {
        // Handle browser navigation
        console.log('Browser navigation event');
        
        // You can add routing logic here
    }

    handleInitializationError(error) {
        // Show user-friendly error message
        const errorMessage = createElement('div', ['error-message']);
        errorMessage.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fee2e2;
                color: #991b1b;
                padding: 1rem;
                border-radius: 8px;
                border: 1px solid #fca5a5;
                z-index: 10000;
            ">
                <strong>Initialization Error:</strong><br>
                ${error.message}
            </div>
        `;
        
        document.body.appendChild(errorMessage);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            errorMessage.remove();
        }, 5000);
    }

    // Public API methods
    getComponent(name) {
        return this.components[name];
    }

    isReady() {
        return this.isInitialized;
    }
}

// Initialize the application
const app = new SentimentScopeApp();

// Make app available globally for debugging
window.SentimentScope = app;