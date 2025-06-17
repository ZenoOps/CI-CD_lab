// src/Dashboard.js
import React from 'react';
import ProductList from './ProductList';
import LandingPage from './LandingPage';
import LandingProductShowcase from './LandingProductShowcase';
import LandingIntroSection from './LandingIntroSection';


function Dashboard() {
  return (
    <div>
      <LandingPage />
      <LandingProductShowcase />
      <ProductList />
      <LandingIntroSection />
    </div>
  );
}

export default Dashboard;
