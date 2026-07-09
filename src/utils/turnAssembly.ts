import { RawTurnRecord, ChatTurn } from '../types';

/**
 * Assembles a flat ChatTurn display list from raw backend turn records.
 * Each RawTurnRecord may produce 1–3 ChatTurns (attack, defence, evaluation).
 *
 * ⚠ Rendering rule for attacker turns:
 *   content = raw.attack_data.metadata?.user_input ?? raw.attack_data.prompt
 *   NEVER render raw.attack_data.prompt directly — it is the full LLM context,
 *   not the clean user message.
 */
export function assembleChatTurns(rawTurns: RawTurnRecord[]): ChatTurn[] {
  const assembled: ChatTurn[] = [];

  for (const raw of rawTurns) {
    if (raw.attack_data) {
      assembled.push({
        turn_id:   `atk-${raw.turn_id}`,
        role:      'attacker',
        // Prefer user_input from metadata — prompt is full LLM context
        content:   raw.attack_data.metadata?.user_input ?? raw.attack_data.prompt,
        timestamp: raw.attack_data.timestamp,
        metadata:  raw.attack_data.metadata ?? {},
      });
    }

    if (raw.defence_data) {
      assembled.push({
        turn_id:   `def-${raw.turn_id}`,
        role:      'defense',
        content:   raw.defence_data.response,
        timestamp: raw.defence_data.timestamp,
        metadata:  {
          was_blocked: raw.defence_data.was_blocked,
          status_code: raw.defence_data.status_code,
          ...raw.defence_data.metadata,
        },
      });
    }

    if (raw.evaluation_data) {
      assembled.push({
        turn_id:   `eval-${raw.turn_id}`,
        role:      'evaluation',
        content:   raw.evaluation_data.feedback,
        timestamp: raw.evaluation_data.timestamp,
        metadata:  {
          score:    raw.evaluation_data.score,
          success:  raw.evaluation_data.success,
          category: raw.evaluation_data.category,
          ...raw.evaluation_data.metadata,
        },
      });
    }
  }

  return assembled;
}
