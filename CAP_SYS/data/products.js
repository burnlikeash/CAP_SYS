// Sample Product Data
const SAMPLE_PRODUCTS = [
    {
        id: 1,
        name: "iPhone 12",
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
    },
    {
        id: 7,
        name: "Dell XPS 13",
        brand: "Dell",
        category: "Laptops",
        description: "Compact design with decent performance, but some users report keyboard issues and limited port selection. Battery life could be better for the price point.",
        sentiment: "neutral",
        rating: 3.8,
        icon: "💻"
    },
    {
        id: 8,
        name: "Google Pixel Watch",
        brand: "Google",
        category: "Wearables",
        description: "Good integration with Android but disappointing battery life. Users complain about the charging system and limited third-party app support.",
        sentiment: "negative",
        rating: 3.2,
        icon: "⌚"
    }
];

const BRANDS = [
    "All Brands",
    "Apple",
    "Samsung",
    "Infinix",
    "Xiaomi",
    "Huawei",
    "Tecno",
    "Oppo",
    "Realme",
    "Vivo"
];

const TOPICS = [
    "Smartphones",
    "Laptops",
    "Headphones",
    "Cameras",
    "Gaming",
    "Wearables"
];

const FILTERS = [
    { name: "Positive", type: "sentiment", value: "positive" },
    { name: "Neutral", type: "sentiment", value: "neutral" },
    { name: "Negative", type: "sentiment", value: "negative" },
    { name: "Price: High", type: "price", value: "high" },
    { name: "Price: Low", type: "price", value: "low" }
];