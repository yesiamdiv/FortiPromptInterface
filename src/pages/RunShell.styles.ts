import { CSSProperties } from 'react';

export const NAV_H = 52;

export const styles: Record<string, CSSProperties> = {
  root:       { fontFamily: "'DM Sans',sans-serif", background: '#F7F6F3', color: '#1A1A1A', position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  nav:        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: NAV_H, background: '#fff', borderBottom: '1px solid #E8E6E0', position: 'sticky', top: 0, zIndex: 200, flexShrink: 0 },
  navL:       { display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' },
  navR:       { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  backBtn:    { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#888', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', flexShrink: 0 },
  navSep:     { width: 1, height: 14, background: '#E8E6E0', flexShrink: 0 },
  navLogo:    { fontSize: 13, fontWeight: 600, letterSpacing: '-.3px', flexShrink: 0 },
  navRunName: { fontSize: 13, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 },
  statusPill: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 12, flexShrink: 0 },
  savingChip: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888' },
  runBtn:     { display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', transition: 'opacity .15s', flexShrink: 0 },
  tabBar:     { display: 'flex', gap: 0, borderLeft: '1px solid #F0EDE6', paddingLeft: 10 },
  tabBtn:     { display: 'flex', alignItems: 'center', gap: 5, padding: '0 14px', height: NAV_H, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: 'none', borderBottom: '2px solid transparent', background: 'transparent', transition: 'all .15s', whiteSpace: 'nowrap' },
  body:       { display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 },
  panel:      { width: 280, flexShrink: 0, borderRight: '1px solid #E8E6E0', background: '#fff', overflowY: 'auto', height: '100%' },
  content:    { flex: 1, overflow: 'hidden', minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' },
};
