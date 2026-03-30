export type ToastType = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  type: ToastType;
  message: string;
};

const items = $state<ToastItem[]>([]);

function push(type: ToastType, message: string) {
  const id = crypto.randomUUID();
  items.push({ id, type, message });
  setTimeout(() => dismiss(id), type === "error" ? 5000 : 3000);
}

function dismiss(id: string) {
  const i = items.findIndex((t) => t.id === id);
  if (i !== -1) items.splice(i, 1);
}

export const toast = {
  get items() {
    return items;
  },
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
  info: (message: string) => push("info", message),
  dismiss,
};
