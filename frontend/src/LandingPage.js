// src/LandingPage.js
import React, { useState, useEffect } from 'react';
import './LandingPage.css';

const slides = [
  {
    image: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=2940&auto=format&fit=crop",
    title: "Refresh Your Wardrobe",
    subtitle: "Second-hand clothing, sustainably stylish, always empowering"
  },
  {
    image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Suit Your Self",
    subtitle: "Give pre-loved fashion a second chance to shine"
  },
  {
    image: "https://images.unsplash.com/photo-1525562723836-dca67a71d5f1?q=80&w=3174&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Express Yourself for Less",
    subtitle: "Trendy pieces. Affordable prices. Ethical impact."
  },
  {
    image: "https://images.unsplash.com/photo-1713520150897-03dcada01520?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Express Yourself for Less",
    subtitle: "Give pre-loved fashion a second chance to shine"
  },
  {
    image: "https://images.unsplash.com/photo-1699120490830-b944cd507696?q=80&w=2938&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Suit Yourself for Less",
    subtitle: "Trendy pieces. Affordable prices. Ethical impact."
  }
];

function LandingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentIndex((index) => (index + 1) % slides.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  return (
    <div className="landing-page">
      <div className="hero-banner">
        {slides.map((slide, index) => (
          <img
            key={index}
            src={slide.image}
            alt={`Slide ${index}`}
            className={`hero-slide ${index === currentIndex ? 'active' : ''}`}
          />
        ))}

        <div className="hero-text">
          <h1>{slides[currentIndex].title}</h1>
          <p>{slides[currentIndex].subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
