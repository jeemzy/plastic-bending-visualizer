import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";
import type { VisualState } from "./Specimen";
import { createRenderer, disposeScene } from "./scene";
import { MicroFallback } from "./FallbackViews";
export function Microstructure({
  live,
  large = false,
}: {
  live: MutableRefObject<VisualState>;
  large?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    camera.position.set(0, 1, 10.2);
    camera.lookAt(0, 0, 0);
    let context: ReturnType<typeof createRenderer>;
    try {
      context = createRenderer(host.current, camera);
    } catch {
      setFailed(true);
      return;
    }
    scene.add(new THREE.AmbientLight(0xb6ddca, 2));
    const key = new THREE.DirectionalLight(0xeeffdd, 3);
    key.position.set(-2, 3, 4);
    scene.add(key);
    const group = new THREE.Group();
    group.rotation.z = -0.1;
    scene.add(group);
    const uniforms = {
      t: { value: 0 },
      b: { value: 0 },
      h: { value: 0 },
      d: { value: 0 },
    };
    const palette = ["#ccdfa0", "#91b58f", "#b6d6ad", "#76a595", "#d6e7b8"];
    for (let i = 0; i < 26; i++) {
      const phase = i * 2.3999;
      const row = ((i % 7) - 3) * 0.37;
      const depth = Math.sin(i * 3.78) * 0.7;
      const points = Array.from({ length: 58 }, (_, j) => {
        const t = j / 57;
        return new THREE.Vector3(
          -3.2 + t * 6.4 + 0.27 * Math.sin(t * 22 + phase),
          row +
            0.38 * Math.sin(t * 16 + phase) +
            0.23 * Math.cos(t * 33 + phase),
          depth + 0.3 * Math.sin(t * 18 + phase),
        );
      });
      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(
        curve,
        112,
        0.024 + (i % 3) * 0.006,
        5,
        false,
      );
      const mat = new THREE.MeshStandardMaterial({
        color: palette[i % 5],
        roughness: 0.5,
        metalness: 0.15,
        transparent: true,
        opacity: 0.65 + (i % 3) * 0.1,
      });
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = uniforms.t;
        shader.uniforms.uB = uniforms.b;
        shader.uniforms.uH = uniforms.h;
        shader.uniforms.uD = uniforms.d;
        shader.uniforms.uPhase = { value: phase };
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            "#include <common>\nuniform float uTime;uniform float uB;uniform float uH;uniform float uD;uniform float uPhase;",
          )
          .replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>
    transformed.x=position.x*(1.+uB*.25);
    transformed.y=position.y*(1.-uB*.18);
    transformed.y+=sin(position.x*2.5+uPhase+uTime*2.)*(.008+uH*.025);
    transformed.z+=sin(position.x*3.+uTime*3.+uPhase)*(.008+uH*.035);
    // Move chains around an idealized central cavity, not through it.
    float vicinity=exp(-position.x*position.x*2.5-position.y*position.y*2.);
    transformed.y+=sign(position.y)*uD*.4*vicinity;`,
          );
      };
      group.add(new THREE.Mesh(geometry, mat));
    }
    const voids: THREE.Mesh[] = [];
    for (let i = 0; i < 7; i++) {
      const geo = new THREE.SphereGeometry(1, 20, 12);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xf5fff2,
        emissive: 0x9cbca3,
        emissiveIntensity: 0.18,
        transparent: true,
        opacity: 0.65,
        roughness: 0.18,
        metalness: 0.15,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(Math.sin(i * 2.4) * 1.35, Math.cos(i * 4) * 0.7, 0.5);
      mesh.scale.setScalar(0.001);
      group.add(mesh);
      voids.push(mesh);
    }
    const fibrils: THREE.Line[] = [];
    for (let i = 0; i < 6; i++) {
      const x = (i - 2.5) * 0.06;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, -0.24, 0.9),
        new THREE.Vector3(x + 0.02, 0.24, 0.9),
      ]);
      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({
          color: 0xecffe3,
          transparent: true,
          opacity: 0.8,
        }),
      );
      group.add(line);
      fibrils.push(line);
    }
    const rays: THREE.Line[] = [];
    const photons: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-5, (i - 3.5) * 0.12, 1.1),
          new THREE.Vector3(0, 0, 1.1),
          new THREE.Vector3(5, 0, 1.1),
        ]),
        new THREE.LineDashedMaterial({
          color: 0xefe9bc,
          dashSize: 0.11,
          gapSize: 0.12,
          transparent: true,
          opacity: 0.55,
        }),
      );
      line.computeLineDistances();
      scene.add(line);
      rays.push(line);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffdd }),
      );
      scene.add(dot);
      photons.push(dot);
    }
    let frame = 0;
    const render = () => {
      frame = requestAnimationFrame(render);
      const { sim, light, ps, reduced } = live.current;
      uniforms.t.value = reduced ? 0 : sim.elapsed;
      uniforms.b.value = sim.bend;
      uniforms.h.value = sim.heat;
      uniforms.d.value = sim.damage;
      voids.forEach((v, i) => {
        const s = Math.max(0.001, sim.damage * (0.18 + (i % 3) * 0.075));
        v.scale.set(s * 0.65, s * (ps ? 1.8 : 0.8), s * 0.6);
        v.visible = sim.damage > 0.02;
      });
      fibrils.forEach((f) => {
        f.visible = ps && sim.damage > 0.05;
        f.scale.y = sim.damage * 1.6;
      });
      rays.forEach((ray, i) => {
        ray.visible = light;
        photons[i].visible = light;
        const a = (i - 3.5) * 0.32 * sim.damage;
        const y0 = (i - 3.5) * 0.13;
        const end = new THREE.Vector3(
          5 * Math.cos(a),
          y0 + 5 * Math.sin(a),
          1.2,
        );
        const attr = ray.geometry.attributes.position;
        attr.setXYZ(0, -5, y0, 1.2);
        attr.setXYZ(1, 0, y0, 1.2);
        attr.setXYZ(2, end.x, end.y, end.z);
        attr.needsUpdate = true;
        ray.computeLineDistances();
        const t = reduced ? 0.3 : (sim.elapsed * 0.3 + i * 0.123) % 1;
        if (t < 0.5) photons[i].position.set(-5 + t * 10, y0, 1.2);
        else
          photons[i].position.set(
            end.x * (t - 0.5) * 2,
            y0 + (end.y - y0) * (t - 0.5) * 2,
            1.2,
          );
      });
      context.renderer.render(scene, camera);
    };
    render();
    const lost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };
    const restored = () => setFailed(false);
    context.renderer.domElement.addEventListener("webglcontextlost", lost);
    context.renderer.domElement.addEventListener(
      "webglcontextrestored",
      restored,
    );
    return () => {
      cancelAnimationFrame(frame);
      context.renderer.domElement.removeEventListener("webglcontextlost", lost);
      context.renderer.domElement.removeEventListener(
        "webglcontextrestored",
        restored,
      );
      disposeScene(scene);
      context.dispose();
    };
  }, [live, large]);
  return (
    <div
      className={`micro-world ${large ? "large" : ""}`}
      role="img"
      aria-label="Conceptual tension-side polymer chains, cavities and incoming light. Geometry is not to scale."
    >
      <div ref={host} className="three-host" aria-hidden="true" />
      {failed && (
        <MicroFallback
          sim={live.current.sim}
          light={live.current.light}
          ps={live.current.ps}
        />
      )}
    </div>
  );
}
