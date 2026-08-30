import { useCallback, useEffect, useMemo, useState } from 'react';
import AppShell from './components/AppShell';
import AppToast from './components/AppToast';
import OnboardingModal from './components/OnboardingModal';
import { LoadingPanel, Notice } from './components/Ui';
import useToast from './hooks/useToast';
import { setUnauthorizedHandler, trackerApi, userApi } from './lib/api';
import { recentDateRange } from './lib/format';
import { DEFAULT_PREFERENCES, readPreferences, writePreferences } from './lib/preferences';
import AuthPage from './pages/AuthPage';
import CarePage from './pages/CarePage';
import CheckInPage from './pages/CheckInPage';
import MedicationsPage from './pages/MedicationsPage';
import MoodPage from './pages/MoodPage';
import OverviewPage from './pages/OverviewPage';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';
import SleepPage from './pages/SleepPage';
import SymptomsPage from './pages/SymptomsPage';
import SharedReportPage from './pages/SharedReportPage';
import WellnessPage from './pages/WellnessPage';

const emptyData = {
  moods: [],
  symptoms: [],
  sleep: [],
  medications: [],
  medicationDoses: [],
  tagsByMood: {},
};

const loadStoredSession = () => {
  try {
    const stored = localStorage.getItem('mindhaven-session');
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem('mindhaven-session');
    return null;
  }
};

export default function App() {
  const sharedReportToken = new URLSearchParams(window.location.search).get('share');
  const [session, setSession] = useState(loadStoredSession);
  const [activePage, setActivePage] = useState('overview');
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(Boolean(session));
  const [loadError, setLoadError] = useState('');
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const { dismiss: dismissToast, notify, runAction: runToastAction, toast } = useToast();

  const logout = useCallback(() => {
    localStorage.removeItem('mindhaven-session');
    setSession(null);
    setData(emptyData);
    setActivePage('overview');
    setOnboardingOpen(false);
    dismissToast();
  }, [dismissToast]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (!session?.user?._id || !session?.token) return undefined;
    let active = true;
    const storedPreferences = readPreferences(session.user._id);
    const sessionPreferences = session.user.preferences
      ? { ...DEFAULT_PREFERENCES, ...session.user.preferences }
      : storedPreferences;
    setPreferences(sessionPreferences);

    userApi.getPreferences(session.token)
      .then((serverPreferences) => {
        if (!active) return;
        const synced = writePreferences(session.user._id, serverPreferences);
        setPreferences(synced);
        setOnboardingOpen(!synced.completedOnboarding);
      })
      .catch(() => {
        if (!active) return;
        setOnboardingOpen(!sessionPreferences.completedOnboarding);
      });
    return () => { active = false; };
  }, [session?.token, session?.user?._id]);

  const savePreferences = useCallback(async (nextPreferences) => {
    if (!session?.user?._id) return;
    try {
      const serverPreferences = await userApi.updatePreferences(session.token, nextPreferences);
      const saved = writePreferences(session.user._id, serverPreferences);
      setPreferences(saved);
      setOnboardingOpen(false);
      updateUser({ preferences: saved });
      notify('Your preferences are synced to your account.');
    } catch (requestError) {
      notify(requestError.message);
    }
  }, [notify, session?.token, session?.user?._id]);

  const refreshData = useCallback(
    async ({ silent = false } = {}) => {
      if (!session?.token) return;
      if (!silent) setLoading(true);
      setLoadError('');

      try {
        const [moods, symptoms, sleep, medications, medicationDoses] = await Promise.all([
          trackerApi.getMoods(session.token),
          trackerApi.getSymptoms(session.token),
          trackerApi.getSleep(session.token),
          trackerApi.getMedications(session.token),
          trackerApi.getMedicationDoses(session.token, recentDateRange(7)),
        ]);
        const tagPairs = await Promise.all(
          moods.map(async (mood) => {
            try {
              return [mood._id, await trackerApi.getTags(session.token, mood._id)];
            } catch {
              return [mood._id, []];
            }
          }),
        );

        setData({ moods, symptoms, sleep, medications, medicationDoses, tagsByMood: Object.fromEntries(tagPairs) });
      } catch (requestError) {
        setLoadError(requestError.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [session?.token],
  );

  useEffect(() => {
    if (session?.token) refreshData();
  }, [refreshData, session?.token]);

  const authenticate = (response) => {
    const nextSession = {
      token: response.token,
      user: {
        _id: response._id,
        name: response.name,
        email: response.email,
        profileImage: response.profileImage || '',
        preferences: response.preferences || DEFAULT_PREFERENCES,
      },
    };
    localStorage.setItem('mindhaven-session', JSON.stringify(nextSession));
    setSession(nextSession);
    setActivePage('overview');
  };

  const updateUser = (updated) => {
    setSession((current) => {
      const next = { ...current, user: { ...current.user, ...updated } };
      localStorage.setItem('mindhaven-session', JSON.stringify(next));
      return next;
    });
  };

  const page = useMemo(() => {
    if (!session) return null;
    const sharedTrackerProps = {
      token: session.token,
      onSaved: () => refreshData({ silent: true }),
      notify,
    };

    switch (activePage) {
      case 'checkin':
        return <CheckInPage {...sharedTrackerProps} onNavigate={setActivePage} />;
      case 'mood':
        return <MoodPage {...sharedTrackerProps} data={data} />;
      case 'symptoms':
        return <SymptomsPage {...sharedTrackerProps} entries={data.symptoms} />;
      case 'sleep':
        return <SleepPage {...sharedTrackerProps} entries={data.sleep} />;
      case 'medications':
        return <MedicationsPage {...sharedTrackerProps} entries={data.medications} doses={data.medicationDoses} />;
      case 'reports':
        return <ReportsPage token={session.token} notify={notify} data={data} onNavigate={setActivePage} />;
      case 'wellness':
        return <WellnessPage preferences={preferences} onNavigate={setActivePage} />;
      case 'care':
        return <CarePage token={session.token} notify={notify} />;
      case 'profile':
        return (
          <ProfilePage
            token={session.token}
            user={session.user}
            onUserUpdated={updateUser}
            onAccountDeleted={logout}
            notify={notify}
            preferences={preferences}
            onPreferencesSaved={savePreferences}
            onOpenOnboarding={() => setOnboardingOpen(true)}
          />
        );
      default:
        return (
          <OverviewPage
            data={data}
            user={session.user}
            token={session.token}
            onSaved={() => refreshData({ silent: true })}
            notify={notify}
            onNavigate={setActivePage}
            preferences={preferences}
          />
        );
    }
  }, [activePage, data, notify, preferences, refreshData, savePreferences, session]);

  if (sharedReportToken) return <SharedReportPage shareToken={sharedReportToken} />;
  if (!session) return <AuthPage onAuthenticated={authenticate} />;

  return (
    <AppShell
      activePage={activePage}
      onNavigate={setActivePage}
      user={session.user}
      onLogout={logout}
      preferences={preferences}
      onOpenOnboarding={() => setOnboardingOpen(true)}
    >
      {loadError && (
        <div className="mb-5">
          <Notice type="error">
            {loadError}{' '}
            <button type="button" className="ml-2 font-semibold underline" onClick={() => refreshData()}>
              Try again
            </button>
          </Notice>
        </div>
      )}
      {loading ? <LoadingPanel /> : page}

      <AppToast toast={toast} onAction={runToastAction} onDismiss={dismissToast} />

      <OnboardingModal
        open={onboardingOpen}
        preferences={preferences}
        onSave={savePreferences}
        onClose={() => setOnboardingOpen(false)}
        userName={session.user?.name}
      />
    </AppShell>
  );
}
