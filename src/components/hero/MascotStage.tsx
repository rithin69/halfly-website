"use client";

// Hero 3D scene: Halfy (half pink, half white) is the router. Requests drop in as white pills; Halfy catches each,
// reads it (it turns pink = easy or berry = hard) and throws it into the cheap or the strong model's bucket.
// Some are already known: they pop on the spot (a cache hit) and Halfy hops. All procedural, no asset files.

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const C = {
  pink: new THREE.Color("#ff5fa2"),
  berry: new THREE.Color("#8d1550"),
  white: new THREE.Color("#ffffff"),
  blush: new THREE.Color("#ffc2dd"),
};

const BINS = {
  cheap: new THREE.Vector3(-2.75, -0.62, 0.35),
  strong: new THREE.Vector3(2.75, -0.62, 0.35),
};
const CATCH = new THREE.Vector3(0, -0.5, 1.18); // held at chest height, below the smile

type Route = "cheap" | "strong" | "cache";
type Phase = "wait" | "fall" | "hold" | "throw" | "pop" | "sink";
type Pill = { phase: Phase; t: number; wait: number; route: Route; from: THREE.Vector3; spin: number };

const N = 8;
const STAGGER = 0.62; // seconds between catches
const DUR = { fall: 0.95, hold: 0.38, throw: 0.8, pop: 0.45, sink: 0.28 };
const CYCLE = DUR.fall + DUR.hold + DUR.throw + DUR.sink;

function pickRoute(r: number): Route {
  return r < 0.6 ? "cheap" : r < 0.9 ? "strong" : "cache";
}

const ease = {
  inQuad: (t: number) => t * t,
  outBack: (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2,
  inOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
};

// Shared signal from the pills to Halfy (one scene per page, so module scope is fine).
const signal = {
  gaze: new THREE.Vector3(0, 0.5, 4),
  focusUntil: 0,
  squashAt: -10,
  hopAt: -10,
  turn: 0, // -1 cheap side, +1 strong side
  turnUntil: 0,
  tapped: false, // set by a click/tap on the stage, consumed by Halfy's frame loop
};

/** Send a pill back to the queue so that, across all pills, one is caught roughly every STAGGER seconds. */
function finish(p: Pill, s: { rand: () => number }) {
  p.phase = "wait";
  p.t = 0;
  const used = DUR.fall + DUR.hold + (p.route === "cache" ? DUR.pop : DUR.throw + DUR.sink);
  p.wait = Math.max(0.05, N * STAGGER - used + (s.rand() - 0.5) * 0.25);
}

function Pills({ rate }: { rate: number }) {
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const sim = useRef<{ pills: Pill[]; rand: () => number; clock: number } | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }, raw) => {
    const now = clock.elapsedTime;
    if (!sim.current) {
      const rand = mulberry32(11);
      sim.current = {
        rand,
        clock: 0,
        pills: Array.from({ length: N }, (_, i) => ({
          phase: "wait" as Phase,
          t: 0,
          wait: 0.4 + i * STAGGER,
          route: "cheap" as Route,
          from: new THREE.Vector3(),
          spin: 0,
        })),
      };
    }
    const s = sim.current;
    const dt = Math.min(raw, 0.1) * rate;
    s.clock += dt;

    s.pills.forEach((p, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      p.t += dt;

      if (p.phase === "wait") {
        mesh.visible = false;
        if (p.t >= p.wait) {
          p.phase = "fall";
          p.t = 0;
          p.from.set((s.rand() - 0.5) * 1.6, 3.9, 0.6 + s.rand() * 0.4);
          p.spin = (s.rand() - 0.5) * 6;
          mat.color.copy(C.white);
          mat.opacity = 1;
        }
        return;
      }
      mesh.visible = true;

      if (p.phase === "fall") {
        const k = Math.min(p.t / DUR.fall, 1);
        mesh.position.lerpVectors(p.from, CATCH, ease.inQuad(k));
        mesh.rotation.z += p.spin * dt;
        mesh.scale.setScalar(0.4 + 0.6 * Math.min(k * 3, 1));
        if (k >= 1) {
          p.phase = "hold";
          p.t = 0;
          p.route = pickRoute(s.rand());
          signal.squashAt = now;
          signal.focusUntil = now + DUR.hold + 0.2;
        }
      } else if (p.phase === "hold") {
        const k = Math.min(p.t / DUR.hold, 1);
        mesh.position.copy(CATCH);
        mesh.position.y += Math.sin(k * Math.PI) * 0.08;
        mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, Math.PI / 2, 0.2);
        // Halfy decides: the pill takes the colour of its destination.
        const target = p.route === "cheap" ? C.pink : p.route === "strong" ? C.berry : C.blush;
        mat.color.copy(C.white).lerp(target, ease.inOut(k));
        signal.gaze.copy(CATCH);
        if (k >= 1) {
          p.t = 0;
          if (p.route === "cache") {
            p.phase = "pop";
            signal.hopAt = now;
          } else {
            p.phase = "throw";
            signal.turn = p.route === "cheap" ? -1 : 1;
            signal.turnUntil = now + DUR.throw * 0.8;
          }
        }
      } else if (p.phase === "throw") {
        const k = Math.min(p.t / DUR.throw, 1);
        const bin = BINS[p.route as "cheap" | "strong"];
        tmp.set(bin.x, bin.y + 0.62, bin.z);
        mesh.position.lerpVectors(CATCH, tmp, k);
        mesh.position.y += Math.sin(k * Math.PI) * 1.35;
        mesh.rotation.z += (p.route === "cheap" ? 1 : -1) * 7 * dt;
        signal.gaze.copy(mesh.position);
        if (k >= 1) {
          p.phase = "sink";
          p.t = 0;
        }
      } else if (p.phase === "pop") {
        const k = Math.min(p.t / DUR.pop, 1);
        mesh.position.copy(CATCH);
        mesh.position.y += k * 0.5;
        mesh.scale.setScalar(1 + k * 0.9);
        mat.opacity = 1 - k;
        if (k >= 1) finish(p, s);
      } else if (p.phase === "sink") {
        const k = Math.min(p.t / DUR.sink, 1);
        const bin = BINS[p.route as "cheap" | "strong"];
        mesh.position.set(bin.x, bin.y + 0.62 - k * 0.5, bin.z);
        mesh.scale.setScalar(1 - k * 0.7);
        if (k >= 1) finish(p, s);
      }
    });
  });

  return (
    <>
      {Array.from({ length: N }, (_, i) => (
        <mesh key={i} ref={(m) => { meshes.current[i] = m; }} visible={false} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.13, 0.26, 8, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} transparent />
        </mesh>
      ))}
    </>
  );
}

