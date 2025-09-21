import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function Navbar({ user }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
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
              onClick={handleSignOut}
              className="bg-purdue-gold text-black px-4 py-1 rounded hover:bg-opacity-90 transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
