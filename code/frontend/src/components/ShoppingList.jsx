import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, ShoppingCart, AlertCircle, ShoppingBag, Trash2, ArrowLeft, Package, MoreVertical } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';
const USER_ID = 1;

export default function ShoppingList() {
  const [lists, setLists] = useState([]);
  const [listItems, setListItems] = useState({});

  const [newListName, setNewListName] = useState('');
  const [newListBudget, setNewListBudget] = useState('');
  const [selectedListId, setSelectedListId] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLists = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/shopping-lists/user/${USER_ID}`);
      const fetchedLists = response.data || [];
      setLists(fetchedLists);
      if (fetchedLists.length > 0) {
        const itemsData = {};
        for (const list of fetchedLists) {
          const itemResponse = await axios.get(`${API_BASE_URL}/shopping-lists/${list.id}`);
          itemsData[list.id] = itemResponse.data.items || [];
        }
        setListItems(itemsData);
      }
    } catch (err) {
      handleApiError(err, 'Failed to load shopping lists');
    } finally {
      setLoading(false);
    }
  };

  const handleApiError = (err, defaultMessage) => {
    console.error('API Error:', err);
    if (err.code === 'ERR_NETWORK') {
      setError('Cannot connect to backend. Is the server running?');
    } else if (err.response?.status === 404) {
      setError('Backend endpoint not found. Check API routes.');
    } else {
      setError(err.response?.data?.error || defaultMessage);
    }
  };

  const createList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/shopping-lists`, {
        user_id: USER_ID,
        name: newListName.trim(),
        budget: parseFloat(newListBudget) || 0
      });
      setLists([...lists, response.data]);
      setListItems({ ...listItems, [response.data.id]: [] });
      setNewListName('');
      setNewListBudget('');
    } catch (err) {
      handleApiError(err, 'Failed to create list.');
    } finally {
      setLoading(false);
    }
  };

  const addItemToList = async (e) => {
    e.preventDefault();
    if (!selectedListId || !newItemName.trim()) return;

    const price = newItemPrice && newItemPrice.trim() ? parseFloat(newItemPrice) : 0;
    if (isNaN(price)) {
      setError('Please enter a valid price');
      return;
    }

    const newItem = {
      product_id: `manual_${Date.now()}`,
      name: newItemName.trim(),
      price: price,
      quantity: parseInt(newItemQuantity) || 1,
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/shopping-lists/${selectedListId}/items`, newItem);
      const currentItems = listItems[selectedListId] || [];
      setListItems({ ...listItems, [selectedListId]: [...currentItems, response.data] });
      setNewItemName('');
      setNewItemPrice('');
      setNewItemQuantity('1');
    } catch (err) {
      handleApiError(err, 'Failed to add item.');
    }
  };

  const removeItemFromList = async (itemId) => {
    if (!selectedListId) return;
    try {
      await axios.delete(`${API_BASE_URL}/shopping-lists/${selectedListId}/items/${itemId}`);
      const currentItems = listItems[selectedListId] || [];
      setListItems({
        ...listItems,
        [selectedListId]: currentItems.filter(item => item.id !== itemId)
      });
    } catch (err) {
      handleApiError(err, 'Failed to remove item.');
    }
  };

  const deleteList = async (listId) => {
    try {
      await axios.delete(`${API_BASE_URL}/shopping-lists/${listId}`);
      setLists(lists.filter(l => l.id !== listId));
      const { [listId]: _, ...restItems } = listItems;
      setListItems(restItems);
      if (selectedListId === listId) {
        setSelectedListId(null);
      }
    } catch (err) {
      handleApiError(err, 'Failed to delete list.');
    }
  };

  const getListStats = (listId) => {
    const items = listItems[listId] || [];
    const itemCount = items.length;
    const spent = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    const list = lists.find(l => l.id === listId);
    return { itemCount, spent, budget: list?.budget || 0 };
  };

  return (
    <div className="space-y-6">

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded text-red-500 p-4 flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-white">✕</button>
        </div>
      )}

      {selectedListId === null ? (
        <>
          {/* Header & Create Form */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div>
               <h3 className="text-xl font-bold text-white mb-2">Your Shopping Lists</h3>
               <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                   <span className="text-yellow-500 hover:text-yellow-400 cursor-pointer">All Categories</span>
                   <span className="hover:text-slate-300 cursor-pointer">Favorites</span>
               </div>
            </div>
            
            <form onSubmit={createList} className="flex gap-2 w-full md:w-auto">
              <input
                type="text" value={newListName} onChange={(e) => setNewListName(e.target.value)}
                placeholder="New list name" required
                className="w-48 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 px-4 py-2 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm"
              />
              <input
                type="number" value={newListBudget} onChange={(e) => setNewListBudget(e.target.value)}
                placeholder="Budget cap" min="0" step="0.01"
                className="w-28 bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-500 px-4 py-2 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm"
              />
              <button type="submit" disabled={loading || !newListName.trim()}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-slate-900 px-4 py-2 rounded font-bold flex items-center gap-2 text-sm transition-colors"
              >
                <Plus size={16} /> ADD LIST
              </button>
            </form>
          </div>

          {/* Lists Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <p className="text-slate-500 text-sm p-4 col-span-full">Loading lists...</p>
            ) : (
              lists.map((list) => {
                const { itemCount, spent, budget } = getListStats(list.id);
                const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;

                return (
                  <div key={list.id} onClick={() => setSelectedListId(list.id)}
                    className="bg-slate-800 border border-slate-700/50 rounded-lg p-6 hover:border-slate-600 transition-colors cursor-pointer flex flex-col group relative"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center justify-center text-yellow-500 bg-slate-700/50 p-2 rounded">
                        <ShoppingCart size={20} />
                      </div>
                      {budget > 0 && (
                        <div className="text-xs font-bold text-slate-500 tracking-wider">
                          LIMIT: ₹{budget.toLocaleString()}
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-1">{list.name}</h3>
                    <p className="text-sm text-slate-500 mb-6">{itemCount} items registered</p>

                    <div className="mt-auto">
                      {budget > 0 && (
                        <div className="w-full bg-slate-700 h-1 rounded-full mb-3 overflow-hidden">
                          <div className={`h-full bg-yellow-500`} style={{ width: `${Math.min(percentUsed, 100)}%` }}></div>
                        </div>
                      )}
                      <div className="flex justify-between items-end">
                        <div className="flex items-baseline gap-2">
                           <p className="text-xl font-bold text-white">₹{spent.toFixed(2)}</p>
                           {budget > 0 && <span className="text-[10px] text-slate-500">{percentUsed.toFixed(1)}%</span>}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                          className="text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Selected List Items View */
        <div className="space-y-6">
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <button onClick={() => setSelectedListId(null)}
                className="text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-3 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Lists
              </button>
              <h3 className="text-2xl font-bold text-white">{lists.find(l => l.id === selectedListId)?.name}</h3>
            </div>
            
            <button onClick={() => deleteList(selectedListId)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-rose-500 hover:text-rose-400 rounded text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-colors">
              <Trash2 size={16} /> Delete List
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Items List */}
            <div className="lg:col-span-3 bg-slate-800 border border-slate-700/50 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-700/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <div className="col-span-6">Product Name</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-3 text-right">Price</div>
                  <div className="col-span-1"></div>
              </div>
              
              <ul className="divide-y divide-slate-700/50">
                {(listItems[selectedListId] || []).length === 0 ? (
                  <li className="text-center py-16 text-slate-500 flex flex-col items-center">
                    <span className="text-sm font-medium">No products added to this list.</span>
                  </li>
                ) : (
                  (listItems[selectedListId] || []).map(item => (
                    <li key={item.id} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-700/20 transition-colors group">
                      <div className="col-span-6 flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-700/50 rounded flex items-center justify-center text-yellow-500 border border-slate-600/50">
                          <Package size={18} />
                        </div>
                        <div>
                          <h5 className="font-bold text-white text-sm">{item.name}</h5>
                          <div className="text-[10px] text-slate-400 mt-1">₹{(item.price || 0).toFixed(2)} / unit</div>
                        </div>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="text-sm font-bold text-slate-300">{item.quantity || 0}</span>
                      </div>
                      <div className="col-span-3 text-right">
                        <p className="font-bold text-white text-sm">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</p>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button onClick={() => removeItemFromList(item.id)} className="text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Add Item Form Sidebar */}
            <div className="lg:col-span-1">
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700/50 sticky top-24">
                  <h4 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Add Item</h4>
                  
                  <form onSubmit={addItemToList} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Product Name</label>
                      <input type="text" placeholder="e.g. Copper Wire" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Unit Value (₹)</label>
                        <input type="number" placeholder="0.00" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} step="0.01" min="0" required className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Quantity</label>
                        <input type="number" placeholder="1" value={newItemQuantity} onChange={(e) => setNewItemQuantity(e.target.value)} min="1" required className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 px-3 py-2.5 rounded focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm" />
                    </div>
                    
                    <button type="submit" className="w-full py-2.5 mt-4 bg-yellow-500 hover:bg-yellow-600 text-slate-900 rounded text-xs tracking-widest uppercase font-bold flex items-center justify-center gap-2 transition-colors">
                      <Plus size={16} /> Register
                    </button>
                  </form>
                </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