/** Halfy in 3D: two hemispheres, a seam ring, glossy eyes, cheeks, a smile and two feet. */
function Halfy({ follow, calm }: { follow: boolean; calm: boolean }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Group>(null);
  const eyeR = useRef<THREE.Group>(null);
  const blink = useRef({ next: 2.2, end: 0 });
  const party = useRef(-10); // time of the last tap
  const look = useMemo(() => new THREE.Vector3(), []);

  const smile = useMemo(
    () => new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.13, -0.16, 0.985), new THREE.Vector3(0, -0.27, 1.02), new THREE.Vector3(0.13, -0.16, 0.985)), 24, 0.026, 8, false),
    [],
  );

  useFrame(({ pointer, clock }) => {
    const t = clock.elapsedTime;
    if (signal.tapped) {
      signal.tapped = false;
      party.current = t;
      signal.hopAt = t;
    }
    const r = root.current;
    const b = body.current;
    const e = eyes.current;
    if (!r || !b || !e) return;

    // Where to look: the pill being handled, else the visitor's pointer.
    const busy = t < signal.focusUntil + 0.6 || t < signal.turnUntil;
    if (busy) look.copy(signal.gaze);
    else if (follow) look.set(pointer.x * 4, pointer.y * 2.5 + 0.5, 4);
    else look.set(0, 0.4, 4);

    const yaw = THREE.MathUtils.clamp(look.x * 0.12, -0.45, 0.45) + (t < signal.turnUntil ? signal.turn * 0.35 : 0);
    const pitch = THREE.MathUtils.clamp(-(look.y - 0.3) * 0.1, -0.25, 0.3);
    // A tap makes Halfy spin once (eased); otherwise ease towards where he is looking.
    const sp = (t - party.current) / 0.75;
    if (sp >= 0 && sp < 1) b.rotation.y = yaw + (1 - (1 - sp) ** 3) * Math.PI * 2;
    else b.rotation.y = THREE.MathUtils.lerp(b.rotation.y % (Math.PI * 2), yaw, 0.12);
    b.rotation.x = THREE.MathUtils.lerp(b.rotation.x, pitch, 0.12);
    e.position.x = THREE.MathUtils.lerp(e.position.x, THREE.MathUtils.clamp(look.x * 0.02, -0.05, 0.05), 0.2);
    e.position.y = THREE.MathUtils.lerp(e.position.y, THREE.MathUtils.clamp((look.y - 0.3) * 0.025, -0.04, 0.05), 0.2);

    // Squash on catch, hop on a cache hit, gentle idle bob.
    const sq = Math.max(0, 1 - (t - signal.squashAt) / 0.28);
    const hop = t - signal.hopAt < 0.5 ? Math.sin(((t - signal.hopAt) / 0.5) * Math.PI) : 0;
    const bob = calm ? 0 : Math.sin(t * 2.1) * 0.035;
    b.position.y = bob + hop * 0.32;
    b.scale.set(1 + sq * 0.07, 1 - sq * 0.1, 1 + sq * 0.07);

    // Blink every 2.5 to 4.5 seconds, each eye around its own centre.
    const bl = blink.current;
    if (t > bl.next) {
      bl.end = t + 0.13;
      bl.next = t + 2.5 + Math.random() * 2;
    }
    const happy = t - party.current < 0.9;
    const ey = t < bl.end ? 0.12 : happy ? 0.35 : 1;
    for (const eye of [eyeL.current, eyeR.current]) if (eye) eye.scale.y = THREE.MathUtils.lerp(eye.scale.y, ey, 0.55);
  });

  const vinyl = { roughness: 0.38, clearcoat: 0.9, clearcoatRoughness: 0.25, sheen: 0.6 } as const;

  return (
    <group ref={root}>
      {/* feet stay on the ground while the body bobs */}
      {[-0.34, 0.34].map((x) => (
        <mesh key={x} position={[x, -1.02, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.15, 0.2, 8, 16]} />
          <meshStandardMaterial color="#2b0f22" roughness={0.45} />
        </mesh>
      ))}
      <group ref={body}>
        {/* left half: pink (phi from -90 to +90 degrees covers x < 0) */}
        <mesh>
          <sphereGeometry args={[1, 96, 64, -Math.PI / 2, Math.PI]} />
          <meshPhysicalMaterial color="#ff5fa2" sheenColor="#ffd6e8" {...vinyl} side={THREE.DoubleSide} />
        </mesh>
        {/* right half: white */}
        <mesh>
          <sphereGeometry args={[1, 96, 64, Math.PI / 2, Math.PI]} />
          <meshPhysicalMaterial color="#fffafc" sheenColor="#ffe3ef" {...vinyl} side={THREE.DoubleSide} />
        </mesh>
        {/* seam */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[1.003, 0.022, 12, 128]} />
          <meshStandardMaterial color="#2b0f22" roughness={0.5} />
        </mesh>
        {/* cheeks */}
        <mesh position={[-0.6, -0.13, 0.79]} rotation={[0, -0.65, 0]} scale={[1, 0.62, 0.25]}>
          <sphereGeometry args={[0.13, 24, 16]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.5} roughness={0.6} />
        </mesh>
        <mesh position={[0.6, -0.13, 0.79]} rotation={[0, 0.65, 0]} scale={[1, 0.62, 0.25]}>
          <sphereGeometry args={[0.13, 24, 16]} />
          <meshStandardMaterial color="#ff94c2" roughness={0.6} />
        </mesh>
        {/* eyes: one on each half */}
        <group ref={eyes}>
          {[-0.31, 0.31].map((x) => (
            <group key={x} ref={x < 0 ? eyeL : eyeR} position={[x, 0.13, 0.93]} rotation={[0, x * 0.9, 0]}>
              <mesh scale={[1, 1.28, 0.55]}>
                <sphereGeometry args={[0.115, 32, 24]} />
                <meshPhysicalMaterial color="#1a0814" roughness={0.12} clearcoat={1} />
              </mesh>
              <mesh position={[0.035, 0.055, 0.06]}>
                <sphereGeometry args={[0.032, 16, 12]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          ))}
        </group>
        <mesh geometry={smile}>
          <meshStandardMaterial color="#2b0f22" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/** An open bucket (lathe profile) for each model. */
function Bucket({ position, tint, rim }: { position: THREE.Vector3; tint: string; rim: string }) {
  const geo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, 0),
      new THREE.Vector2(0.46, 0),
      new THREE.Vector2(0.52, 0.06),
      new THREE.Vector2(0.62, 0.72),
      new THREE.Vector2(0.58, 0.72),
      new THREE.Vector2(0.48, 0.1),
      new THREE.Vector2(0.0, 0.1),
    ];
    return new THREE.LatheGeometry(pts, 72);
  }, []);
  return (
    <group position={position.toArray()}>
      <mesh geometry={geo} position={[0, -0.36, 0]}>
        <meshPhysicalMaterial color={tint} roughness={0.35} clearcoat={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.035, 12, 72]} />
        <meshStandardMaterial color={rim} roughness={0.4} />
      </mesh>
    </group>
  );
}

