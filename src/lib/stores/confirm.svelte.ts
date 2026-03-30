export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
};

const state = $state({
  open: false,
  title: "",
  message: "",
  confirmLabel: "Confirm",
  danger: false,
  _resolve: null as ((v: boolean) => void) | null,
});

export function confirm(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    state.open = true;
    state.title = opts.title ?? "";
    state.message = opts.message;
    state.confirmLabel = opts.confirmLabel ?? "Confirm";
    state.danger = opts.danger ?? false;
    state._resolve = resolve;
  });
}

export function answerConfirm(value: boolean) {
  state.open = false;
  state._resolve?.(value);
  state._resolve = null;
}

export { state as confirmState };
