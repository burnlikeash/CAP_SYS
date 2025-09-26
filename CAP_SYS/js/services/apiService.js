// Simple Database API client used by the website only

(function () {
	const DEFAULT_BASE_URL = 'http://localhost:8000';

	class ApiService {
		constructor(baseUrl = DEFAULT_BASE_URL) {
			this.baseUrl = baseUrl.replace(/\/$/, '');
			this.cache = new Map();
			this.defaultHeaders = {
				'Content-Type': 'application/json'
			};
		}

		async apiCall(path, options = {}) {
			const url = `${this.baseUrl}${path}`;
			const useCache = (!options.method || options.method.toUpperCase() === 'GET') && options.cache !== false;
			if (useCache && this.cache.has(url)) {
				return this.cache.get(url);
			}

			const controller = new AbortController();
			const timeoutMs = options.timeout || 8000;
			const timeout = setTimeout(() => controller.abort(), timeoutMs);

			try {
				const resp = await fetch(url, {
					method: options.method || 'GET',
					headers: { ...this.defaultHeaders, ...(options.headers || {}) },
					body: options.body ? JSON.stringify(options.body) : undefined,
					signal: controller.signal,
					mode: 'cors'
				});
				if (!resp.ok) {
					throw new Error(`API error ${resp.status}: ${resp.statusText}`);
				}
				const data = await resp.json();
				if (useCache) {
					this.cache.set(url, data);
				}
				return data;
			} finally {
				clearTimeout(timeout);
			}
		}

		clearCache() {
			this.cache.clear();
		}

		// Endpoints used by the website
		getBrands() {
			return this.apiCall('/brands');
		}

		getAllPhones() {
			return this.apiCall('/phones?limit=200');
		}

		getSentimentsByPhone(phoneId) {
			return this.apiCall(`/sentiments?phone_id=${encodeURIComponent(phoneId)}`);
		}

		getCompletePhoneData(phoneId) {
			return this.apiCall(`/phones/${encodeURIComponent(phoneId)}/complete`);
		}

		getStats() {
			return this.apiCall('/stats');
		}

		// Shape raw DB rows into the UI product shape expected by components
		transformPhoneData(phoneRow, sentiments = {}) {
			const dominantSentiment = (() => {
				const entries = Object.entries(sentiments);
				if (entries.length === 0) return 'neutral';
				entries.sort((a, b) => (b[1]?.count || 0) - (a[1]?.count || 0));
				return entries[0][0];
			})();

			return {
				id: phoneRow.phone_id,
				name: phoneRow.phone_name,
				brand: phoneRow.brand_name,
				category: 'Smartphones',
				description: `Reviews: ${phoneRow.review_count || 0}. Avg sentiment ~ ${
					phoneRow.avg_sentiment_rating != null ? phoneRow.avg_sentiment_rating.toFixed(1) : 'N/A'
				}.`,
				sentiment: dominantSentiment,
				rating: phoneRow.avg_sentiment_rating != null ? Number(phoneRow.avg_sentiment_rating) : 3.0,
				// Parse topics string from DB to array for filtering
				topics: typeof phoneRow.topics === 'string' && phoneRow.topics.trim().length > 0
					? phoneRow.topics.split(',').map(t => t.trim()).filter(Boolean)
					: [],
				icon: '📱'
			};
		}
	}

	// Expose globally
	window.apiService = new ApiService();
})();
