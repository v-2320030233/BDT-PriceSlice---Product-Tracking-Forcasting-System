import React, { useState } from 'react';
import Layout from './components/Layout';
import ModernDashboard from './components/ModernDashboard';
import ProductSearch from './components/ProductSearch';
import ShoppingList from './components/ShoppingList';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderContent = () => {
    switch(currentPage) {
      case 'dashboard':
        return <ModernDashboard />;
      case 'products':
        return <ProductSearch />;
      case 'lists':
        return <ShoppingList />;
      case 'analytics':
        return <div className="text-white text-center py-20">Analytics Component Coming Soon</div>;
      case 'settings':
        return <div className="text-white text-center py-20">Settings Component Coming Soon</div>;
      default:
        return <ModernDashboard />;
    }
  };

  return (
    <Layout activePage={currentPage} onNavigate={setCurrentPage}>
      {renderContent()}
    </Layout>
  );
}

export default App;
