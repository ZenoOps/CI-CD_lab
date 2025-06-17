// src/Logout.js
import React from 'react';

function Logout({ handleLogout }) {
  return (
    <button onClick={handleLogout} className="btn-primary">
      Logout
    </button>
  );
}

export default Logout;