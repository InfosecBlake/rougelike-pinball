export type InputAction = "left-flipper" | "right-flipper" | "launch" | "nudge-left" | "nudge-right" | "nudge-up" | "pause";

type Listener = (action: InputAction, pressed: boolean) => void;

const KEY_MAP: Record<string, InputAction> = {
  ArrowLeft: "left-flipper",
  KeyZ: "left-flipper",
  ShiftLeft: "left-flipper",
  ArrowRight: "right-flipper",
  KeyX: "right-flipper",
  ShiftRight: "right-flipper",
  Space: "launch",
  ArrowDown: "launch",
  KeyA: "nudge-left",
  KeyD: "nudge-right",
  KeyW: "nudge-up",
  Escape: "pause",
  KeyP: "pause"
};

/** Keyboard + on-screen touch button input, unified into a single action stream. */
export class InputManager {
  private listeners: Listener[] = [];
  private held = new Set<InputAction>();

  constructor(private root: HTMLElement) {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp, { passive: false });
  }

  onAction(fn: Listener) {
    this.listeners.push(fn);
  }

  isHeld(action: InputAction) {
    return this.held.has(action);
  }

  bindTouchButton(el: HTMLElement, action: InputAction) {
    const press = (e: Event) => {
      e.preventDefault();
      this.fire(action, true);
    };
    const release = (e: Event) => {
      e.preventDefault();
      this.fire(action, false);
    };
    el.addEventListener("touchstart", press, { passive: false });
    el.addEventListener("touchend", release, { passive: false });
    el.addEventListener("touchcancel", release, { passive: false });
    el.addEventListener("mousedown", press);
    el.addEventListener("mouseup", release);
    el.addEventListener("mouseleave", release);
  }

  private fire(action: InputAction, pressed: boolean) {
    if (pressed) this.held.add(action);
    else this.held.delete(action);
    for (const l of this.listeners) l(action, pressed);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    if (["Space", "ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"].includes(e.code)) e.preventDefault();
    if (this.held.has(action)) return; // ignore key repeat
    this.fire(action, true);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    this.fire(action, false);
  };

  destroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}
