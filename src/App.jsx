import { useEffect, useMemo, useRef, useState } from 'react';
import { scenes } from './gameData.js';
import Scene3D from './components/Scene3D.jsx';
import HUD from './components/HUD.jsx';
import DialogBox from './components/DialogBox.jsx';
import ChoicePanel from './components/ChoicePanel.jsx';

const initialStats = {
  health: 20,
  humanity: 0,
  flags: {},
  objectives: []
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function uniqueItems(items) {
  return [...new Set(items)];
}

function interactionKey(sceneId, interactionId) {
  return `${sceneId}:${interactionId}`;
}

function resolveEffectValue(value, stats) {
  return typeof value === 'function' ? value(stats) : value || 0;
}

function resolveText(line, state) {
  return typeof line.text === 'function' ? line.text(state) : line.text;
}

function applyEffects(stats, effects = {}) {
  const nextFlags = { ...stats.flags, ...(effects.flags || {}) };
  const completed = new Set(effects.objectivesComplete || []);
  const nextObjectives = uniqueItems([
    ...stats.objectives.filter((objective) => !completed.has(objective)),
    ...(effects.objectivesAdd || [])
  ]);

  return {
    health: clamp(stats.health + resolveEffectValue(effects.health, stats), 0, 20),
    humanity: clamp(stats.humanity + resolveEffectValue(effects.humanity, stats), 0, 10),
    flags: nextFlags,
    objectives: nextObjectives
  };
}

export default function App() {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [stats, setStats] = useState(initialStats);
  const [selectedByInteraction, setSelectedByInteraction] = useState({});
  const [completedScripts, setCompletedScripts] = useState({});
  const [turnByInteraction, setTurnByInteraction] = useState({});
  const [nearbyObjectInfo, setNearbyObjectInfo] = useState(null);
  const [appliedSceneEffects, setAppliedSceneEffects] = useState({});
  const [appliedAutoEffects, setAppliedAutoEffects] = useState({});
  const [statFeedback, setStatFeedback] = useState(null);
  const [shameInteraction, setShameInteraction] = useState(null);
  const previousStats = useRef(initialStats);

  const currentScene = scenes[currentSceneIndex];
  const sceneObjects = currentScene.objects || [];
  const isLiteraryScene = currentScene.presentation === 'literary';
  const nearbyObject = useMemo(() => {
    if (!nearbyObjectInfo) return null;
    return sceneObjects.find((object) => object.id === nearbyObjectInfo.id) || null;
  }, [sceneObjects, nearbyObjectInfo]);

  const activeInteraction = shameInteraction || currentScene.cutscene || nearbyObject;
  const activeKey = activeInteraction
    ? interactionKey(currentScene.id, activeInteraction.id)
    : null;
  const activeScript = activeInteraction?.script || [];
  const turnIndex = activeKey ? turnByInteraction[activeKey] || 0 : 0;
  const activeTurn = activeScript[turnIndex] || null;
  const scriptComplete = activeKey ? Boolean(completedScripts[activeKey]) : false;

  const selectedChoices = useMemo(() => {
    if (!activeKey) return new Set();
    return new Set(selectedByInteraction[activeKey] || []);
  }, [activeKey, selectedByInteraction]);

  const sceneRequiredInteractions = [
    ...(currentScene.cutscene ? [currentScene.cutscene] : []),
    ...sceneObjects.filter((object) => (object.choices || []).length > 0 || object.autoEffects)
  ];
  const sceneComplete = sceneRequiredInteractions.every((interaction) => {
    const key = interactionKey(currentScene.id, interaction.id);
    const choices = interaction.choices || [];
    if (choices.length > 0) return (selectedByInteraction[key] || []).length > 0;
    return Boolean(completedScripts[key]);
  });
  const isLastScene = currentSceneIndex === scenes.length - 1;
  const healthDepleted = stats.health <= 0;
  const worldBrightness = 0.62 + stats.humanity * 0.055;
  const vignetteStrength = 0.76 - stats.humanity * 0.052;

  useEffect(() => {
    const previous = previousStats.current;

    if (previous.humanity !== stats.humanity) {
      setStatFeedback({
        key: `${Date.now()}-humanity`,
        type: 'humanity',
        direction: stats.humanity > previous.humanity ? 'up' : 'down'
      });
    } else if (previous.health !== stats.health) {
      setStatFeedback({
        key: `${Date.now()}-health`,
        type: 'health',
        direction: stats.health > previous.health ? 'up' : 'down'
      });
    }

    previousStats.current = stats;
  }, [stats]);

  useEffect(() => {
    if (!statFeedback) return undefined;
    const timeout = window.setTimeout(() => setStatFeedback(null), 950);
    return () => window.clearTimeout(timeout);
  }, [statFeedback]);

  useEffect(() => {
    if (appliedSceneEffects[currentScene.id]) return;

    setStats((previous) => {
      const withObjectives = {
        ...previous,
        objectives: currentScene.objectives || []
      };
      return currentScene.sceneStartEffects
        ? applyEffects(withObjectives, currentScene.sceneStartEffects)
        : withObjectives;
    });
    setAppliedSceneEffects((previous) => ({
      ...previous,
      [currentScene.id]: true
    }));
  }, [appliedSceneEffects, currentScene]);

  useEffect(() => {
    if (!activeInteraction?.autoEffects || !activeKey || appliedAutoEffects[activeKey]) return;

    setStats((previous) => applyEffects(previous, activeInteraction.autoEffects));
    setAppliedAutoEffects((previous) => ({
      ...previous,
      [activeKey]: true
    }));
  }, [activeInteraction, activeKey, appliedAutoEffects]);

  function handleAdvanceScript() {
    if (!activeKey || !activeScript.length) return;

    if (turnIndex < activeScript.length - 1) {
      setTurnByInteraction((previous) => ({
        ...previous,
        [activeKey]: turnIndex + 1
      }));
      return;
    }

    setCompletedScripts((previous) => ({
      ...previous,
      [activeKey]: true
    }));

    if (activeInteraction?.transient) {
      setShameInteraction(null);
    }
  }

  function handleChoice(choice) {
    if (!activeKey) return;

    setStats((previous) => applyEffects(previous, choice.effects));
    setSelectedByInteraction((previous) => ({
      ...previous,
      [activeKey]: [...(previous[activeKey] || []), choice.id]
    }));
  }

  function handleShadowGaze({ damage }) {
    if (currentScene.id !== 'town') return;

    if (!stats.flags.shameRealized) {
      setShameInteraction({
        id: 'shame-realization',
        label: 'Human Shadows',
        speaker: 'Inner Voice',
        transient: true,
        script: [
          {
            speaker: 'Inner Voice',
            role: 'inner',
            text: 'Their silhouettes turn me into an object before they even see my face.'
          },
          {
            speaker: 'Creature',
            role: 'player',
            text: 'This wound has a name. Shame. I have learned shame from the shape of human bodies.'
          }
        ],
        choices: []
      });
    }

    setStats((previous) =>
      applyEffects(previous, {
        health: -damage,
        flags: previous.flags.shameRealized ? {} : { shameRealized: true }
      })
    );
  }

  function handleContinue() {
    const nextIndex = Math.min(currentSceneIndex + 1, scenes.length - 1);
    setCurrentSceneIndex(nextIndex);
    setNearbyObjectInfo(null);
  }

  function handleRestart() {
    setCurrentSceneIndex(0);
    setStats(initialStats);
    setSelectedByInteraction({});
    setCompletedScripts({});
    setTurnByInteraction({});
    setNearbyObjectInfo(null);
    setAppliedSceneEffects({});
    setAppliedAutoEffects({});
  }

  return (
    <main
      className={`appShell ${statFeedback ? `feedback-${statFeedback.type}-${statFeedback.direction}` : ''}`}
      style={{
        '--world-brightness': worldBrightness,
        '--vignette-strength': vignetteStrength
      }}
    >
      {isLiteraryScene ? (
        <div className="literaryBackdrop" aria-hidden="true" />
      ) : (
        <Scene3D
          scene={currentScene}
          nearbyObjectId={nearbyObject?.id}
          onNearbyObjectChange={setNearbyObjectInfo}
          humanity={stats.humanity}
          onShadowGaze={handleShadowGaze}
        />
      )}

      <div className="topBar">
        <div>
          <span className="eyebrow">Scene {currentSceneIndex + 1} of {scenes.length}</span>
          <h1>{currentScene.title}</h1>
        </div>
      </div>

      <HUD
        health={stats.health}
        humanity={stats.humanity}
        feedback={statFeedback}
        objectives={stats.objectives}
        showObjectives={currentSceneIndex > 0}
      />

      {statFeedback && (
        <div key={statFeedback.key} className={`screenPulse ${statFeedback.type} ${statFeedback.direction}`} />
      )}

      {!activeInteraction && (
        <div className="proximityPrompt">
          Move close to an object to listen
        </div>
      )}

      {activeInteraction && activeTurn && (
        <div className={isLiteraryScene ? 'literaryDock' : 'bottomDock'}>
          <DialogBox
            interaction={activeInteraction}
            turn={{
              ...activeTurn,
              text: resolveText(activeTurn, stats)
            }}
            turnNumber={turnIndex + 1}
            totalTurns={activeScript.length}
            scriptComplete={scriptComplete}
            distance={nearbyObjectInfo?.distance}
            onAdvance={handleAdvanceScript}
          />
          {scriptComplete && (
            <ChoicePanel
              interaction={activeInteraction}
              stats={stats}
              selectedChoices={selectedChoices}
              sceneComplete={sceneComplete}
              isLastScene={isLastScene}
              healthDepleted={healthDepleted}
              onChoose={handleChoice}
              onContinue={handleContinue}
              onRestart={handleRestart}
            />
          )}
        </div>
      )}
    </main>
  );
}
