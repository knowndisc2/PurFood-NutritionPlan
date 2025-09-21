import React, { useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import Settings from './Settings';

function Navbar({ user }) {
  const [showSettings, setShowSettings] = useState(false);

  const handleSignOut = async () => {
    try {
      // Close settings modal if open
      setShowSettings(false);
      
      // Clear any pending onboarding state
      localStorage.removeItem('onboarding.pending');
      
      // Sign out - Auth.js will automatically detect this and show the auth page
      await signOut(auth);
      
      console.log('Successfully signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-black text-purdue-gold p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">PurFood</div>
        {user && (
          <div className="flex items-center space-x-4">
            <span className="text-sm">{user.email}</span>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-purdue-gold hover:bg-neutral-800 rounded-lg transition-colors"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={handleSignOut}
              className="bg-purdue-gold text-black px-4 py-1 rounded hover:bg-opacity-90 transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
      
      {/* Settings Modal */}
      <Settings 
        user={user} 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </nav>
  );
}

export default Navbar;
