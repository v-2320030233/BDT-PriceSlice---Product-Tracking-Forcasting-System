const express = require("express");
const cors = require("cors");
require('dotenv').config();

const app = express();

const useMockData = process.env.MOCK_DATA === 'true' || !process.env.DATABASE_URL;

// Routes
const productRoutes = require('./routes/products');
const priceRoutes = require('./routes/prices');
const reviewRoutes = require('./routes/reviews');
const predictionRoutes = require('./routes/predictions');
const shoppingListRoutes = require('./routes/shoppingLists');

// Middleware
const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001'];
const envOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultOrigins]));

app.use(
  cors({
    origin: (origin, callback) => callback(null, true)
  })
);
app.use(express.json());

// Initialize shopping list data (always available, not just for mock data)
let shoppingLists = [];
let shoppingListItems = [];

// Mock data (used when DATABASE_URL is not set)
if (useMockData) {
  const now = Date.now();
  const daysAgo = (days) => new Date(now - days * 24 * 60 * 60 * 1000).toISOString();

  const products = [
    {
      id: 1,
      name: 'Noise-Canceling Headphones X1',
      description: 'Wireless over-ear headphones with 40-hour battery life and ANC.',
      category: 'Audio',
      image_url: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=800&q=80',
      updated_at: daysAgo(1)
    },
    {
      id: 2,
      name: 'Smartwatch Pro 4',
      description: 'Fitness tracking, ECG, and 7-day battery in a sleek design.',
      category: 'Wearables',
      image_url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80',
      updated_at: daysAgo(2)
    },
    {
      id: 3,
      name: 'UltraSlim Laptop 14"',
      description: 'Lightweight laptop with 16GB RAM and 1TB SSD.',
      category: 'Computers',
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      updated_at: daysAgo(3)
    }
  ];

  const priceHistory = [
    // Product 1 - Headphones history (10 days)
    { product_id: 1, platform: 'Flipkart', price: 16999, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(10) },
    { product_id: 1, platform: 'Flipkart', price: 16788, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(9) },
    { product_id: 1, platform: 'Flipkart', price: 16659, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(7) },
    { product_id: 1, platform: 'Flipkart', price: 16404, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(5) },
    { product_id: 1, platform: 'Flipkart', price: 16149, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(2) },
    { product_id: 1, platform: 'Flipkart', price: 15809, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(0.5) },
    { product_id: 1, platform: 'Amazon India', price: 18699, url: 'https://bestbuy.com', in_stock: true, recorded_at: daysAgo(8) },
    { product_id: 1, platform: 'Amazon India', price: 18318, url: 'https://bestbuy.com', in_stock: true, recorded_at: daysAgo(5) },
    { product_id: 1, platform: 'Amazon India', price: 17849, url: 'https://bestbuy.com', in_stock: true, recorded_at: daysAgo(3) },
    { product_id: 1, platform: 'Amazon India', price: 17424, url: 'https://bestbuy.com', in_stock: true, recorded_at: daysAgo(0.5) },
    { product_id: 1, platform: 'Croma', price: 17425, url: 'https://walmart.com', in_stock: true, recorded_at: daysAgo(9) },
    { product_id: 1, platform: 'Croma', price: 16999, url: 'https://walmart.com', in_stock: true, recorded_at: daysAgo(6) },
    { product_id: 1, platform: 'Croma', price: 16618, url: 'https://walmart.com', in_stock: false, recorded_at: daysAgo(1) },
    // Product 2 - Smartwatch history
    { product_id: 2, platform: 'Flipkart', price: 24565, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(10) },
    { product_id: 2, platform: 'Flipkart', price: 23799, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(8) },
    { product_id: 2, platform: 'Flipkart', price: 22865, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(5) },
    { product_id: 2, platform: 'Flipkart', price: 22099, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(2) },
    { product_id: 2, platform: 'Flipkart', price: 21165, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(0.5) },
    { product_id: 2, platform: 'Amazon India', price: 25415, url: 'https://bestbuy.com', in_stock: true, recorded_at: daysAgo(9) },
    { product_id: 2, platform: 'Amazon India', price: 23758, url: 'https://bestbuy.com', in_stock: true, recorded_at: daysAgo(6) },
    { product_id: 2, platform: 'Amazon India', price: 22099, url: 'https://bestbuy.com', in_stock: true, recorded_at: daysAgo(3) },
    { product_id: 2, platform: 'Amazon India', price: 20315, url: 'https://bestbuy.com', in_stock: true, recorded_at: daysAgo(0.5) },
    { product_id: 2, platform: 'Reliance Digital', price: 23375, url: 'https://target.com', in_stock: true, recorded_at: daysAgo(7) },
    { product_id: 2, platform: 'Reliance Digital', price: 21759, url: 'https://target.com', in_stock: true, recorded_at: daysAgo(3) },
    // Product 3 - Laptop history
    { product_id: 3, platform: 'Flipkart', price: 118915, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(10) },
    { product_id: 3, platform: 'Flipkart', price: 114749, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(8) },
    { product_id: 3, platform: 'Flipkart', price: 110415, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(5) },
    { product_id: 3, platform: 'Flipkart', price: 101915, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(3) },
    { product_id: 3, platform: 'Flipkart', price: 93415, url: 'https://amazon.com', in_stock: true, recorded_at: daysAgo(0.5) },
    { product_id: 3, platform: 'Amazon India', price: 123249, url: 'https://bestbuy.com', in_stock: true, recorded_at: daysAgo(9) },
    { product_id: 3, platform: 'Amazon India', price: 118915, url: 'https://bestbuy.com', in_stock: true, recorded_at: daysAgo(6) },
    { product_id: 3, platform: 'Amazon India', price: 106249, url: 'https://bestbuy.com', in_stock: true, recorded_at: daysAgo(3) },
    { product_id: 3, platform: 'Amazon India', price: 97665, url: 'https://bestbuy.com', in_stock: true, recorded_at: daysAgo(0.5) },
    { product_id: 3, platform: 'Myntra', price: 117299, url: 'https://newegg.com', in_stock: true, recorded_at: daysAgo(7) },
    { product_id: 3, platform: 'Myntra', price: 108715, url: 'https://newegg.com', in_stock: true, recorded_at: daysAgo(3) }
  ];

  const predictions = [
    { product_id: 1, platform: 'Flipkart', predicted_price: 15299, confidence: 82, recommendation: 'wait', prediction_date: daysAgo(0) },
    { product_id: 1, platform: 'Amazon India', predicted_price: 16999, confidence: 76, recommendation: 'monitor', prediction_date: daysAgo(0) },
    { product_id: 2, platform: 'Flipkart', predicted_price: 19465, confidence: 71, recommendation: 'wait', prediction_date: daysAgo(0) },
    { product_id: 3, platform: 'Flipkart', predicted_price: 89165, confidence: 68, recommendation: 'buy_now', prediction_date: daysAgo(0) }
  ];

  const reviews = [
    { id: 1, product_id: 1, user_id: 1, username: 'Ava', rating: 5, comment: 'Great sound and ANC!', sentiment: 'positive', created_at: daysAgo(3) },
    { id: 2, product_id: 1, user_id: 2, username: 'Noah', rating: 4, comment: 'Comfortable but a bit pricey.', sentiment: 'neutral', created_at: daysAgo(5) },
    { id: 3, product_id: 2, user_id: 3, username: 'Liam', rating: 3, comment: 'Battery life is okay.', sentiment: 'neutral', created_at: daysAgo(6) },
    { id: 4, product_id: 3, user_id: 4, username: 'Mia', rating: 5, comment: 'Super fast and light.', sentiment: 'positive', created_at: daysAgo(2) }
  ];

  // Initialize default shopping lists
  shoppingLists = [
    { id: 1, user_id: 1, name: 'Tech Upgrades', budget: 150000, created_at: daysAgo(7) }
  ];
  shoppingListItems = [
    { id: 1, list_id: 1, product_id: 1, quantity: 1 },
    { id: 2, list_id: 1, product_id: 3, quantity: 1 }
  ];

  const getLatestPriceForProduct = (productId) => {
    const items = priceHistory
      .filter((p) => p.product_id === productId)
      .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
    return items[0] || null;
  };

  app.get('/api/products', (req, res) => {
    res.json(products);
  });

  app.get('/api/products/search/query', (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query too short' });
    }
    const qLower = q.toLowerCase();
    const results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(qLower) ||
        (p.description || '').toLowerCase().includes(qLower)
    );
    res.json(results);
  });

  app.get('/api/products/:id', (req, res) => {
    const id = Number(req.params.id);
    const product = products.find((p) => p.id === id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({
      product,
      priceHistory: priceHistory.filter((p) => p.product_id === id)
    });
  });

  app.get('/api/prices/product/:id', (req, res) => {
    const id = Number(req.params.id);
    const days = parseInt(req.query.days || '30', 10);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const data = priceHistory.filter(
      (p) =>
        p.product_id === id && new Date(p.recorded_at).getTime() >= cutoff
    );
    res.json(data);
  });

  app.get('/api/prices/best/:id', (req, res) => {
    const id = Number(req.params.id);
    const byPlatform = new Map();
    priceHistory
      .filter((p) => p.product_id === id)
      .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
      .forEach((p) => {
        if (!byPlatform.has(p.platform)) {
          byPlatform.set(p.platform, p);
        }
      });
    res.json(Array.from(byPlatform.values()));
  });

  app.get('/api/prices/live/:id', (req, res) => {
    const id = Number(req.params.id);
    const { q } = req.query;

    // Mock search logic
    if (q) {
      const qLower = q.toLowerCase();
      // Search in existing mock products
      const foundProducts = products.filter(p =>
        p.name.toLowerCase().includes(qLower) ||
        p.description.toLowerCase().includes(qLower) ||
        p.category.toLowerCase().includes(qLower)
      );

      // Map to format expected by frontend
      const results = foundProducts.map(p => {
        const history = priceHistory.filter(h => h.product_id === p.id).sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
        const latestInfo = history[0] || {}; // Get most recent price
        return {
          id: p.id,
          product_id: p.id,
          name: p.name,
          title: p.name,
          price: latestInfo.price || 999,
          platform: latestInfo.platform || 'Flipkart',
          image_url: p.image_url,
          url: latestInfo.url || 'https://amazon.com',
          in_stock: latestInfo.in_stock !== false,
          recorded_at: latestInfo.recorded_at || new Date().toISOString()
        };
      });
      return res.json(results);
    }

    const byPlatform = new Map();
    priceHistory
      .filter((p) => p.product_id === id)
      .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
      .forEach((p) => {
        if (!byPlatform.has(p.platform)) {
          byPlatform.set(p.platform, p);
        }
      });
    res.json(Array.from(byPlatform.values()));
  });

  app.get('/api/prices/trends/:id', (req, res) => {
    const id = Number(req.params.id);
    const trends = priceHistory
      .filter((p) => p.product_id === id)
      .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
      .reduce((acc, p) => {
        const date = new Date(p.recorded_at).toLocaleDateString();
        if (!acc[date]) acc[date] = {};
        if (!acc[date][p.platform]) acc[date][p.platform] = { price: p.price, platform: p.platform };
        return acc;
      }, {});
    res.json(trends);
  });

  app.get('/api/reviews/product/:id', (req, res) => {
    const id = Number(req.params.id);
    res.json(reviews.filter((r) => r.product_id === id));
  });

  app.get('/api/reviews/summary/:id', async (req, res) => {
    const id = Number(req.params.id);
    const productReviews = reviews.filter((r) => r.product_id === id);
    if (productReviews.length === 0) {
      return res.json({ average_rating: 0, total_reviews: 0, sentiment_breakdown: {} });
    }
    const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
    const sentiment_breakdown = productReviews.reduce((acc, r) => {
      if (r.sentiment) acc[r.sentiment] = (acc[r.sentiment] || 0) + 1;
      return acc;
    }, {});

    let summary_text = "AI summary running in mock mode.";
    try {
        const axios = require('axios');
        const predictorUrl = process.env.PREDICTOR_URL || 'http://localhost:8001';
        const predictorResponse = await axios.post(`${predictorUrl}/reviews/summary`, {
            product_id: Number(id),
            reviews: productReviews.map(r => ({ text: r.comment || "", rating: Number(r.rating) }))
        }, { timeout: 5000 });
        if (predictorResponse.data && predictorResponse.data.summary_text) {
            summary_text = predictorResponse.data.summary_text;
        }
    } catch(e) { console.error("Predictor review summary failed in mock:", e.message); }

    res.json({
      average_rating: total / productReviews.length,
      total_reviews: productReviews.length,
      sentiment_breakdown,
      summary_text
    });
  });

  app.get('/api/predictions/product/:id', (req, res) => {
    const id = Number(req.params.id);
    res.json(predictions.filter((p) => p.product_id === id));
  });
}

