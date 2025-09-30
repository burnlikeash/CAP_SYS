// Main Application Entry Point - Database-Only Integration

// ✅ Utility functions
function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

class SentimentScopeApp {
    constructor() {
        this.components = {};
        this.isInitialized = false;
        this.dataReady = false;
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.waitForDataAndInitialize();
            });
        } else {
            this.waitForDataAndInitialize();
        }
    }

    async waitForDataAndInitialize() {
        // Show loading indicator
        this.showLoadingState();

        // Wait for data to be initialized
        if (!window.dataManager) {
            // Wait a bit for dataManager to be available
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Listen for data initialization
        document.addEventListener('dataInitialized', () => {
            this.dataReady = true;
            this.initializeComponents();
        });

        // If data is already ready, initialize immediately
        if (window.dataManager &&
            typeof window.dataManager.getProducts === 'function' &&
            window.dataManager.getProducts().length > 0) {
            this.dataReady = true;
            this.initializeComponents();
        }

        // Timeout fallback
        setTimeout(() => {
            if (!this.dataReady) {
                console.warn('Data initialization timeout, proceeding with available data');
                this.initializeComponents();
            }
        }, 5000);
    }

    showLoadingState() {
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.9);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                backdrop-filter: blur(4px);
            ">
                <div style="
                    font-size: 2rem;
                    margin-bottom: 1rem;
                    animation: pulse 2s infinite;
                ">📱</div>
                <div style="
                    font-size: 1.2rem;
                    color: #3b82f6;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                ">Loading SentimentScope...</div>
                <div style="
                    color: #6b7280;
                    font-size: 0.9rem;
                ">Connecting to database...</div>
                <div style="
                    margin-top: 1rem;
                    width: 200px;
                    height: 4px;
                    background: #f3f4f6;
                    border-radius: 2px;
                    overflow: hidden;
                ">
                    <div style="
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, #3b82f6, #10b981);
                        animation: loading 2s infinite;
                        border-radius: 2px;
                    "></div>
                </div>
            </div>
            <style>
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            </style>
        `;

        document.body.appendChild(loadingOverlay);
    }

    hideLoadingState() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                loadingOverlay.remove();
            }, 500);
        }
    }

    async initializeComponents() {
        try {
            console.log('Initializing SentimentScope with database integration...');

            // Initialize all components
            this.components.header = new HeaderComponent();
            this.components.dropdown = new DropdownComponent();
            this.components.search = new SearchComponent();
            this.components.filters = new FilterComponent();
            this.components.productCards = new ProductCardsComponent();

            // Setup global event listeners
            this.setupGlobalEventListeners();

            // Setup database-specific event listeners
            this.setupDatabaseEventListeners();

            // Wire Clear All Filters button
            const clearBtn = document.getElementById('clear-filters');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    // Clear filter component state
                    if (this.components.filters && typeof this.components.filters.clearAllFilters === 'function') {
                        this.components.filters.clearAllFilters();
                    }

                    // Reset brand dropdown UI to default and emit event
                    if (this.components.dropdown) {
                        const dropdown = this.components.dropdown;
                        dropdown.selectedBrand = 'BRANDS';
                        const btnText = dropdown.btn.childNodes[0];
                        if (btnText) btnText.textContent = 'BRANDS ';
                        document.dispatchEvent(new CustomEvent('brandChanged', {
                            detail: { selectedBrand: null }
                        }));
                    }

                    // Clear search query and notify components
                    if (this.components.search && typeof this.components.search.clearSearch === 'function') {
                        this.components.search.clearSearch();
                    } else {
                        document.dispatchEvent(new CustomEvent('searchCleared'));
                    }

                    this.showNotification('All filters cleared', 'success');
                });
            }

            // Hide loading state
            this.hideLoadingState();

            // Mark as initialized
            this.isInitialized = true;

            // Show database status
            this.showDatabaseStatus();

            console.log('SentimentScope application initialized successfully');
        } catch (error) {
            console.error('Error initializing SentimentScope:', error);
            this.handleInitializationError(error);
        }
    }

    setupGlobalEventListeners() {
        // Handle view review requests with database data
        document.addEventListener('viewReviewRequested', async (e) => {
            await this.handleViewReview(e.detail.product);
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

    setupDatabaseEventListeners() {
        // Handle data refresh events
        document.addEventListener('dataRefreshed', (e) => {
            console.log('Data refreshed from database');
            if (this.components.productCards) {
                this.components.productCards.setProducts(e.detail.products);
            }
            if (this.components.dropdown) {
                this.components.dropdown.updateBrands(e.detail.brands);
            }
            this.showNotification('Data updated from database', 'success');
        });

        // Handle database connection status
        document.addEventListener('databaseStatusChanged', (e) => {
            this.showDatabaseStatus(e.detail.status);
        });
    }

    async handleViewReview(product) {
        console.log('Opening detailed view for:', product.name);

        // Get additional data from database if available
        let completeData = null;
        if (window.dataManager && typeof window.dataManager.isUsingDatabase === 'function' &&
            window.dataManager.isUsingDatabase() && product.id) {
            try {
                completeData = await window.dataManager.getPhoneDetails(product.id);
            } catch (error) {
                console.warn('Could not fetch additional data:', error);
            }
        }

        this.showProductModal(product, completeData);
    }

    // Exposed method used by UI to refresh
    async refreshData() {
        if (window.dataManager && typeof window.dataManager.refreshData === 'function') {
            await window.dataManager.refreshData();
        }
    }

    // ... 🟢 (rest of showProductModal and helper methods remain unchanged, except closeModal fix)

	showProductModal(product, completeData = null) {
		const modal = document.createElement('div');
		modal.className = 'product-modal';

		// Build additional sections from DB data when available
		let additionalSections = '';
		// Shuffle reviews each time modal opens for randomized display
		let shuffledReviews = [];
		if (completeData && Array.isArray(completeData.reviews)) {
			shuffledReviews = [...completeData.reviews].sort(() => Math.random() - 0.5);
			const recentReviews = shuffledReviews.slice(0, 3);
			additionalSections += `
				<div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #f3f4f6;">
					<h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #111827;">Recent Reviews</h3>
					<div class="recent-reviews-list">
						${recentReviews.map(review => `
							<div style="background: #f9fafb; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.5rem; border-left: 3px solid ${this.getSentimentColor(review.sentiment_label)};">
								<div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem;">
									${review.sentiment_label ? capitalize(review.sentiment_label) + ' sentiment' : 'No sentiment data'} • Review #${review.review_id}
								</div>
								<div style="font-size: 0.85rem; line-height: 1.4; color: #374151;">
									${review.review_text && review.review_text.length > 100 ? review.review_text.substring(0, 100) + '...' : (review.review_text || '')}
								</div>
							</div>
						`).join('')}
					</div>
					${shuffledReviews.length > 3 ? `
						<div style="text-align: right; margin-top: 0.5rem;">
							<button class="show-more-reviews" style="background: #eef2ff; color: #3730a3; border: 1px solid #c7d2fe; padding: 0.35rem 0.6rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">See more reviews</button>
						</div>
					` : ''}
				</div>
			`;
		}

		if (completeData && completeData.sentiments && completeData.sentiments.total_reviews > 0) {
			const sentiments = completeData.sentiments.sentiments;
			additionalSections += `
				<div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #f3f4f6;">
					<h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #111827;">Sentiment Analysis (${completeData.sentiments.total_reviews} reviews processed)</h3>
					<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
						${Object.entries(sentiments).map(([sentiment, data]) => `
							<div style="display: flex; align-items: center; background: ${this.getSentimentBackgroundColor(sentiment)}; color: ${this.getSentimentTextColor(sentiment)}; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 500;">
								${capitalize(sentiment)}: ${data.percentage}% (${data.count})
							</div>
						`).join('')}
					</div>
				</div>
			`;
		}

		if (completeData && Array.isArray(completeData.topics) && completeData.topics.length > 0) {
			additionalSections += `
				<div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #f3f4f6;">
					<h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #111827;">Key Discussion Topics</h3>
					<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
						${completeData.topics.slice(0, 5).map(topic => `
							<div style="background: #f0f9ff; color: #1e40af; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; border: 1px solid #bfdbfe;">${topic.topic_label}</div>
						`).join('')}
					</div>
				</div>
			`;
		}

		modal.innerHTML = `
			<div class="modal-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
				<div class="modal-content" style="background: white; padding: 2rem; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
					<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
						<h2 style="margin: 0; color: #111827;">${product.name}</h2>
						<button class="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; padding: 0.25rem; border-radius: 4px; transition: background-color 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">×</button>
					</div>
					<div style="text-align: center; margin-bottom: 1rem;">
						<div style="font-size: 4rem; margin-bottom: 0.5rem;">${product.icon || '📱'}</div>
						<div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
							<span style="display: inline-block; padding: 0.25rem 0.75rem; background: ${this.getSentimentBackgroundColor(product.sentiment)}; color: ${this.getSentimentTextColor(product.sentiment)}; border-radius: 20px; font-size: 0.875rem; font-weight: 500;">${capitalize(product.sentiment)} Reviews</span>
							<span style="display: inline-block; padding: 0.25rem 0.75rem; background: #f3f4f6; color: #374151; border-radius: 20px; font-size: 0.875rem; font-weight: 500;">${Number(product.rating || 0)}/5 ⭐</span>
						</div>
					</div>
					<p style="color: #6b7280; line-height: 1.6; margin-bottom: 1rem;">${product.description || ''}</p>
					<div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid #f3f4f6;">
						<span style="color: #9ca3af; font-size: 0.875rem;">Brand: ${product.brand}</span>
						<span style="color: #9ca3af; font-size: 0.875rem;">Category: ${product.category}</span>
					</div>
					${additionalSections}
					${(window.dataManager && typeof window.dataManager.isUsingDatabase === 'function' && window.dataManager.isUsingDatabase()) ? `
						<div style="margin-top: 1rem; padding: 0.5rem; background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 6px; text-align: center; font-size: 0.8rem; color: #0369a1;">📊 Data loaded from database</div>
					` : ''}
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		// Handle close events
		const closeBtn = modal.querySelector('.close-modal');
		const overlay = modal.querySelector('.modal-overlay');
		const moreBtn = modal.querySelector('.show-more-reviews');

		const handleEscape = (e) => {
			if (e.key === 'Escape') {
				closeModal();
			}
		};

		const closeModal = () => {
			modal.style.opacity = '0';
			modal.style.transition = 'opacity 0.3s ease';
			setTimeout(() => modal.remove(), 300);
			document.removeEventListener('keydown', handleEscape);
		};

		if (closeBtn) closeBtn.addEventListener('click', closeModal);
		if (overlay) overlay.addEventListener('click', (e) => {
			if (e.target === overlay) closeModal();
		});

		if (moreBtn) {
			let reviewsShown = 3;
			moreBtn.addEventListener('click', () => {
				const list = modal.querySelector('.recent-reviews-list');
				if (!list || !Array.isArray(shuffledReviews)) return;
				const nextBatch = shuffledReviews.slice(reviewsShown, reviewsShown + 3);
				nextBatch.forEach(review => {
					const item = document.createElement('div');
					item.style.background = '#f9fafb';
					item.style.padding = '0.75rem';
					item.style.borderRadius = '6px';
					item.style.marginBottom = '0.5rem';
					item.style.borderLeft = `3px solid ${this.getSentimentColor(review.sentiment_label)}`;
					item.innerHTML = `
						<div style=\"font-size: 0.8rem; color: #6b7280; margin-bottom: 0.25rem;\">${review.sentiment_label ? capitalize(review.sentiment_label) + ' sentiment' : 'No sentiment data'} • Review #${review.review_id}</div>
						<div style=\"font-size: 0.85rem; line-height: 1.4; color: #374151;\">${review.review_text || ''}</div>`;
					list.appendChild(item);
				});
				reviewsShown += nextBatch.length;
				if (reviewsShown >= shuffledReviews.length || nextBatch.length === 0) {
					moreBtn.disabled = true;
					moreBtn.textContent = 'No more reviews';
				}
			});
		}

		document.addEventListener('keydown', handleEscape);

		// Animate in
		modal.style.opacity = '0';
		setTimeout(() => {
			modal.style.transition = 'opacity 0.3s ease';
			modal.style.opacity = '1';
		}, 10);
	}

    // ... 🟢 sentiment color helpers unchanged

    showDatabaseStatus(customStatus = null) {
        const status = customStatus || (window.dataManager && typeof window.dataManager.getDataStatus === 'function'
            ? window.dataManager.getDataStatus()
            : { usingDatabase: false, productsCount: 0, brandsCount: 0 });

        const statusIndicator = document.getElementById('db-status') || document.createElement('div');
        statusIndicator.id = 'db-status';
        statusIndicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${status.usingDatabase ? '#dcfce7' : '#fef3c7'};
            color: ${status.usingDatabase ? '#166534' : '#92400e'};
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.8rem;
            border: 1px solid ${status.usingDatabase ? '#bbf7d0' : '#fed7aa'};
            z-index: 1000;
            transition: all 0.3s ease;
        `;

        statusIndicator.innerHTML = `
            ${status.usingDatabase ? '🟢' : '🟡'} 
            ${status.usingDatabase ? 'Database Connected' : 'Using Fallback Data'}
            <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.2rem;">
                ${status.productsCount} products • ${status.brandsCount} brands
            </div>
        `;

        if (!document.getElementById('db-status')) {
            document.body.appendChild(statusIndicator);
        }

        setTimeout(() => {
            if (statusIndicator.style.opacity !== '0') {
                statusIndicator.style.opacity = '0.3';
            }
        }, 5000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#dcfce7' : type === 'error' ? '#fee2e2' : '#f0f9ff'};
            color: ${type === 'success' ? '#166534' : type === 'error' ? '#991b1b' : '#1e40af'};
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid ${type === 'success'
                ? '#bbf7d0'
                : type === 'error'
                    ? '#fecaca'
                    : '#bfdbfe'};
            z-index: 10001;
            transition: all 0.3s ease;
            max-width: 300px;
        `;

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    handleGlobalKeydown(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'k':
                case '/':
                    event.preventDefault();
                    if (this.components.search) {
                        this.components.search.focusSearch();
                    }
                    break;
                case 'r':
                    event.preventDefault();
                    this.refreshData();
                    break;
            }
        }

        if (event.key === 'Escape' && this.components.search) {
            this.components.search.clearSearch();
        }
    }

    getSentimentColor(sentiment) {
        switch (sentiment) {
            case 'positive': return '#10b981';
            case 'negative': return '#ef4444';
            default: return '#d1d5db';
        }
    }
    
    getSentimentBackgroundColor(sentiment) {
        switch (sentiment) {
            case 'positive': return '#dcfce7';
            case 'negative': return '#fee2e2';
            default: return '#f9fafb';
        }
    }
    
    getSentimentTextColor(sentiment) {
        switch (sentiment) {
            case 'positive': return '#166534';
            case 'negative': return '#991b1b';
            default: return '#6b7280';
        }
    }
}

// Expose a global instance used by index.html
window.SentimentScope = new SentimentScopeApp();
