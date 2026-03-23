import { Run } from '../types';

/**
 * Downloads a Run as a JSON file to the user's machine.
 */
export const exportRun = (session: Run): void => {
  const data = JSON.stringify(session, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `run-${session.id}-${session.name.replace(/\s+/g, '_')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Generates a unique run ID using timestamp + random suffix.
 */
export const generateRunId = (): string =>
  `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/**
 * Returns the current ISO timestamp string.
 */
export const nowISO = (): string => new Date().toISOString();