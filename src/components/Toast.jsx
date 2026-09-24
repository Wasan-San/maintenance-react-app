export default function Toast({ toast }) {
  if (!toast) return null;
  return <div className={`app-toast ${toast.type || 'success'} show`}>{toast.message}</div>;
}
