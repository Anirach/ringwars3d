// RINGwars 3D - Three.js Renderer

import * as THREE from 'three';
import { GameState, RingNode, NodeOwner } from './types';

const RING_RADIUS = 10;
const RING_THICKNESS = 2.5;
const NODE_HEIGHT = 0.8;

// Colors matching the original game
const COLORS = {
  red: 0xe53935,
  blue: 0x4285f4,
  neutral: 0x808080,
  background: 0x1a1a2e,
  ring: 0x2d2d44,
};

export interface RingRenderer {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  nodeGroups: THREE.Group[];
  fernieSprites: Map<string, THREE.Group>;
  labels: Map<number, THREE.Sprite>;
  directionArrow: THREE.Mesh;
  update: (state: GameState) => void;
  resize: (width: number, height: number) => void;
  animate: () => void;
  getNodeAtPosition: (x: number, y: number) => number | null;
}

function createFernie(color: number, scale: number = 1): THREE.Group {
  const group = new THREE.Group();

  // Body - blob shape
  const bodyGeom = new THREE.SphereGeometry(0.4 * scale, 16, 12);
  bodyGeom.scale(1, 0.8, 1);
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.y = 0.3 * scale;
  group.add(body);

  // Eyes
  const eyeGeom = new THREE.SphereGeometry(0.1 * scale, 8, 8);
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

  const leftEye = new THREE.Mesh(eyeGeom, eyeWhiteMat);
  leftEye.position.set(-0.12 * scale, 0.4 * scale, 0.3 * scale);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeom, eyeWhiteMat);
  rightEye.position.set(0.12 * scale, 0.4 * scale, 0.3 * scale);
  group.add(rightEye);

  // Pupils
  const pupilGeom = new THREE.SphereGeometry(0.05 * scale, 6, 6);
  const leftPupil = new THREE.Mesh(pupilGeom, pupilMat);
  leftPupil.position.set(-0.12 * scale, 0.4 * scale, 0.38 * scale);
  group.add(leftPupil);

  const rightPupil = new THREE.Mesh(pupilGeom, pupilMat);
  rightPupil.position.set(0.12 * scale, 0.4 * scale, 0.38 * scale);
  group.add(rightPupil);

  return group;
}

function createNodeSegment(startAngle: number, endAngle: number, owner: NodeOwner): THREE.Mesh {
  const shape = new THREE.Shape();
  const innerRadius = RING_RADIUS - RING_THICKNESS / 2;
  const outerRadius = RING_RADIUS + RING_THICKNESS / 2;

  // Create arc segment
  const segments = 16;
  const angleStep = (endAngle - startAngle) / segments;

  // Start at inner radius
  shape.moveTo(
    Math.cos(startAngle) * innerRadius,
    Math.sin(startAngle) * innerRadius
  );

  // Draw outer arc
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + i * angleStep;
    shape.lineTo(
      Math.cos(angle) * outerRadius,
      Math.sin(angle) * outerRadius
    );
  }

  // Draw inner arc (reverse)
  for (let i = segments; i >= 0; i--) {
    const angle = startAngle + i * angleStep;
    shape.lineTo(
      Math.cos(angle) * innerRadius,
      Math.sin(angle) * innerRadius
    );
  }

  shape.closePath();

  const extrudeSettings = {
    depth: NODE_HEIGHT,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    color: COLORS[owner],
    roughness: 0.6,
    metalness: 0.2,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function createTextSprite(text: string, color: string = '#ffffff'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = color;
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.5, 0.75, 1);

  return sprite;
}

