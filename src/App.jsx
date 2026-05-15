import { useEffect, useMemo, useState } from 'react';
import { scenes } from './gameData.js';
import Scene3D from './components/Scene3D.jsx';
import HUD from './components/HUD.jsx';
import DialogBox from './components/DialogBox.jsx';
import ChoicePanel from './components/ChoicePanel.jsx';

const initialStats = {
  health: 20,
  humanity: 0,
  exposure: 0,
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
    exposure: clamp(stats.exposure + resolveEffectValue(effects.exposure, stats), 0, 10),
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

  const currentScene = scenes[currentSceneIndex];
  const sceneObjects = currentScene.objects || [];
  const nearbyObject = useMemo(() => {
    if (!nearbyObjectInfo) return null;
    return sceneObjects.find((object) => object.id === nearbyObjectInfo.id) || null;
  }, [sceneObjects, nearbyObjectInfo]);

  const activeInteraction = currentScene.cutscene || nearbyObject;
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
  }

  function handleChoice(choice) {
    if (!activeKey) return;

    setStats((previous) => applyEffects(previous, choice.effects));
    setSelectedByInteraction((previous) => ({
      ...previous,
      [activeKey]: [...(previous[activeKey] || []), choice.id]
    }));
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
    <main className="appShell">
      <Scene3D
        scene={currentScene}
        nearbyObjectId={nearbyObject?.id}
        onNearbyObjectChange={setNearbyObjectInfo}
      />

      <div className="topBar">
        <div>
          <span className="eyebrow">Scene {currentSceneIndex + 1} of {scenes.length}</span>
          <h1>{currentScene.title}</h1>
        </div>
      </div>

      <HUD
        health={stats.health}
        humanity={stats.humanity}
        exposure={stats.exposure}
        objectives={stats.objectives}
        showObjectives={currentSceneIndex > 0}
      />

      {!activeInteraction && (
        <div className="proximityPrompt">
          Move close to an object to listen
        </div>
      )}

      {activeInteraction && activeTurn && (
        <div className="bottomDock">
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