// Shopping List Endpoints (always available with mock data)
app.get('/api/shopping-lists/user/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  const lists = shoppingLists
    .filter((l) => l.user_id === userId)
    .map((l) => ({
      ...l,
      item_count: shoppingListItems.filter((i) => i.list_id === l.id).length
    }));
  res.json(lists);
});

app.get('/api/shopping-lists/:id', (req, res) => {
  const id = Number(req.params.id);
  const list = shoppingLists.find((l) => l.id === id);
  if (!list) return res.status(404).json({ error: 'List not found' });

  const items = shoppingListItems.filter((i) => i.list_id === id);
  res.json({ list, items });
});

app.post('/api/shopping-lists', (req, res) => {
  const { user_id, name, budget } = req.body || {};
  if (!user_id || !name) {
    return res.status(400).json({ error: 'Missing required fields: user_id and name' });
  }
  const newList = {
    id: shoppingLists.length ? Math.max(...shoppingLists.map((l) => l.id)) + 1 : 1,
    user_id,
    name,
    budget: budget ? parseFloat(budget) : null,
    created_at: new Date().toISOString()
  };
  shoppingLists = [...shoppingLists, newList];
  res.status(201).json({ ...newList, item_count: 0 });
});

app.post('/api/shopping-lists/:id/items', (req, res) => {
  const listId = Number(req.params.id);
  const { product_id, quantity, name, price } = req.body || {};

  if (!listId) {
    return res.status(400).json({ error: 'Missing list ID' });
  }

  // Generate a mock ID for the new item. Correctly handle empty list.
  const newId = shoppingListItems.length > 0
    ? Math.max(...shoppingListItems.map(i => i.id)) + 1
    : 1;

  const newItem = {
    id: newId,
    list_id: listId,
    product_id: product_id || `manual_${Date.now()}`,
    name: name || 'Unknown Item',
    price: price !== undefined ? parseFloat(price) : 0, // Ensure price is a number, default to 0
    quantity: quantity ? parseInt(quantity) : 1,
    added_at: new Date().toISOString()
  };

  shoppingListItems.push(newItem);
  res.status(201).json(newItem);
});

