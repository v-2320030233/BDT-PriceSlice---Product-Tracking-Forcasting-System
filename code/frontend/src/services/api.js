import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Make sure this matches your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch product prices (all products or by query)
export const fetchProductPrices = async (query = '') => {
  try {
    if (query) {
        const response = await api.get(`/prices/live/0`, { params: { q: query } });
        // The live API returns an array of products.
        // Now fetch price history for each product
        const productsWithHistory = await Promise.all(
            response.data.map(async (product) => {
                try {
                    // Try to get price history if we have a product_id
                    if (product.id || product.product_id) {
                        const historyResponse = await api.get(`/prices/product/${product.id || product.product_id}`, { params: { days: 10 } });
                        return { ...product, history: historyResponse.data || [] };
                    }
                } catch (err) {
                    console.warn('Could not fetch history for product:', product);
                }
                return product;
            })
        );
        return productsWithHistory;
    } else {
        // Fetch tracked products from DB
        const response = await api.get('/products');
        const productsWithHistory = await Promise.all(
            response.data.map(async (product) => {
                try {
                    const historyResponse = await api.get(`/prices/product/${product.id}`, { params: { days: 10 } });
                    return { ...product, history: historyResponse.data || [] };
                } catch (err) {
                    console.warn('Could not fetch history for product:', product);
                }
                return product;
            })
        );
        return productsWithHistory;
    }
  } catch (error) {
    console.error('Error fetching product prices:', error);
    return []; 
  }
};

// Fetch price history for a specific product
export const fetchPriceHistory = async (productId, days = 30) => {
  try {
    const response = await api.get(`/prices/product/${productId}`, { params: { days } });
    return response.data || [];
  } catch (error) {
    console.error(`Error fetching price history for product ${productId}:`, error);
    return [];
  }
};

export const fetchShoppingLists = async (userId) => {
    try {
        const response = await api.get(`/shopping-lists/user/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching shopping lists:', error);
        return [];
    }
};

export default api;
