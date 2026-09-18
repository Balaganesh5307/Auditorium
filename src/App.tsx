import { useState, useCallback, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import AuditoriumScene from './scene/AuditoriumScene';
import IntroScreen from './components/IntroScreen';
import TeamPanel from './components/TeamPanel';
import Navigation from './components/Navigation';
import TeamSearch from './components/TeamSearch';
import type { CameraState } from './scene/CameraController';
import { useAdmin } from './context/AdminContext';
import { getTablePositionDynamic } from './components/SeatingMap';

// Dynamically code-split Admin components so they NEVER load over the network for regular users
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const AdminLoginModal = lazy(() => import('./components/AdminLoginModal'));

// Compute table positions (mirroring SeatingMap logic)

const DEFAULT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const DEFAULT_COLS = [1, 2, 3, 4, 5];

export default function App() {
  const {
    rows = DEFAULT_ROWS,
    cols = DEFAULT_COLS,
    teams = {},
    eventName = 'BUILDATHON',
    eventYear = '2026',
    isAdmin,
    isLoginModalOpen,
  } = useAdmin();

  useEffect(() => {
    document.title = `${eventName} ${eventYear} — Auditorium`;
  }, [eventName, eventYear]);

  const [appState, setAppState] = useState<'intro' | 'entering' | 'auditorium' | 'table'>('intro');
  const [cameraState, setCameraState] = useState<CameraState>('INTRO');
  const [shutterOpen, setShutterOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const transitioning = useRef(false);

  const selectedTablePosition = useMemo(() => {
    if (!selectedTableId) return null;
    const row = selectedTableId.charAt(0);
    const col = parseInt(selectedTableId.substring(1));
    const pos = getTablePositionDynamic(row, col, rows, cols);
    // +2 matches SeatingMap group offset
    return [pos[0], pos[1], pos[2] + 2] as [number, number, number];
  }, [selectedTableId, rows, cols]);

  const handleEnter = useCallback(() => {
    if (transitioning.current) return;
    transitioning.current = true;

    setShutterOpen(true);
    setAppState('entering');

    setTimeout(() => {
      setCameraState('AUDITORIUM');
    }, 400);
  }, []);

  const handleTableSelect = useCallback(
    (tableId: string) => {
      if (transitioning.current || appState !== 'auditorium') return;
      transitioning.current = true;

      // Batch the initial state updates together to avoid multiple re-renders
      setSelectedTableId(tableId);
      setCameraState('TABLE');
      setAppState('table');

      // Show panel after camera settles
      setTimeout(() => {
        setPanelVisible(true);
        transitioning.current = false;
      }, 800);
    },
    [appState]
  );

  const handleBack = useCallback(() => {
    if (transitioning.current) return;
    transitioning.current = true;
    setPanelVisible(false);

    // Single timeout — start camera move after panel begins sliding out
    setTimeout(() => {
      // Batch these together
      setCameraState('AUDITORIUM');
      setAppState('auditorium');
      setSelectedTableId(null);

      setTimeout(() => {
        transitioning.current = false;
      }, 1000);
    }, 250);
  }, []);

  const handleBackToHome = useCallback(() => {
    if (transitioning.current) return;
    transitioning.current = true;

    // Close panel if open
    setPanelVisible(false);
    setSelectedTableId(null);

    // Transition camera back to intro position
    setCameraState('INTRO');

    // After camera starts moving, fade in the intro screen
    setTimeout(() => {
      setAppState('intro');
      setShutterOpen(false);
      transitioning.current = false;
    }, 600);
  }, []);

  const handleTransitionComplete = useCallback(() => {
    transitioning.current = false;
    setAppState((prev) => (prev === 'entering' ? 'auditorium' : prev));
  }, []);

  const showIntro = appState === 'intro' || appState === 'entering';

  return (
    <>
      <AuditoriumScene
        cameraState={cameraState}
        shutterOpen={shutterOpen}
        selectedTableId={selectedTableId}
        selectedTablePosition={selectedTablePosition}
        onTableSelect={handleTableSelect}
        onTransitionComplete={handleTransitionComplete}
        rows={rows}
        cols={cols}
        teams={teams}
        eventName={eventName}
        eventYear={eventYear}
      />

      <IntroScreen
        visible={appState === 'intro'}
        onEnter={handleEnter}
      />

      {!showIntro && (
        <>
          <Navigation onBackToHome={handleBackToHome} />
          {isAdmin && (
            <Suspense fallback={null}>
              <AdminPanel />
            </Suspense>
          )}
          {isLoginModalOpen && (
            <Suspense fallback={null}>
              <AdminLoginModal />
            </Suspense>
          )}
          <TeamSearch
            onTableSelect={handleTableSelect}
            visible={appState === 'auditorium'}
          />
        </>
      )}

      <TeamPanel
        tableId={selectedTableId}
        visible={panelVisible}
        onBack={handleBack}
      />
    </>
  );
}