app.get('/api/shopping-lists/:id/total', (req, res) => {
  const listId = Number(req.params.id);
  const list = shoppingLists.find((l) => l.id === listId);
  if (!list) return res.status(404).json({ error: 'List not found' });

  const items = shoppingListItems.filter((i) => i.list_id === listId);
  const item_count = items.length;
  res.json({ total_cost: 0, item_count, budget: list.budget, status: 'within_budget' });
});

app.delete('/api/shopping-lists/:id', (req, res) => {
  const listId = Number(req.params.id);
  const listExists = shoppingLists.find((l) => l.id === listId);
  if (!listExists) return res.status(404).json({ error: 'List not found' });

  shoppingLists = shoppingLists.filter((l) => l.id !== listId);
  shoppingListItems = shoppingListItems.filter((i) => i.list_id !== listId);
  res.json({ success: true, message: 'List deleted' });
});

app.delete('/api/shopping-lists/:id/items/:itemId', (req, res) => {
  const listId = Number(req.params.id);
  const itemId = Number(req.params.itemId);
  const itemExists = shoppingListItems.find((i) => i.id === itemId && i.list_id === listId);
  if (!itemExists) return res.status(404).json({ error: 'Item not found' });

  shoppingListItems = shoppingListItems.filter((i) => i.id !== itemId);
  res.json({ success: true, message: 'Item deleted' });
});

// Health check
app.get("/", (req, res) => {
  res.json({ message: "PriceSlice Backend 🚀", status: "running" });
});

// API Routes
app.use('/api/prices', priceRoutes);
if (!useMockData) {
  app.use('/api/products', productRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/predictions', predictionRoutes);
  app.use('/api/shopping-lists', shoppingListRoutes);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`PriceSlice Backend running on http://localhost:${PORT}`);
});
