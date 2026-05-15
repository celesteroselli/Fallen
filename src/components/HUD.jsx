function StatBar({ label, value, max = 10, tone }) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div className="barBlock">
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

export default function HUD({ health, humanity, exposure, objectives, showObjectives }) {
  return (
    <aside className="hud" aria-label="Player status">
      <div className="hudHeader">
        <span>Creature</span>
      </div>

      <StatBar label="Humanity" value={humanity} tone="humanityFill" />
      <StatBar label="Exposure" value={exposure} tone="exposureFill" />
      <StatBar label="Health" value={health} max={20} tone="healthFill" />

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
