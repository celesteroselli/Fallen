function StatBar({ label, value, max = 10, tone, isChanging }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className={`barBlock ${isChanging ? 'barChanged' : ''}`}>
      <div className="statLabel">
        <span>{label}</span>
        <strong>{value}/{max}</strong>
      </div>
      <div className="statTrack">
        <div className={`statFill ${tone}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function HUD({ health, humanity, feedback, objectives, showObjectives }) {
  return (
    <aside className="hud" aria-label="Player status">
      <div className="hudHeader">
        <span>Creature</span>
      </div>

      <StatBar
        label="Humanity"
        value={humanity}
        tone="humanityFill"
        isChanging={feedback?.type === 'humanity'}
      />
      <StatBar
        label="Health"
        value={health}
        max={20}
        tone="healthFill"
        isChanging={feedback?.type === 'health'}
      />

      {showObjectives && (
        <section>
        <h2>Objectives</h2>
        {objectives.length ? (
          <ul className="objectiveList">
            {objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        ) : (
          <p className="emptyText">No active objective</p>
        )}
        </section>
      )}
    </aside>
  );
}