const LABELS = [
  { text: "cheap model · $", short: "cheap · $", tone: "pink", anchor: new THREE.Vector3(BINS.cheap.x, BINS.cheap.y - 0.72, BINS.cheap.z + 0.4) },
  { text: "strong model · $$$$", short: "strong · $$$$", tone: "ink", anchor: new THREE.Vector3(BINS.strong.x, BINS.strong.y - 0.72, BINS.strong.z + 0.4) },
  { text: "your app's requests", short: "requests", tone: "soft", anchor: new THREE.Vector3(0, 2.15, 0.6) },
] as const;

const projected = new THREE.Vector3();

function Rig({ labels, follow, calm, rate }: { labels: React.RefObject<(HTMLSpanElement | null)[]>; follow: boolean; calm: boolean; rate: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame(({ viewport, camera, size }) => {
    const g = group.current;
    if (!g) return;
    // Fit the whole stage (about 7.4 units wide) on any screen.
    const s = THREE.MathUtils.clamp(viewport.width / 7.6, 0.42, 1);
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, s, 0.15));
    g.updateMatrixWorld();
    const nodes = labels.current;
    if (!nodes) return;
    LABELS.forEach((l, i) => {
      const el = nodes[i];
      if (!el) return;
      projected.copy(l.anchor).applyMatrix4(g.matrixWorld).project(camera);
      const half = el.offsetWidth / 2 + 10;
      const x = THREE.MathUtils.clamp((projected.x * 0.5 + 0.5) * size.width, half, size.width - half);
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.opacity = "1";
    });
  });
  return (
    <group ref={group}>
      <Halfy follow={follow} calm={calm} />
      <Pills rate={rate} />
      <Bucket position={BINS.cheap} tint="#ff7fb5" rim="#e8338a" />
      <Bucket position={BINS.strong} tint="#fff6fa" rim="#2b0f22" />
    </group>
  );
}

