import React, { useContext, useState, useEffect, useRef } from "react";
import { assets } from "../assets/assets";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const { token, setToken, userData } = useContext(AppContext);

  // Logout handler
  const logout = () => {
    localStorage.removeItem("token");
    setToken(false);
    navigate("/login");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  // Only show logo on auth pages
  if (isAuthPage) {
    return (
      <header className="w-full bg-white border-b border-gray-200 shadow-sm py-4 flex justify-center sm:justify-start px-4 sm:px-8">
        <img
          onClick={() => navigate("/")}
          src={assets.logo}
          alt="CareConnect Logo"
          className="w-32 sm:w-44 cursor-pointer object-contain"
        />
      </header>
    );
  }

  return (
    <nav className="w-full flex items-center justify-between py-4 px-4 sm:px-8 border-b border-gray-200 bg-white shadow-sm">
      {/* Logo */}
      <img
        onClick={() => navigate("/")}
        src={assets.logo}
        alt="CareConnect Logo"
        className="w-32 sm:w-44 cursor-pointer object-contain"
      />

      {/* Desktop Menu */}
      <ul className="hidden md:flex items-center gap-8 font-medium text-gray-700">
        <NavLink to="/" className="hover:text-primary transition">
          <li>HOME</li>
        </NavLink>
        <NavLink to="/doctors" className="hover:text-primary transition">
          <li>ALL DOCTORS</li>
        </NavLink>
        <NavLink to="/about" className="hover:text-primary transition">
          <li>ABOUT</li>
        </NavLink>
        <NavLink to="/contact" className="hover:text-primary transition">
          <li>CONTACT</li>
        </NavLink>
      </ul>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {token && userData ? (
          <div ref={dropdownRef} className="relative flex items-center gap-2">
            {/* User Avatar + Dropdown Trigger */}
            <div
              onClick={() => setShowDropdown((prev) => !prev)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img
                src={userData.image || assets.default_user}
                alt="User"
                className="w-8 h-8 rounded-full object-cover border"
              />
              <img src={assets.dropdown_icon} alt="Dropdown" className="w-2.5" />
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute top-14 right-0 bg-white border rounded-lg shadow-md text-gray-600 text-sm w-48 py-2 z-20">
                <p
                  onClick={() => {
                    navigate("/my-profile");
                    setShowDropdown(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  My Profile
                </p>
                <p
                  onClick={() => {
                    navigate("/my-appointments");
                    setShowDropdown(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  My Appointments
                </p>
                <p
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500 font-medium"
                >
                  Logout
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden md:flex gap-3">
            <button
              onClick={() => navigate("/login")}
              className="bg-primary text-white px-5 py-2 rounded-full font-medium hover:bg-primary/90 transition"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="bg-green-500 text-white px-5 py-2 rounded-full font-medium hover:bg-green-600 transition"
            >
              Create Account
            </button>
          </div>
        )}

        {/* Mobile Menu Icon */}
        <img
          onClick={() => setShowMenu(true)}
          src={assets.menu_icon}
          alt="Menu"
          className="w-6 md:hidden cursor-pointer"
        />
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 right-0 h-full bg-white z-40 shadow-lg transition-all duration-300 overflow-hidden ${
          showMenu ? "w-64" : "w-0"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-6 border-b">
          <img src={assets.logo} className="w-32 object-contain" alt="Logo" />
          <img
            onClick={() => setShowMenu(false)}
            src={assets.cross_icon}
            className="w-7 cursor-pointer"
            alt="Close"
          />
        </div>

        <ul className="flex flex-col items-start gap-4 mt-6 px-6 font-medium text-gray-700">
          <NavLink onClick={() => setShowMenu(false)} to="/" className="hover:text-primary w-full">
            HOME
          </NavLink>
          <NavLink onClick={() => setShowMenu(false)} to="/doctors" className="hover:text-primary w-full">
            ALL DOCTORS
          </NavLink>
          <NavLink onClick={() => setShowMenu(false)} to="/about" className="hover:text-primary w-full">
            ABOUT
          </NavLink>
          <NavLink onClick={() => setShowMenu(false)} to="/contact" className="hover:text-primary w-full">
            CONTACT
          </NavLink>
        </ul>

        <div className="mt-8 px-6 flex flex-col gap-3">
          {token ? (
            <button
              onClick={logout}
              className="w-full bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition"
            >
              Logout
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  navigate("/login");
                  setShowMenu(false);
                }}
                className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 transition"
              >
                Login
              </button>
              <button
                onClick={() => {
                  navigate("/register");
                  setShowMenu(false);
                }}
                className="w-full bg-green-500 text-white py-2 rounded-lg font-medium hover:bg-green-600 transition"
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
