import { useTaskContext } from '../hooks/useTaskContext';

function Stats() {
  const { stats } = useTaskContext();

  return (
    <div className="stats">
      <div className="stat-item">
        <span className="stat-number">{stats.total}</span>
        <span className="stat-label">Всего задач</span>
      </div>
      <div className="stat-item">
        <span className="stat-number">{stats.completed}</span>
        <span className="stat-label">Выполнено</span>
      </div>
      <div className="stat-item">
        <span className="stat-number">{stats.active}</span>
        <span className="stat-label">Активных</span>
      </div>
    </div>
  );
}

export default Stats;
