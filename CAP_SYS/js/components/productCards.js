// Product Cards Component Logic - Updated for Single Filter

class ProductCardsComponent {
    constructor() {
        this.resultsGrid = document.querySelector('.results-grid');
        this.products = SAMPLE_PRODUCTS;
        this.filteredProducts = [...this.products];
        this.currentFilters = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderProducts();
    }

    setupEventListeners() {
        // Listen for filter changes
        document.addEventListener('filtersChanged', (e) => {
            this.currentFilters = e.detail.filters;
            this.filterAndRenderProducts();
        });

        // Listen for initial load
        document.addEventListener('DOMContentLoaded', () => {
            this.renderProducts();
        });
    }

    filterAndRenderProducts() {
        // Apply filters to products
        this.filteredProducts = this.applyFilters(this.products, this.currentFilters);
        
        // Re-render with animation
        this.renderProductsWithAnimation();
    }

    applyFilters(products, filters) {
        return products.filter(product => {
            // Filter by sentiment (from sentiment buttons)
            if (filters.sentiment && product.sentiment !== filters.sentiment) {
                return false;
            }
            
            // Filter by brand
            if (filters.brand && filters.brand !== 'All Brands' && filters.brand !== 'BRANDS') {
                if (product.brand !== filters.brand) {
                    return false;
                }
            }
            
            // Filter by topic/category
            if (filters.topic && product.category !== filters.topic) {
                return false;
            }
            
            // Filter by search term
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const productText = `${product.name} ${product.description} ${product.brand}`.toLowerCase();
                if (!productText.includes(searchTerm)) {
                    return false;
                }
            }
            
            // Apply the single active filter
            if (filters.activeFilter) {
                const filter = filters.activeFilter;
                
                switch(filter.type) {
                    case 'sentiment':
                        if (product.sentiment !== filter.value) {
                            return false;
                        }
                        break;
                    case 'price':
                        // Example price filtering logic
                        if (filter.value === 'high') {
                            // Assume products with rating > 4.0 are high-priced premium items
                            if (product.rating <= 4.0) {
                                return false;
                            }
                        } else if (filter.value === 'low') {
                            // Assume products with rating <= 4.0 are budget-friendly
                            if (product.rating > 4.0) {
                                return false;
                            }
                        }
                        break;
                    case 'rating':
                        if (filter.value === 'high' && product.rating < 4.5) {
                            return false;
                        } else if (filter.value === 'low' && product.rating >= 4.0) {
                            return false;
                        }
                        break;
                    // Add more filter types as needed
                    default:
                        console.log('Unknown filter type:', filter.type);
                }
            }
            
            return true;
        });
    }

    renderProducts() {
        // Clear existing products
        this.resultsGrid.innerHTML = '';
        
        // Show message if no products found
        if (this.filteredProducts.length === 0) {
            this.showNoResultsMessage();
            return;
        }
        
        // Render each product
        this.filteredProducts.forEach((product, index) => {
            const productCard = this.createProductCard(product);
            
            // Add staggered animation delay
            productCard.style.opacity = '0';
            productCard.style.transform = 'translateY(20px)';
            
            this.resultsGrid.appendChild(productCard);
            
            // Animate in
            setTimeout(() => {
                productCard.style.transition = 'all 0.3s ease';
                productCard.style.opacity = '1';
                productCard.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    renderProductsWithAnimation() {
        // Fade out existing products
        const existingCards = this.resultsGrid.querySelectorAll('.product-card');
        
        if (existingCards.length === 0) {
            this.renderProducts();
            return;
        }

        // Animate out existing cards
        existingCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transition = 'all 0.2s ease';
                card.style.opacity = '0';
                card.style.transform = 'translateY(-10px)';
            }, index * 20);
        });

        // Render new products after animation
        setTimeout(() => {
            this.renderProducts();
        }, 300);
    }

    createProductCard(product) {
        // Create card container
        const card = createElement('div', ['product-card']);
        
        // Create product header
        const header = createElement('div', ['product-header']);
        
        // Product image/icon
        const image = createElement('div', ['product-image']);
        image.textContent = product.icon || '📦';
        
        // Product info
        const info = createElement('div', ['product-info']);
        const title = createElement('h3', [], product.name);
        info.appendChild(title);
        
        header.appendChild(image);
        header.appendChild(info);
        
        // Product description
        const description = createElement('p', ['product-description'], product.description);
        
        // Product footer
        const footer = createElement('div', ['product-footer']);
        
        // Rating with improved display
        const rating = createElement('span', ['rating', product.sentiment]);
        rating.innerHTML = `
            <span style="font-weight: 600;">Rating:</span> 
            ${capitalize(product.sentiment)} 
            <span style="color: #9ca3af; font-size: 0.8em;">(${product.rating}/5)</span>
        `;
        
        // View review link
        const viewReview = createElement('a', ['view-review'], 'View Full Review', {
            href: '#',
            'data-product-id': product.id
        });
        
        // Add click handler for view review
        viewReview.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleViewReview(product);
        });
        
        footer.appendChild(rating);
        footer.appendChild(viewReview);
        
        // Assemble card
        card.appendChild(header);
        card.appendChild(description);
        card.appendChild(footer);
        
        // Add hover effects
        this.addHoverEffects(card);
        
        return card;
    }

    addHoverEffects(card) {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    }

    handleViewReview(product) {
        // Handle viewing full review
        console.log('Viewing full review for:', product.name);
        
        // Emit event for main app to handle
        document.dispatchEvent(new CustomEvent('viewReviewRequested', {
            detail: { product }
        }));
    }

    showNoResultsMessage() {
        const message = createElement('div', ['no-results']);
        message.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #6b7280;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem; color: #374151;">No products found</h3>
                <p>Try adjusting your filters or search terms</p>
                <button onclick="window.SentimentScope.getComponent('filters').clearAllFilters()" 
                        style="
                            margin-top: 1rem;
                            padding: 0.5rem 1rem;
                            background: #3b82f6;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 500;
                        ">
                    Clear All Filters
                </button>
            </div>
        `;
        
        this.resultsGrid.appendChild(message);
    }

    // Public methods for external control
    setProducts(products) {
        this.products = products;
        this.filteredProducts = [...products];
        this.renderProducts();
    }

    addProduct(product) {
        this.products.push(product);
        this.filterAndRenderProducts();
    }

    removeProduct(productId) {
        this.products = this.products.filter(p => p.id !== productId);
        this.filterAndRenderProducts();
    }

    getFilteredProducts() {
        return this.filteredProducts;
    }

    // Method to get current filter summary for display
    getFilterSummary() {
        const filters = this.currentFilters;
        const summary = [];
        
        if (filters.sentiment) {
            summary.push(`Sentiment: ${capitalize(filters.sentiment)}`);
        }
        
        if (filters.brand && filters.brand !== 'All Brands' && filters.brand !== 'BRANDS') {
            summary.push(`Brand: ${filters.brand}`);
        }
        
        if (filters.topic) {
            summary.push(`Category: ${filters.topic}`);
        }
        
        if (filters.activeFilter) {
            summary.push(`Filter: ${filters.activeFilter.name}`);
        }
        
        if (filters.search) {
            summary.push(`Search: "${filters.search}"`);
        }
        
        return summary;
    }
}