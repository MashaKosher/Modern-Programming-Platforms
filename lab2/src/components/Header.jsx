import { useEffect, useState } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import UserProfile from './UserProfile';

function Header() {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullText = 'Список задач';
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setShowCursor(false);
        }, 1000);
      }
    }, 100);

    return () => clearInterval(typeInterval);
  }, [fullText]);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-text">
          <h1 style={{ borderRight: showCursor ? '2px solid #ffd700' : 'none' }}>
            {displayText}
          </h1>
          <p className="subtitle">Управляйте своими задачами эффективно</p>
        </div>
        {isAuthenticated && <UserProfile />}
      </div>
    </header>
  );
}

export default Header;
