import React, { useState, useEffect } from "react";

export default function Toast({ message, duration = 2000, isVisible = false }) {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
    
    if (isVisible) {
      const timer = setTimeout(() => {
        setShow(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  if (!show) return null;

  return (
    <div
      className="
        fixed
        bottom-6
        right-6
        bg-green-600
        text-white
        px-4
        py-3
        rounded-lg
        shadow-lg
        animate-fadeIn
        z-50
      "
    >
      {message}
    </div>
  );
}
