import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileDrop() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
<div className="relative" ref={dropdownRef}>
  {/* Profile Button */}
  <button
    className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 hover:border-blue-400 transition"
    onClick={() => setOpen(!open)}
  >
    <img
      src="https://i.pravatar.cc/40"
      alt="profile"
      className="w-full h-full object-cover"
    />
  </button>

  {/* Dropdown Overlay */}
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute right-0 top-12 w-48 bg-white shadow-xl rounded-xl overflow-hidden z-50"
      >
        <ul className="flex flex-col">
          <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Profile</li>
          <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Settings</li>
          <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500 font-medium">
            Logout
          </li>
        </ul>
      </motion.div>
    )}
  </AnimatePresence>
</div>

  );
}
