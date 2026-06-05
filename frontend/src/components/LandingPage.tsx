// src/components/LandingPage.tsx
import React from "react";
import { Link } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext"; // Temporarily commented out
// import { useNavigate } from "react-router-dom"; // Temporarily commented out

const LandingPage: React.FC = () => {
  console.log("🚀 LandingPage rendered"); // Log to confirm LandingPage loads

  // const { currentUser } = useAuth(); // Temporarily commented out
  // const navigate = useNavigate(); // Temporarily commented out

  const someUnmetCondition = false; // Replace with your actual condition

  if (someUnmetCondition) {
    return <div className="text-red-500 p-4">Something went wrong</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            QR Code Verification System
          </h1>
          <div>
            <Link
              to="/login"
              className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1>
                <span className="block text-sm font-semibold uppercase tracking-wide text-gray-500 sm:text-base lg:text-sm xl:text-base">
                  Introducing
                </span>
                <span className="mt-1 block text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl">
                  <span className="block text-gray-900">
                    Dynamic QR Code and CDP
                  </span>
                  <span className="block text-blue-600">
                    Verification System
                  </span>
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                A secure and efficient way to verify product authenticity. Scan
                QR codes, track products, and access detailed analytics, all in
                one place.
              </p>

              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/login"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                    >
                      Get Started
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/login?register=true"
                      className="w-full flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <svg
                    className="w-full h-64 text-gray-200"
                    fill="currentColor"
                    viewBox="0 0 200 200"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0,0 L0,10 L10,10 L10,0 L0,0 Z M20,0 L20,10 L30,10 L30,0 L20,0 Z M40,0 L40,10 L50,10 L50,0 L40,0 Z M60,0 L60,10 L70,10 L70,0 L60,0 Z M80,0 L80,10 L90,10 L90,0 L80,0 Z M100,0 L100,10 L110,10 L110,0 L100,0 Z M120,0 L120,10 L130,10 L130,0 L120,0 Z M140,0 L140,10 L150,10 L150,0 L140,0 Z M160,0 L160,10 L170,10 L170,0 L160,0 Z M180,0 L180,10 L190,10 L190,0 L180,0 Z M0,20 L0,30 L10,30 L10,20 L0,20 Z M80,20 L80,30 L90,30 L90,20 L80,20 Z M100,20 L100,30 L110,30 L110,20 L100,20 Z M120,20 L120,30 L130,30 L130,20 L120,20 Z M180,20 L180,30 L190,30 L190,20 L180,20 Z M0,40 L0,50 L10,50 L10,40 L0,40 Z M20,40 L20,50 L30,50 L30,40 L20,40 Z M40,40 L40,50 L50,50 L50,40 L40,40 Z M60,40 L60,50 L70,50 L70,40 L60,40 Z M80,40 L80,50 L90,50 L90,40 L80,40 Z M120,40 L120,50 L130,50 L130,40 L120,40 Z M140,40 L140,50 L150,50 L150,40 L140,40 Z M160,40 L160,50 L170,50 L170,40 L160,40 Z M180,40 L180,50 L190,50 L190,40 L180,40 Z M80,60 L80,70 L90,70 L90,60 L80,60 Z M100,60 L100,70 L110,70 L110,60 L100,60 Z M140,60 L140,70 L150,70 L150,60 L140,60 Z M0,80 L0,90 L10,90 L10,80 L0,80 Z M20,80 L20,90 L30,90 L30,80 L20,80 Z M40,80 L40,90 L50,90 L50,80 L40,80 Z M60,80 L60,90 L70,90 L70,80 L60,80 Z M80,80 L80,90 L90,90 L90,80 L80,80 Z M100,80 L100,90 L110,90 L110,80 L100,80 Z M120,80 L120,90 L130,90 L130,80 L120,80 Z M140,80 L140,90 L150,90 L150,80 L140,80 Z M160,80 L160,90 L170,90 L170,80 L160,80 Z M180,80 L180,90 L190,90 L190,80 L180,80 Z"
                      className="text-blue-500"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; 2025 Dynamic QR Code and CDP Verification System. All rights
            reserved. <span className="text-blue-500">WiseMedium</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
