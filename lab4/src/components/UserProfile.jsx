import { useAuthContext } from '../hooks/useAuthContext';

function UserProfile() {
    const { user, logout } = useAuthContext();

    if (!user) {
        return null;
    }

    const handleLogout = () => {
        if (window.confirm('Вы уверены, что хотите выйти?')) {
            logout();
        }
    };

    return (
        <div className="user-profile">
            <div className="user-info">
                <div className="user-avatar">
                    <i className="fas fa-user"></i>
                </div>
                <div className="user-details">
                    <div className="username">{user.username}</div>
                    <div className="email">{user.email}</div>
                </div>
            </div>
            <button
                onClick={handleLogout}
                className="logout-button"
                title="Выйти из системы"
            >
                <i className="fas fa-sign-out-alt"></i>
            </button>
        </div>
    );
}

export default UserProfile;
