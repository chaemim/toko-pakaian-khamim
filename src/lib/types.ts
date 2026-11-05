export type ActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
};

export const EMPTY_ACTION_STATE: ActionState = {};

export function firstError(
  state: ActionState,
  field: string,
): string | undefined {
  return state.fieldErrors?.[field];
}
