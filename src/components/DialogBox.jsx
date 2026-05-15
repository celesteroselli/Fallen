import { useEffect, useMemo, useState } from 'react';

export default function DialogBox({
  interaction,
  turn,
  turnNumber,
  totalTurns,
  scriptComplete,
  distance,
  onAdvance
}) {
  const shouldType = turn.role !== 'player';
  const fullText = turn.text;
  const [visibleCount, setVisibleCount] = useState(shouldType ? 0 : fullText.length);

  useEffect(() => {
    setVisibleCount(shouldType ? 0 : fullText.length);
  }, [fullText, shouldType]);

  useEffect(() => {
    if (!shouldType || visibleCount >= fullText.length || scriptComplete) return undefined;

    const timeout = window.setTimeout(() => {
      setVisibleCount((count) => Math.min(count + 1, fullText.length));
    }, 24);

    return () => window.clearTimeout(timeout);
  }, [fullText.length, scriptComplete, shouldType, visibleCount]);

  const visibleText = useMemo(
    () => fullText.slice(0, visibleCount),
    [fullText, visibleCount]
  );
  const isLineComplete = visibleCount >= fullText.length;

  useEffect(() => {
    function handleSpace(event) {
      if (event.code !== 'Space') return;
      event.preventDefault();

      if (!isLineComplete) {
        setVisibleCount(fullText.length);
        return;
      }

      if (!scriptComplete) {
        onAdvance();
      }
    }

    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, [fullText.length, isLineComplete, onAdvance, scriptComplete]);

  return (
    <section className={`dialogBox ${turn.role}`} aria-label="Story dialog">
      <div className="sceneKicker">
        <span>{interaction.label}</span>
        <span>{distance ? `${distance.toFixed(1)}m` : `${turnNumber}/${totalTurns}`}</span>
      </div>
      <h1>{turn.speaker}</h1>
      <p>{visibleText}<span className="typeCursor" aria-hidden="true" /></p>
      <div className="spaceHint">
        {scriptComplete
          ? 'Choose what happens next'
          : isLineComplete
            ? 'Press Space to continue'
            : 'Press Space to finish the line'}
      </div>
    </section>
  );
}
