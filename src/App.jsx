import { useState } from 'react';
import Layout from './components/Layout.jsx';
import Toast from './components/Toast.jsx';
import Overview from './pages/Overview.jsx';
import NewRequest from './pages/NewRequest.jsx';
import Database from './pages/Database.jsx';
import { loadInitialRequests, saveRequests } from './utils.js';

export default function App() {
  // MAIN STATE: requests belongs here because Overview, New Request and Database all need it.
  const [requests, setRequests] = useState(loadInitialRequests);
  const [page, setPage] = useState('overview');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 2600);
  };

  const addRequest = (request) => {
    const nextRequests = [request, ...requests];
    setRequests(nextRequests);
    saveRequests(nextRequests);
    setPage('database');
  };

  const updateRequest = (updatedRequest) => {
    const nextRequests = requests.map(request =>
      request.workCode === updatedRequest.workCode ? updatedRequest : request
    );
    setRequests(nextRequests);
    saveRequests(nextRequests);
  };

  return (
    <Layout page={page} onNavigate={setPage}>
      {page === 'overview' && <Overview requests={requests} />}
      {page === 'new' && <NewRequest requests={requests} onAddRequest={addRequest} onNavigate={setPage} showToast={showToast} />}
      {page === 'database' && <Database requests={requests} onUpdateRequest={updateRequest} showToast={showToast} />}
      <Toast toast={toast} />
    </Layout>
  );
}
