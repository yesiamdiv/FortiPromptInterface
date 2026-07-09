import { CSSProperties } from 'react';

export const styles: Record<string, CSSProperties> = {
  root:        { display: 'flex', flexDirection: 'column', gap: 0, background: '#fff' },
  empty:       { padding: 24, fontSize: 13, color: '#BBB', textAlign: 'center' },
  loadingBox:  { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 20px', flexDirection: 'column' },

  runInfo:     { padding: '20px 20px 16px', borderBottom: '1px solid #F0EDE6' },
  runName:     { fontSize: 14, fontWeight: 600, letterSpacing: '-.3px', color: '#1A1A1A', marginBottom: 3 },
  runDesc:     { fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 2 },
  runMeta:     { fontSize: 10, color: '#CCC', marginTop: 6, fontFamily: "'DM Mono', monospace" },
  pill:        { fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 12, display: 'inline-block' },

  section:     { borderBottom: '1px solid #F0EDE6' },
  sectionBtn:  { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', gap: 8 },
  sectionTitle:{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', letterSpacing: '-.2px' },
  sectionSub:  { fontSize: 10, color: '#AAA', marginTop: 1, fontFamily: "'DM Mono', monospace" },
  sectionBody: { padding: '0 20px 16px' },

  nodeDesc:    { fontSize: 11, color: '#888', lineHeight: 1.5, marginBottom: 12, padding: '8px 10px', background: '#F7F6F3', borderRadius: 6 },
  readOnlyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', marginBottom: 2 },
  roKey:       { fontSize: 10, color: '#BBB', textTransform: 'uppercase', letterSpacing: '.3px', fontWeight: 500 },
  roVal:       { fontSize: 11, color: '#555', fontFamily: "'DM Mono', monospace", fontWeight: 500 },
  divider:     { height: 1, background: '#F0EDE6', margin: '10px 0' },
  noParams:    { fontSize: 11, color: '#CCC', textAlign: 'center', padding: '8px 0' },

  fieldRow:    { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLbl:    { fontSize: 10, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '.4px' },
  inp:         { height: 32, background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 6, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', color: '#1A1A1A', outline: 'none', width: '100%', boxSizing: 'border-box' },
  sel:         { height: 32, background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 6, padding: '0 28px 0 10px', fontSize: 12, fontFamily: 'inherit', color: '#1A1A1A', outline: 'none', width: '100%', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.3' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', cursor: 'pointer', boxSizing: 'border-box' },
  hint:        { fontSize: 10, color: '#CCC', lineHeight: 1.4 },
  toggleWrap:  { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  toggleSlider:{ position: 'relative', width: 30, height: 16, borderRadius: 8, transition: 'background .2s', display: 'inline-block', flexShrink: 0 },
  toggleDot:   { position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: '#fff', left: 3, top: 3, transition: 'transform .2s' },
};
