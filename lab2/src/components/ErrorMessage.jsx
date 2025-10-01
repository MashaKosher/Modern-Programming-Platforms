function ErrorMessage({ error, onRetry }) {
  if (!error) return null;

  return (
    <div className="error-message">
      <p>Произошла ошибка: {error}</p>
      {onRetry && (
        <button onClick={onRetry} className="retry-button">
          Попробовать снова
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
