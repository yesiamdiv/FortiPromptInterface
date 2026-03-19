import { Run } from '../types';

export const exportRun = (session: Run) => {
  const data = JSON.stringify(session, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${session.name.replace(/\s+/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url); // Clean up the URL object
};