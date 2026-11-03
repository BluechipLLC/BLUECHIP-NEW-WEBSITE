// Canvas metaball engine: draws circular blobs and, for every pair that is
// close enough, an analytic "glue" neck — two bezier curves joining the
// circles' tangent points (the classic metaball-connector construction).
// As two blobs separate the neck stretches, thins, and snaps; as they
// approach it reforms and they fuse. Everything is plain path fills — no
// blur/contrast filter pass — so edges stay crisp and behavior is identical
// across browsers (iOS Safari can't threshold canvas alpha via filters).
//
// Blob positions/sizes are driven from outside (typically sampled from real
// DOM elements each frame, or animated directly) via setBlob(); the engine
// only owns rendering plus an optional spring so a target can be handed off
// once and let physics carry it, instead of the caller tweening every frame.
const DEFAULTS = {
    spread: 0.5,
    handleSize: 2.4,
    reach: 1.2,
    stiffness: 210,
    damping: 24,
    dpr: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
};
const clamp1 = (n) => Math.min(1, Math.max(-1, n));
const vec = (from, angle, length) => ({
    x: from.x + Math.cos(angle) * length,
    y: from.y + Math.sin(angle) * length,
});
export class MetaballEngine {
    constructor(canvas, options = {}) {
        this.blobs = new Map();
        this.targets = new Map();
        this.raf = 0;
        this.lastT = 0;
        this.width = 0;
        this.height = 0;
        this.tick = (t) => {
            const dt = Math.min((t - this.lastT) / 1000, 1 / 30);
            this.lastT = t;
            let settled = true;
            for (const [id, blob] of this.blobs) {
                const target = this.targets.get(id);
                if (!target)
                    continue;
                const sx = this.spring(blob, 'x', 'vx', target.x, dt);
                const sy = this.spring(blob, 'y', 'vy', target.y, dt);
                const sr = this.spring(blob, 'r', 'vr', target.r, dt);
                settled = settled && sx && sy && sr;
                blob.color = target.color;
                if (blob.removing && blob.r < 0.5 && Math.abs(blob.vr) < 0.5) {
                    this.blobs.delete(id);
                    this.targets.delete(id);
                }
            }
            this.renderFrame();
            if (!settled) {
                this.raf = requestAnimationFrame(this.tick);
            }
            else {
                this.raf = 0;
            }
        };
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('MetaballEngine: 2d context unavailable');
        this.ctx = ctx;
        this.opts = { ...DEFAULTS, ...options };
    }
    configure(options) {
        for (const key of Object.keys(options)) {
            const value = options[key];
            if (value !== undefined)
                this.opts[key] = value;
        }
    }
    resize(width, height) {
        this.width = width;
        this.height = height;
        const dpr = this.opts.dpr;
        this.canvas.width = Math.max(1, Math.round(width * dpr));
        this.canvas.height = Math.max(1, Math.round(height * dpr));
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.renderFrame();
    }
    /** Set (or move) a blob toward a target. New blobs grow in from r:0. */
    setBlob(id, target, opts = {}) {
        let blob = this.blobs.get(id);
        if (!blob) {
            blob = { id, x: target.x, y: target.y, r: 0, color: target.color, vx: 0, vy: 0, vr: 0, removing: false };
            this.blobs.set(id, blob);
        }
        blob.removing = false;
        this.targets.set(id, target);
        if (opts.instant) {
            blob.x = target.x;
            blob.y = target.y;
            blob.r = target.r;
            blob.color = target.color;
            blob.vx = blob.vy = blob.vr = 0;
        }
        this.wake();
    }
    /** Shrink a blob to nothing then drop it — or delete it this frame. */
    remove(id, opts = {}) {
        const blob = this.blobs.get(id);
        if (!blob)
            return;
        if (opts.instant) {
            this.blobs.delete(id);
            this.targets.delete(id);
            this.wake();
            return;
        }
        blob.removing = true;
        this.targets.set(id, { x: blob.x, y: blob.y, r: 0, color: blob.color });
        this.wake();
    }
    /** Remove any tracked blob whose id isn't in `activeIds`. */
    reconcile(activeIds) {
        const active = new Set(activeIds);
        for (const id of this.blobs.keys()) {
            if (!active.has(id))
                this.remove(id);
        }
    }
    /**
     * Drop every blob and repaint, leaving the canvas empty.
     *
     * The engine parks its own rAF as soon as the springs settle and leaves the
     * last frame painted, so a caller that walks away mid-animation strands
     * whatever was on screen. `clear()` is how a caller says "this animation is
     * over"; the next `setBlob` brings the shape back from scratch.
     */
    clear() {
        if (this.raf)
            cancelAnimationFrame(this.raf);
        this.raf = 0;
        this.blobs.clear();
        this.targets.clear();
        this.renderFrame();
    }
    destroy() {
        this.clear();
    }
    wake() {
        if (this.raf)
            return;
        this.lastT = performance.now();
        this.raf = requestAnimationFrame(this.tick);
    }
    spring(blob, axis, vAxis, target, dt) {
        const { stiffness: k, damping: c } = this.opts;
        const pos = blob[axis];
        const vel = blob[vAxis];
        const accel = -k * (pos - target) - c * vel;
        const newVel = vel + accel * dt;
        const newPos = pos + newVel * dt;
        blob[axis] = newPos;
        blob[vAxis] = newVel;
        return Math.abs(newPos - target) < 0.05 && Math.abs(newVel) < 0.05;
    }
    renderFrame() {
        const { ctx } = this;
        const dpr = this.opts.dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, this.width, this.height);
        const visible = [];
        for (const blob of this.blobs.values()) {
            if (blob.r > 0.5)
                visible.push(blob);
        }
        for (const blob of visible) {
            ctx.beginPath();
            ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
            ctx.fillStyle = this.resolveColor(blob.color, blob.x, blob.y, blob.r);
            ctx.fill();
        }
        for (let i = 0; i < visible.length; i++) {
            for (let j = i + 1; j < visible.length; j++) {
                this.drawNeck(visible[i], visible[j]);
            }
        }
    }
    /** The glue between two circles: bezier curves joining their tangent
        points, thinning with distance until it snaps at `reach`. */
    drawNeck(b1, b2) {
        const { spread, handleSize, reach } = this.opts;
        const r1 = b1.r;
        const r2 = b2.r;
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const d = Math.hypot(dx, dy);
        const total = r1 + r2;
        const maxDistance = total * reach;
        if (d === 0 || d >= maxDistance)
            return;
        if (d <= Math.abs(r1 - r2))
            return;
        // Once the circles stop touching, taper the attachment width smoothly
        // to zero. This makes the liquid thread thin away instead of popping at
        // the reach boundary.
        const stretchRange = Math.max(maxDistance - total, 0.001);
        const remaining = Math.min(1, Math.max(0, (maxDistance - d) / stretchRange));
        const taper = remaining * remaining * (3 - 2 * remaining);
        const v = spread * taper;
        let u1 = 0;
        let u2 = 0;
        if (d < total) {
            u1 = Math.acos(clamp1((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d)));
            u2 = Math.acos(clamp1((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d)));
        }
        const angle = Math.atan2(dy, dx);
        const maxSpread = Math.acos(clamp1((r1 - r2) / d));
        const a1 = angle + u1 + (maxSpread - u1) * v;
        const a2 = angle - u1 - (maxSpread - u1) * v;
        const a3 = angle + Math.PI - u2 - (Math.PI - u2 - maxSpread) * v;
        const a4 = angle - Math.PI + u2 + (Math.PI - u2 - maxSpread) * v;
        const p1 = vec(b1, a1, r1);
        const p2 = vec(b1, a2, r1);
        const p3 = vec(b2, a3, r2);
        const p4 = vec(b2, a4, r2);
        const rate = Math.min(v * handleSize, Math.hypot(p3.x - p1.x, p3.y - p1.y) / total) *
            Math.min(1, (d * 2) / total);
        const hr1 = r1 * rate;
        const hr2 = r2 * rate;
        const h1 = vec(p1, a1 - Math.PI / 2, hr1);
        const h2 = vec(p2, a2 + Math.PI / 2, hr1);
        const h3 = vec(p3, a3 + Math.PI / 2, hr2);
        const h4 = vec(p4, a4 - Math.PI / 2, hr2);
        const { ctx } = this;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.bezierCurveTo(h1.x, h1.y, h3.x, h3.y, p3.x, p3.y);
        ctx.lineTo(p4.x, p4.y);
        ctx.bezierCurveTo(h4.x, h4.y, h2.x, h2.y, p2.x, p2.y);
        ctx.closePath();
        ctx.fillStyle = this.resolveColor(r1 >= r2 ? b1.color : b2.color, (b1.x + b2.x) / 2, (b1.y + b2.y) / 2, Math.max(r1, r2));
        ctx.fill();
    }
    resolveColor(color, x, y, r) {
        if (typeof color === 'string')
            return color;
        const angle = (color.angle ?? 135) * (Math.PI / 180);
        const dx = Math.cos(angle) * r;
        const dy = Math.sin(angle) * r;
        const gradient = this.ctx.createLinearGradient(x - dx, y - dy, x + dx, y + dy);
        for (const stop of color.stops)
            gradient.addColorStop(stop.offset, stop.color);
        return gradient;
    }
}
