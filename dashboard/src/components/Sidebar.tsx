import {NavLink, useNavigate} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';

const NAV = [
  {to: '/overview', label: 'Overview', icon: '◈'},
  {to: '/patients', label: 'Patients', icon: '◉'},
  {to: '/admins', label: 'Admins', icon: '◆'},
];

const linkStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 14px',
  borderRadius: 8,
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  background: active ? 'var(--bg-hover)' : 'transparent',
  fontWeight: active ? 600 : 400,
  fontSize: 14,
  transition: 'background 0.15s, color 0.15s',
});

export default function Sidebar() {
  const navigate = useNavigate();
  const {logout} = useAuth();

  function handleLogout() {
    logout();
    navigate('/login', {replace: true});
  }

  return (
    <aside
      style={{
        width: 220,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 12px',
        gap: 4,
        flexShrink: 0,
      }}>
      {/* Logo */}
      <div style={{padding: '0 14px 24px'}}>
        <span style={{fontSize: 18, fontWeight: 800, color: 'var(--text-primary)'}}>
          Med
        </span>
        <span style={{fontSize: 18, fontWeight: 800, color: 'var(--blue)'}}>Lens</span>
        <div style={{fontSize: 11, color: 'var(--text-muted)', marginTop: 2}}>
          Clinical Dashboard
        </div>
      </div>

      {/* Navigation */}
      {NAV.map(({to, label, icon}) => (
        <NavLink key={to} to={to} style={({isActive}) => linkStyle(isActive)}>
          <span style={{fontSize: 16}}>{icon}</span>
          {label}
        </NavLink>
      ))}

      {/* Footer */}
      <div
        style={{
          marginTop: 'auto',
          padding: '14px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            borderRadius: 8,
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: 13,
            cursor: 'pointer',
            width: '100%',
            transition: 'background 0.15s, color 0.15s',
          }}>
          <span style={{fontSize: 14}}>⎋</span>
          Sign out
        </button>
        <span style={{color: 'var(--text-muted)', fontSize: 11}}>v0.1.0</span>
      </div>
    </aside>
  );
}
