import { fly } from "svelte/transition";
import { cubicOut } from "svelte/easing";

const reducedMotion = () =>
	typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// Duration for an animation, or 0 when the user asks for reduced motion
export const motionMs = (ms) => (reducedMotion() ? 0 : ms);

// Slides by x/y while fading; just fades when the user asks for reduced motion
export function slideFade(node, { x = 0, y = 0, duration = 200, delay = 0 } = {}) {
	const still = reducedMotion();
	return fly(node, { x: still ? 0 : x, y: still ? 0 : y, duration, delay, easing: cubicOut });
}
