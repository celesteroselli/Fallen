import { useMemo, useState } from 'react';
import { scenes } from './gameData.js';
import Scene3D from './components/Scene3D.jsx';
import HUD from './components/HUD.jsx';
import DialogBox from './components/DialogBox.jsx';
import ChoicePanel from './components/ChoicePanel.jsx';

const initialStats = {
  health: 10,
  humanity: 0,
  exposure: 0,
  flags: {},
  objectives: []
};

function clampStat(value) {
  return Math.max(0, Math.min(10, value));
}

function uniqueItems(items) {
  return [...new Set(items)];
}

function objectKey(sceneId, objectId) {
  return `${sceneId}:${objectId}`;
}

function resolveText(line, state) {
  return typeof line === 'function' ? line(state) : line;
}

function applyChoiceEffects(stats, effects = {}) {
  // To add a new stat effect, extend this reducer and then reference that
  // effect key from an object choice in gameData.js.
  const nextFlags = { ...stats.flags, ...(effects.flags || {}) };
  const completed = new Set(effects.objectivesComplete || []);
  const nextObjectives = uniqueItems([
    ...stats.objectives.filter((objective) => !completed.has(objective)),
    ...(effects.objectivesAdd || [])
  ]);

  return {
    health: clampStat(stats.health + (effects.health || 0)),
    humanity: clampStat(stats.humanity + (effects.humanity || 0)),
    exposure: clampStat(stats.exposure + (effects.exposure || 0)),
    flags: nextFlags,
    objectives: nextObjectives
  };
}

export default function App() {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [stats, setStats] = useState(initialStats);
  const [selectedByObject, setSelectedByObject] = useState({});
  const [nearbyObjectInfo, setNearbyObjectInfo] = useState(null);

  const currentScene = scenes[currentSceneIndex];
  const nearbyObject = useMemo(() => {
    if (!nearbyObjectInfo) return null;
    return currentScene.objects.find((object) => object.id === nearbyObjectInfo.id) || null;
  }, [currentScene, nearbyObjectInfo]);

  const selectedChoices = useMemo(() => {
    if (!nearbyObject) return new Set();
    return new Set(selectedByObject[objectKey(currentScene.id, nearbyObject.id)] || []);
  }, [currentScene.id, nearbyObject, selectedByObject]);

  const dialogLines = useMemo(() => {
    if (!nearbyObject) return [];
    return nearbyObject.dialog.map((line) => resolveText(line, stats));
  }, [nearbyObject, stats]);

  const sceneInteractiveObjects = currentScene.objects.filter(
    (object) => (object.choices || []).length > 0
  );
  const completedObjects = sceneInteractiveObjects.filter((object) => {
    const selected = selectedByObject[objectKey(currentScene.id, object.id)] || [];
    return selected.length > 0;
  });
  const sceneComplete = sceneInteractiveObjects.length === completedObjects.length;
  const isLastScene = currentSceneIndex === scenes.length - 1;

  function handleChoice(choice) {
    if (!nearbyObject) return;

    setStats((previous) => applyChoiceEffects(previous, choice.effects));
    setSelectedByObject((previous) => ({
      ...previous,
      [objectKey(currentScene.id, nearbyObject.id)]: [
        ...(previous[objectKey(currentScene.id, nearbyObject.id)] || []),
        choice.id
      ]
    }));
  }

  function handleContinue() {
    const nextIndex = Math.min(currentSceneIndex + 1, scenes.length - 1);
    const nextScene = scenes[nextIndex];

    setCurrentSceneIndex(nextIndex);
    setNearbyObjectInfo(null);
    setStats((previous) => ({
      ...previous,
      objectives: nextScene.objectives || []
    }));
  }

  function handleRestart() {
    setCurrentSceneIndex(0);
    setStats(initialStats);
    setSelectedByObject({});
    setNearbyObjectInfo(null);
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
        <div className="pathBadge">Fixed story order</div>
      </div>

      <HUD
        health={stats.health}
        humanity={stats.humanity}
        exposure={stats.exposure}
        objectives={stats.objectives}
        showObjectives={currentSceneIndex > 0}
      />

      {!nearbyObject && (
        <div className="proximityPrompt">
          Move close to an object to read and respond
        </div>
      )}

      {nearbyObject && (
        <div className="bottomDock">
          <DialogBox
            interaction={nearbyObject}
            lines={dialogLines}
            distance={nearbyObjectInfo.distance}
          />
          <ChoicePanel
            interaction={nearbyObject}
            flags={stats.flags}
            selectedChoices={selectedChoices}
            sceneComplete={sceneComplete}
            isLastScene={isLastScene}
            onChoose={handleChoice}
            onContinue={handleContinue}
            onRestart={handleRestart}
          />
        </div>
      )}
    </main>
  );
}