export default function MascotStage() {
  const wrap = useRef<HTMLDivElement>(null);
  const labelEls = useRef<(HTMLSpanElement | null)[]>([]);
  const [visible, setVisible] = useState(true);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true }}
        onPointerDown={() => {
          signal.tapped = true;
        }}
        className="cursor-pointer"
        camera={{ position: [0, 0.9, 9], fov: 30 }}
        onCreated={({ camera }) => camera.lookAt(0, 0.35, 0)}
        aria-hidden="true"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 6]} intensity={1.3} />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2.4} position={[0, 4, 3]} scale={[10, 3, 1]} />
          <Lightformer form="rect" intensity={1.2} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[4, 6, 1]} color="#ffd1e4" />
          <Lightformer form="rect" intensity={1.2} position={[5, 1, 2]} rotation-y={-Math.PI / 2} scale={[4, 6, 1]} />
          <Lightformer form="ring" intensity={2} position={[0, 2, 6]} scale={2} />
        </Environment>
        <Rig labels={labelEls} follow={!reduced} calm={reduced} rate={reduced ? 0.35 : 1} />
        <ContactShadows position={[0, -1.16, 0]} opacity={0.32} scale={12} blur={2.2} far={3} color="#b52268" />
      </Canvas>
      <span aria-hidden="true" className="display pointer-events-none absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[13px] font-bold text-berry ring-2 ring-pink-100 sm:right-6 sm:top-6">
        Tap Halfy ✦
      </span>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {LABELS.map((l, i) => (
          <span
            key={l.text}
            ref={(el) => {
              labelEls.current[i] = el;
            }}
            style={{ opacity: 0 }}
            className={`display absolute left-0 top-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[14px] font-bold tracking-tight transition-opacity duration-500 ${
              l.tone === "pink"
                ? "bg-pink-600 text-white shadow-[0_3px_0_var(--berry-dark)]"
                : l.tone === "ink"
                  ? "bg-ink text-white shadow-[0_3px_0_#000]"
                  : "bg-white/90 text-ink-2 ring-2 ring-pink-100"
            }`}
          >
            <span className="sm:hidden">{l.short}</span>
            <span className="hidden sm:inline">{l.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

// Exported for tests and for keeping the timeline honest if durations change.
export const TIMELINE = { N, STAGGER, CYCLE };
