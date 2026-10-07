import { useEffect, useMemo, useState } from 'react';
import Layout from './components/Layout.jsx';
import Toast from './components/Toast.jsx';
import Login from './pages/Login.jsx';
import Overview from './pages/Overview.jsx';
import NewRequest from './pages/NewRequest.jsx';
import Database from './pages/Database.jsx';
import { getSession, onAuthChange, signOut } from './services/authService.js';
import { fetchMyProfile, getPermissions } from './services/profileService.js';
import {
  createRequestRecord,
  deleteRequestRecord,
  fetchRequests,
  fetchStores,
  fetchVendors,
  updateRequestRecord
} from './services/maintenanceService.js';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const [requests, setRequests] = useState([]);
  const [stores, setStores] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [page, setPage] = useState('overview');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const permissions = useMemo(() => getPermissions(profile), [profile]);

    const showToast = (message, type = 'success', duration = 2600) => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), duration);
  };
  
  useEffect(() => {
    let active = true;

    getSession()
      .then((currentSession) => {
        if (active) setSession(currentSession);
      })
      .catch((error) => {
        console.error('Session check failed:', error);
        if (active) setAuthError(error.message || 'Unable to check session.');
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    const unsubscribe = onAuthChange((nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setRequests([]);
        setStores([]);
        setVendors([]);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    let active = true;

    const loadUserAndAppData = async () => {
      try {
        setLoading(true);
        setAuthError('');
        setLoadError('');

        const currentProfile = await fetchMyProfile(session.user.id);
        if (!active) return;
        setProfile(currentProfile);

        const [requestData, storeData, vendorData] = await Promise.all([
          fetchRequests(),
          fetchStores(),
          fetchVendors()
        ]);

        if (!active) return;
        setRequests(requestData);
        setStores(storeData);
        setVendors(vendorData);
      } catch (error) {
        console.error('Failed to load signed-in app data:', error);
        if (active) setLoadError(error.message || 'Unable to load app data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUserAndAppData();
    return () => { active = false; };
  }, [session?.user?.id]);

  const addRequest = async (request) => {
    const created = await createRequestRecord(request);
    setRequests((current) => [created, ...current]);
    setPage('database');
    return created;
  };

  const updateRequest = async (updatedRequest, pendingPhotos = []) => {
    if (!permissions.canEdit) throw new Error('Your role cannot edit requests.');

    const saved = await updateRequestRecord(updatedRequest, vendors, pendingPhotos);
    setRequests((current) => current.map((request) =>
      request.ticketId === saved.ticketId ? saved : request
    ));
    return saved;
  };

  const deleteRequest = async (ticketId) => {
    if (!permissions.canDelete) throw new Error('Your role cannot delete requests.');

    await deleteRequestRecord(ticketId);
    setRequests((current) => current.filter((request) => request.ticketId !== ticketId));
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setPage('overview');
    } catch (error) {
      showToast(error.message || 'Unable to sign out.', 'error');
    }
  };

  if (authLoading) {
    return <StateCard title="Checking session..." text="Confirming your Supabase login." />;
  }

  if (authError) {
    return <StateCard title="Authentication error" text={authError} />;
  }

  if (!session) {
    return <Login onLogin={setSession} />;
  }

  return (
    <Layout
      page={page}
      onNavigate={setPage}
      profile={profile}
      userEmail={session.user.email}
      onLogout={handleLogout}
    >
      {loading && (
        <StateCard title="Loading maintenance data..." text="Applying your account permissions and fetching the latest records." inline />
      )}

      {!loading && loadError && (
        <main className="shell">
          <section className="card app-state-card">
            <h2>Unable to load data</h2>
            <p>{loadError}</p>
            <p>Check the Week 4 Supabase setup, profile row, RLS policies, and environment variables.</p>
            <button className="btn" type="button" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </section>
        </main>
      )}

      {!loading && !loadError && requests.length === 0 && page !== 'new' && (
        <main className="shell">
          <section className="card app-state-card">
            <h2>No maintenance requests yet</h2>
            <p>Create your first request to get started.</p>
            {permissions.canCreate && (
              <button className="btn primary" type="button" onClick={() => setPage('new')}>
                Create New Request →
              </button>
            )}
          </section>
        </main>
      )}

      {!loading && !loadError && requests.length > 0 && page === 'overview' && (
        <Overview requests={requests} />
      )}

      {!loading && !loadError && page === 'new' && permissions.canCreate && (
        <NewRequest
          requests={requests}
          stores={stores}
          profile={profile}
          userEmail={session.user.email}
          onAddRequest={addRequest}
          onNavigate={setPage}
          showToast={showToast}
        />
      )}

      {!loading && !loadError && requests.length > 0 && page === 'database' && (
        <Database
          requests={requests}
          vendors={vendors}
          onUpdateRequest={updateRequest}
          onDeleteRequest={deleteRequest}
          canEdit={permissions.canEdit}
          canDelete={permissions.canDelete}
          showToast={showToast}
        />
      )}

      <Toast toast={toast} />
    </Layout>
  );
}

function StateCard({ title, text, inline = false }) {
  const content = (
    <section className="card app-state-card">
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );

  if (inline) return <main className="shell">{content}</main>;
  return <main className="login-shell">{content}</main>;
}
