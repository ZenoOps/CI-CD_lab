// src/Cart.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cart.css';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(savedCart);
  }, []);

  const updateCart = (updatedCart) => {
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleRemove = (id) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    updateCart(updatedCart);
  };

  const handleQuantityChange = (id, delta) => {
    const updatedCart = cartItems.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );
    updateCart(updatedCart);
  };

  const handleCheckout = () => {
    if (!localStorage.getItem('access_token')) {
      alert('You must be logged in to checkout.');
      return;
    }
    navigate('/checkout');
  };

  const totalPrice = cartItems.reduce(
    (sum, { price, quantity }) => sum + price * quantity,
    0
  );

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map(({ id, image, title, price, quantity }) => (
              <div className="cart-item" key={id}>
                <img src={image} alt={title} />
                <div className="item-info">
                  <h4>{title}</h4>
                  <p>Price: ฿{price}</p>
                  <div className="quantity-control">
                    <button onClick={() => handleQuantityChange(id, -1)}>-</button>
                    <span>{quantity}</span>
                    <button onClick={() => handleQuantityChange(id, 1)}>+</button>
                  </div>
                </div>
                <button className="remove-btn" onClick={() => handleRemove(id)}>Remove</button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Total: ฿{totalPrice.toFixed(2)}</h3>
            <button className="btn-checkout" onClick={handleCheckout}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;