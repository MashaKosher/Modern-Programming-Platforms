function LoadingSpinner({ size = 'medium' }) {
  const sizeClass = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  }[size];

  return (
    <div className={`loading-spinner ${sizeClass}`}>
      <div className="spinner"></div>
    </div>
  );
}

export default LoadingSpinner;
