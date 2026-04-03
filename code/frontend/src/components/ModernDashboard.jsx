import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, IndianRupee, PieChart, Activity, Download, ChevronUp, MoreVertical } from 'lucide-react';
import { BarChart as ReBarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar, Cell } from 'recharts';

const API_BASE_URL = 'http://localhost:5000/api';
const USER_ID = 1;

const ModernDashboard = () => {
    const [dashboardItems, setDashboardItems] = useState([]);
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const listsResponse = await axios.get(`${API_BASE_URL}/shopping-lists/user/${USER_ID}`);
            const userLists = listsResponse.data || [];
            setLists(userLists);

            let allItems = [];
            for (const list of userLists) {
                const itemsResponse = await axios.get(`${API_BASE_URL}/shopping-lists/${list.id}`);
                if (itemsResponse.data.items) {
                    const listItems = itemsResponse.data.items.map(item => ({
                        ...item,
                        listName: list.name,
                        price: parseFloat(item.price) || 0
                    }));
                    allItems = [...allItems, ...listItems];
                }
            }

            allItems.sort((a, b) => (b.id - a.id));
            setDashboardItems(allItems);
        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const totalItems = dashboardItems.length;
    const totalCost = dashboardItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const totalBudget = lists.reduce((sum, list) => sum + (parseFloat(list.budget) || 0), 0);
    const budgetHealth = totalBudget > 0 ? (totalCost / totalBudget) * 100 : 0;

    return (
        <div className="space-y-6">

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-1">Price Alerts</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">System Status</p>
                    
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Deals Found</p>
                                <p className="text-sm font-bold text-white">High Activity</p>
                            </div>
                            <ChevronUp size={18} className="text-yellow-500" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Average Savings</p>
                                <p className="text-sm font-bold text-white">14.2%</p>
                            </div>
                            <Activity size={18} className="text-rose-400 scale-y-[-1]" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Overall Trend</p>
                                <p className="text-sm font-bold text-white">Dropping</p>
                            </div>
                            <Download size={18} className="text-slate-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700/50">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Total Estimated Cost</span>
                        <IndianRupee size={16} className="text-yellow-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-bold text-white">₹{totalCost >= 1000 ? (totalCost/1000).toFixed(1) + 'k' : totalCost.toFixed(1)}</h3>
                        <span className="text-xs font-bold text-yellow-500">+₹420</span>
                    </div>
                    <div className="mt-4 grid grid-cols-11 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-700/50 pb-2">
                        <div className="col-span-5">Product Name</div>
                        <div className="col-span-2">List Name</div>
                        <div className="col-span-2 text-right">Price</div>
                        <div className="col-span-2 text-center">Price Trend</div>
                    </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700/50">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Budget Used</span>
                        <PieChart size={16} className="text-yellow-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-bold text-white">{budgetHealth.toFixed(1)}%</h3>
                        <span className="text-xs font-medium text-slate-500">of ₹{totalBudget >= 1000 ? (totalBudget/1000).toFixed(1) + 'k' : totalBudget} limit</span>
                    </div>
                    <div className="mt-4 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500" style={{ width: `${Math.min(budgetHealth, 100)}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Main Charts Area */}
            <div className="w-full bg-slate-800 border border-slate-700/50 rounded-lg p-6">
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white">Cost Distribution by List</h3>
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 mt-1">Breakdown of estimated spending across your shopping lists</p>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Primary</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-600"></div> Secondary</div>
                        </div>
                    </div>
                </div>
                
                {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-500">Loading chart...</div>
                ) : dashboardItems.length > 0 ? (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ReBarChart data={lists.map(l => {
                                const listItems = dashboardItems.filter(i => i.list_id === l.id);
                                const cost = listItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
                                return { name: l.name, cost, secondaryCost: cost * 0.6 }; 
                            }).filter(d => d.cost > 0)} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                <XAxis dataKey="name" stroke="#64748b" fontSize={9} fontWeight={700} axisLine={false} tickLine={false} dy={15} tickFormatter={(val) => `LIST ${val.toUpperCase()}`} />
                                <YAxis hide={true} />
                                <Tooltip
                                    cursor={{ fill: '#334155', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '4px', fontSize: '12px', color: '#fff' }}
                                />
                                <Bar dataKey="cost" fill="#EAB308" radius={[0, 0, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="secondaryCost" fill="#475569" radius={[0, 0, 0, 0]} maxBarSize={40} />
                            </ReBarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                        <span className="text-sm">No allocation data available</span>
                    </div>
                )}
            </div>
            
            <div className="fixed bottom-6 right-6 z-50">
                 <button className="w-14 h-14 bg-yellow-500 hover:bg-yellow-600 text-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20 transition-transform hover:-translate-y-1">
                     <span className="text-xl font-black">⚡</span>
                 </button>
            </div>
        </div>
    );
};

export default ModernDashboard;
