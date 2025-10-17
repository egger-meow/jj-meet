import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Shield, Heart, Car, Bike } from 'lucide-react';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-3xl font-bold text-primary-600">JJ-Meet</h1>
          <div className="flex gap-4">
            <Link to="/login" className="px-4 py-2 text-gray-700 hover:text-primary-600">
              Login
            </Link>
            <Link to="/register" className="btn-primary">
              Sign Up
            </Link>
          </div>
        </nav>

        <div className="text-center py-16">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Travel. Connect. <span className="text-primary-500">Explore.</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with locals and travelers for authentic travel experiences. 
            Find your perfect guide or fellow adventurer.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register" className="btn-primary text-lg px-8 py-3">
              Get Started
            </Link>
            <Link to="/login" className="bg-white text-primary-600 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-semibold text-lg border-2 border-primary-200">
              I Have an Account
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 py-16">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <MapPin className="text-primary-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Location-Based Matching</h3>
            <p className="text-gray-600">
              Find locals and travelers nearby. Perfect for spontaneous adventures and planned trips.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Users className="text-secondary-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Local Guides & Travelers</h3>
            <p className="text-gray-600">
              Locals can show visitors around, while travelers can find companions for their journey.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Shield className="text-green-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Safe & Verified</h3>
            <p className="text-gray-600">
              Verified profiles, ratings, and safety features ensure secure and enjoyable experiences.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2">Create Profile</h4>
              <p className="text-sm text-gray-600">Set up as a tourist, local guide, or both</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2">Swipe & Match</h4>
              <p className="text-sm text-gray-600">Find people with similar interests</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2">Chat & Plan</h4>
              <p className="text-sm text-gray-600">Connect and plan your adventure</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-500 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h4 className="font-semibold mb-2">Meet & Explore</h4>
              <p className="text-sm text-gray-600">Enjoy authentic local experiences</p>
            </div>
          </div>
        </div>

        {/* Unique Features */}
        <div className="py-16 bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold text-center mb-12">What Makes Us Different</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <Car className="text-primary-500 mt-1" size={24} />
              <div>
                <h4 className="font-semibold mb-2">Transportation Info</h4>
                <p className="text-gray-600">See who has a car or motorcycle for easier trip planning</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Heart className="text-primary-500 mt-1" size={24} />
              <div>
                <h4 className="font-semibold mb-2">Travel-Focused Matching</h4>
                <p className="text-gray-600">Match based on travel interests and destination preferences</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Shield className="text-primary-500 mt-1" size={24} />
              <div>
                <h4 className="font-semibold mb-2">Verified Local Guides</h4>
                <p className="text-gray-600">Authenticated profiles with ratings and reviews</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Users className="text-primary-500 mt-1" size={24} />
              <div>
                <h4 className="font-semibold mb-2">Group Adventures</h4>
                <p className="text-gray-600">Connect with multiple travelers for group activities</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
