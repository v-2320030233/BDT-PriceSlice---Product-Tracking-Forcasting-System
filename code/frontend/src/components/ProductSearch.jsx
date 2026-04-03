import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2, Filter, ShoppingCart, CheckCircle, AlertTriangle } from 'lucide-react';
import ModernProductCard from './ModernProductCard';
import { fetchProductPrices } from '../services/api';

const API_BASE_URL = 'http://localhost:5000/api';
const USER_ID = 1;

export default function ProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lists, setLists] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/shopping-lists/user/${USER_ID}`);
        setLists(res.data || []);
      } catch (e) {
        console.error('Failed to load lists', e);
      }
    };
    fetchLists();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddToCart = async (product) => {
    let targetListId;
    let targetListName = 'My Shopping List';

    if (lists.length === 0) {
      try {
        const res = await axios.post(`${API_BASE_URL}/shopping-lists`, {
          user_id: USER_ID,
          name: 'My Shopping List',
          budget: 1000
        });
        targetListId = res.data.id;
        targetListName = res.data.name;
        setLists([res.data]);
      } catch (err) {
        showNotification('error', 'Failed to create a shopping list.');
        return;
      }
    } else {
      targetListId = lists[0].id;
      targetListName = lists[0].name;
    }

    try {
      await axios.post(`${API_BASE_URL}/shopping-lists/${targetListId}/items`, {
        product_id: product.id || String(Date.now()),
        name: product.name || product.title || 'Unknown Product',
        price: typeof product.price === 'number' ? product.price : 0,
        quantity: 1
      });
      showNotification('success', `Added "${product.name || product.title}" to ${targetListName}`);
    } catch (err) {
      console.error(err);
      showNotification('error', 'Failed to add item to list.');
    }
  };

  const handleRedirect = (product) => {
    const url = product.url || product.link;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      showNotification('error', 'No store link available for this product.');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim().length < 2) return;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchProductPrices(query);
      setResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to fetch results.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-slate-900 text-sm font-bold transition-all ${
          notification.type === 'success' ? 'bg-yellow-500' : 'bg-rose-500 text-white'
        }`}>
          {notification.type === 'success'
            ? <CheckCircle size={18} />
            : <AlertTriangle size={18} />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Product Search
            </h2>
            <p className="text-slate-400 mt-1.5 font-medium">Search the web for the best deals and price trends.</p>
        </div>
        <form onSubmit={handleSearch} className="w-full md:w-auto flex items-center gap-3">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products (e.g. iPhone 15)..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 transition-all font-medium"
                />
            </div>
            <button 
                type="submit" 
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transform active:scale-95"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Execute'}
            </button>
        </form>
      </div>

      {/* Filters and Results Count */}
      <div className="flex justify-between items-center bg-slate-800 border border-slate-700/50 rounded-xl py-3 px-5 shadow-sm">
        <p className="text-sm font-medium text-slate-400">
            {loading ? <span className="animate-pulse">Retrieving market data...</span> : <span className="text-white font-bold">{results.length}</span>} products found
        </p>
        <button className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 transition-colors px-3 py-1.5 rounded-lg border border-slate-600/50">
            <Filter size={16} />
            <span>Parameters</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 font-bold text-sm">
            <AlertTriangle className="inline-block mr-2" size={16}/> ERROR: {error}
        </div>
      )}

      {/* Overall AI Summary Block */}
      {!loading && results.length > 0 && query && results[0].ai_summary && (
        <div className="bg-slate-800 border border-yellow-500/20 rounded-2xl p-6 md:p-8 mb-4">
          <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="text-lg">⚡</span> System Insights
          </h3>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed italic">
            "{results[0].ai_summary}"
          </p>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((product) => (
          <ModernProductCard
            key={product.id || product.url}
            product={product}
            onAddToCart={() => handleAddToCart(product)}
            onRedirect={() => handleRedirect(product)}
          />
        ))}
      </div>

      {!loading && results.length === 0 && query && (
          <div className="text-center py-20 px-6 bg-slate-800 border border-slate-700/50 rounded-2xl flex flex-col items-center justify-center">
              <Search className="text-slate-600 mb-4 h-12 w-12" />
              <h3 className="text-lg font-bold text-slate-300">No products found.</h3>
              <p className="text-sm text-slate-500 font-medium">Adjust query parameters and execute again.</p>
          </div>
      )}
    </div>
  );
}