export function createRingRenderer(container: HTMLElement): RingRenderer {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.background);

  // Camera
  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 28, 8);
  camera.lookAt(0, 0, 1.5);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);

  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
  fillLight.position.set(-10, 10, -10);
  scene.add(fillLight);

  // Ground plane
  const groundGeom = new THREE.CircleGeometry(RING_RADIUS + 5, 64);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x151525,
    roughness: 0.9,
  });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  scene.add(ground);

  // Node groups and labels
  const nodeGroups: THREE.Group[] = [];
  const fernieSprites = new Map<string, THREE.Group>();
  const labels = new Map<number, THREE.Sprite>();

  // Direction arrow
  const arrowGeom = new THREE.ConeGeometry(0.3, 0.8, 8);
  const arrowMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const directionArrow = new THREE.Mesh(arrowGeom, arrowMat);
  directionArrow.visible = false;
  scene.add(directionArrow);

  // Raycaster for node selection
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function update(state: GameState) {
    // Clear existing nodes
    nodeGroups.forEach((g) => scene.remove(g));
    nodeGroups.length = 0;
    fernieSprites.forEach((f) => scene.remove(f));
    fernieSprites.clear();
    labels.forEach((l) => scene.remove(l));
    labels.clear();

    const { ringSize } = state.settings;
    const angleStep = (Math.PI * 2) / ringSize;
    const gapAngle = 0.02; // Small gap between segments

    // Create node segments
    state.nodes.forEach((node, i) => {
      const startAngle = node.angle - angleStep / 2 + gapAngle;
      const endAngle = node.angle + angleStep / 2 - gapAngle;

      const group = new THREE.Group();

      // Node segment
      const segment = createNodeSegment(startAngle, endAngle, node.owner);
      group.add(segment);

      // Add Fernie character if node has Fernies
      if (node.fernies > 0 && node.owner !== 'neutral') {
        const fernieColor = node.owner === 'red' ? COLORS.red : COLORS.blue;
        const fernie = createFernie(fernieColor, 0.8);

        // Position on the node
        const midAngle = node.angle;
        const midRadius = RING_RADIUS;
        fernie.position.set(
          Math.cos(midAngle) * midRadius,
          NODE_HEIGHT + 0.2,
          Math.sin(midAngle) * midRadius
        );
        fernie.rotation.y = -midAngle + Math.PI / 2;

        group.add(fernie);
        fernieSprites.set(`fernie-${i}`, fernie);
      }

      // Fernie count label (outside the ring)
      const labelRadius = RING_RADIUS + RING_THICKNESS / 2 + 1;
      const labelAngle = node.angle;
      const label = createTextSprite(
        node.fernies.toString(),
        node.owner === 'red' ? '#ff6666' : node.owner === 'blue' ? '#6699ff' : '#888888'
      );
      label.position.set(
        Math.cos(labelAngle) * labelRadius,
        1,
        Math.sin(labelAngle) * labelRadius
      );
      scene.add(label);
      labels.set(i, label);

      // Node index (inside the ring)
      const indexRadius = RING_RADIUS - RING_THICKNESS / 2 - 0.8;
      const indexLabel = createTextSprite(i.toString(), '#666666');
      indexLabel.position.set(
        Math.cos(labelAngle) * indexRadius,
        0.5,
        Math.sin(labelAngle) * indexRadius
      );
      indexLabel.scale.set(0.8, 0.4, 1);
      scene.add(indexLabel);
      labels.set(i + 1000, indexLabel); // Offset to avoid collision

      scene.add(group);
      nodeGroups.push(group);
    });

    // Update direction arrow
    if (state.phase === 'resolution') {
      const startNode = state.nodes[state.resolutionStartNode];
      const arrowRadius = RING_RADIUS - RING_THICKNESS / 2 - 2;
      directionArrow.position.set(
        Math.cos(startNode.angle) * arrowRadius,
        0.5,
        Math.sin(startNode.angle) * arrowRadius
      );
      directionArrow.rotation.z = state.resolutionDirection === 'clockwise' ? Math.PI : 0;
      directionArrow.rotation.y = -startNode.angle;
      directionArrow.visible = true;
    } else {
      directionArrow.visible = false;
    }
  }

  function resize(width: number, height: number) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  let animationTime = 0;

  function animate() {
    animationTime += 0.016;

    // Animate Fernies (bobbing)
    fernieSprites.forEach((fernie, key) => {
      fernie.position.y = NODE_HEIGHT + 0.2 + Math.sin(animationTime * 2) * 0.05;
    });

    // Slowly rotate camera around the ring
    // camera.position.x = Math.sin(animationTime * 0.1) * 18;
    // camera.position.z = Math.cos(animationTime * 0.1) * 18;
    // camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function getNodeAtPosition(screenX: number, screenY: number): number | null {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((screenX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((screenY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(nodeGroups, true);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      // Find which node group this belongs to
      for (let i = 0; i < nodeGroups.length; i++) {
        if (nodeGroups[i].children.includes(hit) || nodeGroups[i] === hit.parent) {
          return i;
        }
      }
    }

    return null;
  }

  return {
    scene,
    camera,
    renderer,
    nodeGroups,
    fernieSprites,
    labels,
    directionArrow,
    update,
    resize,
    animate,
    getNodeAtPosition,
  };
}
