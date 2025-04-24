import React from 'react';
import './styles.css'; 

const Spinner = ({ color = 'blue', size = '16px' }) => {
  return (
    <div
      className="spinner"
      style={{
        borderColor: `${color} transparent transparent transparent`,
        width: size,
        height: size,
      }}
    ></div>
  );
};

export default Spinner;