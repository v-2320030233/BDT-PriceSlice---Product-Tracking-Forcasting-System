import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  ShoppingBag, 
  Menu,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Plus
} from 'lucide-react';

const Layout = ({ children, activePage, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'products', icon: Search, label: 'Product Search' },
    { id: 'lists', icon: ShoppingBag, label: 'Shopping Lists' },
  ];

  return (
    <div className="flex bg-slate-900 min-h-screen text-slate-300 font-sans">
      
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-slate-900 border-r border-slate-800 z-30 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        <div className="h-20 flex items-center px-6">
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="text-xl font-bold text-yellow-500">PriceSlice</span>
              <span className="text-[10px] tracking-widest text-slate-500 uppercase">Tracker</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="ml-auto p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hidden md:block"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="mt-8 flex-1 px-0 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate && onNavigate(item.id)}
              className={`w-full flex items-center px-6 py-3 transition-colors border-r-[3px] ${
                activePage === item.id 
                  ? 'border-yellow-500 text-yellow-500 bg-slate-800/20' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/10'
              }`}
            >
              <item.icon size={20} className={activePage === item.id ? 'text-yellow-500' : 'text-slate-400'} />
              {isSidebarOpen && <span className="ml-4 text-sm font-medium">{item.label}</span>}
            </button>
          ))}
          
          <button className="w-full flex items-center px-6 py-3 text-slate-400 hover:text-slate-200 transition-colors border-r-[3px] border-transparent">
            <Settings size={20} />
            {isSidebarOpen && <span className="ml-4 text-sm font-medium">Settings</span>}
          </button>
        </nav>
        
        <div className="px-6 pb-8 space-y-6">
          <button className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold rounded-md transition-colors flex items-center justify-center gap-2">
             <Plus size={18} />
             {isSidebarOpen && <span>New List</span>}
          </button>
          
          <div className="space-y-4">
              <button className="flex items-center text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors w-full">
                  <HelpCircle size={18} />
                  {isSidebarOpen && <span className="ml-3">Support</span>}
              </button>
              <button className="flex items-center text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors w-full">
                  <LogOut size={18} />
                  {isSidebarOpen && <span className="ml-3">Logout</span>}
              </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        
        {/* Header */}
        <header className="h-20 bg-slate-900 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden md:block w-96 ml-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Search size={16} />
              </div>
              <input
                  type="text"
                  placeholder="Search products or lists..."
                  className="block w-full pl-11 pr-4 py-2.5 border-none rounded bg-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm transition-colors"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors border border-slate-700">
              <Plus size={14} /> Add Item
            </button>
            <button className="text-slate-400 hover:text-slate-200">
              <Bell size={18} />
            </button>
            <div className="h-8 w-8 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm">
                A
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
