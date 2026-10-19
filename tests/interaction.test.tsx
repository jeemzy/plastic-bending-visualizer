import { Window } from "happy-dom";
import { it } from "node:test";
import assert from "node:assert/strict";
import { act } from "react";

it("controls coordinate guided stages, irreversible history, recovery, pause, replay and the fallback", async () => {
  const window = new Window({
    url: "http://localhost/plastic-bending-visualizer/",
  });
  const globals = globalThis as unknown as Record<string, unknown>;
  for (const key of [
    "window",
    "document",
    "navigator",
    "HTMLElement",
    "HTMLCanvasElement",
    "HTMLInputElement",
    "Event",
    "MouseEvent",
    "PointerEvent",
    "ResizeObserver",
    "HTMLDialogElement",
  ]) {
    Object.defineProperty(globals, key, {
      value: (window as unknown as Record<string, unknown>)[key] ?? window,
      writable: true,
      configurable: true,
    });
  }
  globals.IS_REACT_ACT_ENVIRONMENT = true;
  const frames = new Map<number, FrameRequestCallback>();
  let frameId = 0,
    clock = 1;
  globals.requestAnimationFrame = (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  };
  globals.cancelAnimationFrame = (id: number) => frames.delete(id);
  // WebGL absence is an explicitly supported public environment.
  window.HTMLCanvasElement.prototype.getContext = () => null;
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (!String(args[0]).includes("Error creating WebGL context"))
      originalError(...args);
  };
  const { createRoot } = await import("react-dom/client");
  const { default: App } = await import("../src/App");
  const mount = window.document.createElement("div");
  window.document.body.appendChild(mount);
  // The virtual DOM intentionally implements a subset of browser Element APIs.
  const root = createRoot(mount as unknown as HTMLElement);
  const button = (label: string) => {
    const b = Array.from(mount.querySelectorAll("button")).find(
      (b) =>
        b.getAttribute("aria-label") === label ||
        b.textContent?.includes(label),
    );
    assert.ok(b, `button exists: ${label}`);
    return b;
  };
  const click = async (label: string) => act(() => button(label).click());
  const tick = async (seconds: number) =>
    act(() => {
      for (let i = 0; i < seconds * 60; i++) {
        clock += 1000 / 60;
        const callbacks = Array.from(frames.values());
        frames.clear();
        callbacks.forEach((cb) => cb(clock));
      }
    });
  try {
    await act(() => root.render(<App />));
    assert.match(mount.textContent || "", /2D accessible view/);
    await click("Before the bend");
    await tick(1);
    assert.match(mount.textContent || "", /Undeformed/);
    await click("Under stress");
    await tick(2);
    assert.equal(button("Strain").getAttribute("aria-pressed"), "true");
    await click("Turning white");
    await tick(3);
    assert.match(mount.textContent || "", /Whitening retained/);
    assert.ok(mount.querySelectorAll("[data-cavity]").length > 0);
    await click("Release bend");
    await tick(4);
    assert.match(mount.textContent || "", /Whitening retained/);
    await click("Reset to fresh specimen");
    await tick(0.2);
    assert.match(mount.textContent || "", /Undeformed/);
    assert.equal(mount.querySelectorAll("[data-cavity]").length, 0);
    const select = mount.querySelector(
      "#material",
    ) as unknown as HTMLSelectElement;
    await act(() => {
      select.value = "tpe";
      select.dispatchEvent(
        new window.Event("change", { bubbles: true }) as unknown as Event,
      );
    });
    await click("Turning white");
    await tick(3);
    assert.equal(mount.querySelectorAll("[data-cavity]").length, 0);
    assert.doesNotMatch(mount.textContent || "", /Whitening retained/);
    await click("Release bend");
    await tick(3);
    assert.match(mount.textContent || "", /Undeformed/);
    await click("Feeling the heat");
    await tick(3);
    assert.equal(button("Thermal").getAttribute("aria-pressed"), "true");
    assert.match(mount.textContent || "", /Warming|Warm/);
    const beam = mount.querySelector(".fallback svg")?.outerHTML;
    await click("Pause simulation");
    await tick(5);
    assert.equal(mount.querySelector(".fallback svg")?.outerHTML, beam);
    await click("Resume simulation");
    await tick(5);
    assert.notEqual(mount.querySelector(".fallback svg")?.outerHTML, beam);
    await click("Light on");
    assert.equal(mount.querySelectorAll("[data-light]").length, 0);
    await click("Quarter speed slow motion");
    assert.equal(
      button("Quarter speed slow motion").getAttribute("aria-pressed"),
      "true",
    );
    await click("Replay bending cycle");
    await tick(35);
    assert.ok(
      Number(
        (mount.querySelector("#bend") as unknown as HTMLInputElement).value,
      ) > 90,
    );
  } finally {
    await act(() => root.unmount());
    console.error = originalError;
    await window.happyDOM.close();
  }
});
