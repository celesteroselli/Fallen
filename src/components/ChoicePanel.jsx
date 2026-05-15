function describeEffects(effects = {}) {
  const parts = [];
  if (effects.health) parts.push('Health changes');
  if (effects.humanity) parts.push('Humanity changes');
  return parts.join(' · ');
}

function isAvailable(choice, stats) {
  if (choice.requiresFlag && !stats.flags[choice.requiresFlag]) return false;
  if (choice.requiresHumanity && stats.humanity < choice.requiresHumanity) return false;
  return true;
}

function requirementText(choice) {
  if (choice.requiresHumanity) return `Requires Humanity ${choice.requiresHumanity}`;
  if (choice.requiresFlag) return `Requires ${choice.requiresFlag}`;
  return 'Unavailable';
}

export default function ChoicePanel({
  interaction,
  stats,
  selectedChoices,
  sceneComplete,
  isLastScene,
  healthDepleted,
  onChoose,
  onContinue,
  onRestart
}) {
  const choices = interaction.choices || [];
  const alreadyResponded = selectedChoices.size > 0;
  const finalChoiceLocked = isLastScene && healthDepleted && !alreadyResponded;

  return (
    <section className="choicePanel" aria-label="Choices">
      <div className="panelTitle">
        <h2>{choices.length ? 'Response' : 'Scene'}</h2>
        <span>{selectedChoices.size}/{choices.length}</span>
      </div>

      {finalChoiceLocked && (
        <p className="emptyText interactionHint">
          Your health is gone before the last act. The ocean keeps the answer.
        </p>
      )}

      {choices.length > 0 && !finalChoiceLocked && (
        <div className="choiceList">
          {choices.map((choice) => {
            const chosen = selectedChoices.has(choice.id);
            const available = isAvailable(choice, stats);
            const disabled = alreadyResponded || !available;

            return (
              <button
                className="choiceButton"
                type="button"
                key={choice.id}
                disabled={disabled}
                onClick={() => onChoose(choice)}
              >
                <span>{choice.text}</span>
                <small>
                  {chosen
                    ? 'Chosen'
                    : alreadyResponded
                      ? 'Already answered'
                    : available
                      ? describeEffects(choice.effects)
                      : requirementText(choice)}
                </small>
              </button>
            );
          })}
        </div>
      )}

      {choices.length === 0 && (
        <p className="emptyText interactionHint">This moment is over. Continue.</p>
      )}

      {sceneComplete && !isLastScene && (
        <button className="primaryButton fullWidth" type="button" onClick={onContinue}>
          Continue
        </button>
      )}

      {(sceneComplete || finalChoiceLocked) && isLastScene && (
        <div className="endingPanel">
          <p>
            The story ends at the ice. Whether mercy survives depends on what humanity
            remained when Victor was gone.
          </p>
          <button className="primaryButton fullWidth" type="button" onClick={onRestart}>
            Begin Again
          </button>
        </div>
      )}
    </section>
  );
}
