import React from 'react';
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram
} from 'react-icons/fa';
import './Footer.css';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      {/* Yellow Top Banner */}


      <div className="footer-banner">
        <h2>YOU CAN BE A SELLER</h2>
        <button>SIGN UP FOR FREE →</button>
      </div>

      {/* Main Footer Section */}
      <div className="footer-main">
        <div className="footer-column">
          <h3 className='footer-h3'>Products</h3>
          <ul>
            <li><a href="#">Shirt</a></li>
            <li><a href="#">Jacket</a></li>
            <li><a href="#">Gown</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className='footer-h3'>Brands</h3>
          <ul>
            <li><a href="#">Zara</a></li>
            <li><a href="#">Adidas</a></li>
            <li><a href="#">Nike</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className='footer-h3'>Company Info</h3>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Ladyfirst Stories</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className='footer-h3'>Support</h3>
          <ul>
            <li><a href="#">Help</a></li>
            <li><a href="#">Returns</a></li>
            <li><a href="#">Payments</a></li>
            <li><a href="#">Delivery</a></li>
            <li><a href="#">Promotions</a></li>
            <li><a href="#">Customer Service</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className='footer-h3'>Follow Us</h3>
          <div className="footer-socials">
            <a href="https://facebook.com" target="_blank" rel="noreferrer"><FaFacebookF /></a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer"><FaTwitter /></a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer"><FaInstagram /></a>
          </div>
        </div>
      </div>

      {/* Bottom Legal Section */}
      <div className="footer-bottom">
        <a href="#">Privacy Policy</a> | 
        <a href="#">Terms and Conditions</a> | 
        <a href="#">Imprint</a> | 
        <span>© {new Date().getFullYear()} Ladyfirst.me</span>
      </div>
    </footer>
  );
}

export default Footer;
