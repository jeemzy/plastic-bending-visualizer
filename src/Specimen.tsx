import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";
import { createRenderer, disposeScene } from "./scene";
import { clamp } from "./model";
import { createBeamMapper } from "./geometry";
import { BeamFallback } from "./FallbackViews";
import type { Simulation, View } from "./model";
export interface VisualState {
  sim: Simulation;
  view: View;
  paused: boolean;
  reduced: boolean;
  light: boolean;
  ps: boolean;
}
interface Props {
  live: MutableRefObject<VisualState>;
  onBend: (v: number) => void;
}
export function Specimen({ live, onBend }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const dragging = useRef(false);
  const start = useRef({ y: 0, b: 0 });
  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
    camera.position.set(7.5, 6.2, 11.8);
    camera.lookAt(0, 0.4, 0);
    let context: ReturnType<typeof createRenderer>;
    try {
      context = createRenderer(container, camera);
    } catch {
      setFailed(true);
      return;
    }
    scene.add(new THREE.HemisphereLight(0xdceada, 0x17251a, 3.4));
    const light = new THREE.DirectionalLight(0xeeffdc, 5);
    light.position.set(-2, 7, 4);
    scene.add(light);
    const rim = new THREE.DirectionalLight(0xffffff, 5);
    rim.position.set(2, 1, -4);
    scene.add(rim);
    const warm = new THREE.DirectionalLight(0xa3bc78, 2);
    warm.position.set(-6, 0, 3);
    scene.add(warm);
    const group = new THREE.Group();
    group.rotation.y = -0.16;
    group.rotation.z = -0.13;
    scene.add(group);
    const geometry = new THREE.BoxGeometry(7.4, 0.24, 1.2, 160, 3, 10);
    const original = geometry.attributes.position.array.slice();
    const colors = new Float32Array(original.length);
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      metalness: 0.06,
      roughness: 0.23,
      transmission: 0.28,
      thickness: 1.1,
      ior: 1.46,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
      transparent: true,
      opacity: 0.95,
    });
    // Cloud density is a multi-frequency procedural field through the specimen volume.
    const uniforms = {
      damage: { value: 0 },
      heat: { value: 0 },
      mode: { value: 0 },
    };
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uDamage = uniforms.damage;
      shader.uniforms.uHeat = uniforms.heat;
      shader.uniforms.uMode = uniforms.mode;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vLocal;")
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvLocal = position;",
        );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `#include <common>
    varying vec3 vLocal; uniform float uDamage; uniform float uHeat; uniform float uMode;
    float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
    float cloud=noise3(vLocal*13.)*.6+noise3(vLocal*39.)*.28+noise3(vLocal*85.)*.12;
    float region=exp(-vLocal.x*vLocal.x*1.8);
    float whitening=smoothstep(.15,.8,uDamage*region*(.55+cloud));
    if(uMode<.5) diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.96,.98,.94),whitening*.95);`,
      );
    };
    const beam = new THREE.Mesh(geometry, material);
    group.add(beam);
    // Longitudinal guide lines make outer stretch and inner compression legible.
    const lines: [THREE.Line, number, number][] = [];
    for (const v of [-0.126, 0.126])
      for (const z of [-0.604, 0.604]) {
        const g = new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 161 }, () => new THREE.Vector3()),
        );
        const line = new THREE.Line(
          g,
          new THREE.LineBasicMaterial({
            color: v < 0 ? 0xefb99c : 0xa2d4c1,
            transparent: true,
            opacity: 0.5,
          }),
        );
        group.add(line);
        lines.push([line, v, z]);
      }
    const grid = new THREE.GridHelper(18, 24, 0x344338, 0x253128);
    grid.position.y = -1.25;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.22;
    scene.add(grid);
    // A contact shadow is procedural, avoiding image downloads.
    const shadowGeometry = new THREE.PlaneGeometry(10, 4);
    const shadowMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {},
      vertexShader:
        "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;gl_FragColor=vec4(.015,.025,.015,exp(-dot(p*vec2(1.3,2.),p*vec2(1.3,2.)))*.6);}",
    });
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.23;
    scene.add(shadow);
    let frame = 0,
      lastB = -1,
      lastDamage = -1,
      lastHeat = -1,
      lastView = "";
    const color = new THREE.Color();
    const render = () => {
      frame = requestAnimationFrame(render);
      const { sim, view } = live.current;
      if (
        Math.abs(sim.bend - lastB) > 0.0001 ||
        Math.abs(sim.damage - lastDamage) > 0.001 ||
        Math.abs(sim.heat - lastHeat) > 0.004 ||
        view !== lastView
      ) {
        lastB = sim.bend;
        lastDamage = sim.damage;
        lastHeat = sim.heat;
        lastView = view;
        const map = createBeamMapper(sim.bend);
        const pos = geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const s = original[i * 3],
            v = original[i * 3 + 1],
            z = original[i * 3 + 2];
          const p = map(s, v, z);
          pos.setXYZ(i, p[0], p[1], p[2]);
          const region = Math.exp(-s * s * 0.65);
          if (view === "thermal") {
            color.setRGB(0.08, 0.19, 0.45);
            color.lerp(
              new THREE.Color("#ffb252"),
              clamp(sim.heat * 2) * region,
            );
            if (sim.heat > 0.5)
              color.lerp(new THREE.Color("#fff3b0"), (sim.heat - 0.5) * region);
          } else if (view === "strain") {
            color.set(v < 0 ? "#e3a183" : "#79b6c4");
            color.lerp(new THREE.Color("#c5d3b7"), 1 - sim.bend * region);
          } else {
            color.set("#78aebd");
            color.multiplyScalar(0.8 + (0.2 * (z + 0.6)) / 1.2);
          }
          colors[i * 3] = color.r;
          colors[i * 3 + 1] = color.g;
          colors[i * 3 + 2] = color.b;
        }
        pos.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
        geometry.computeVertexNormals();
        uniforms.damage.value = sim.damage;
        uniforms.heat.value = sim.heat;
        uniforms.mode.value = view === "material" ? 0 : 1;
        material.transmission =
          view === "material" ? 0.28 * (1 - sim.damage * 0.7) : 0;
        material.roughness =
          view === "material" ? 0.23 + sim.damage * 0.2 : 0.55;
        for (const [line, v, z] of lines) {
          const attr = line.geometry.attributes.position;
          for (let i = 0; i <= 160; i++) {
            const p = map(((i - 80) * 7.4) / 160, v, z);
            attr.setXYZ(i, p[0], p[1], p[2]);
          }
          attr.needsUpdate = true;
          line.visible = view === "strain" || view === "material";
        }
      }
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
  }, [live]);
  return (
    <div
      className="specimen-interaction"
      role="img"
      aria-label="Interactive plastic strip. Use the bending slider, or drag vertically on this view to bend."
      onPointerDown={(e) => {
        dragging.current = true;
        start.current = { y: e.clientY, b: live.current.sim.bend };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (dragging.current)
          onBend(clamp(start.current.b + (start.current.y - e.clientY) / 240));
      }}
      onPointerUp={() => {
        dragging.current = false;
      }}
      onPointerCancel={() => {
        dragging.current = false;
      }}
    >
      <div ref={host} className="three-host" aria-hidden="true" />
      {failed && (
        <BeamFallback sim={live.current.sim} view={live.current.view} />
      )}
    </div>
  );
}
