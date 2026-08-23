import './style.css';
import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';

async function init() {
  await RAPIER.init();
  const gravity = { x: 0.0, y: 0.0, z: 0.0 };
  const world = new RAPIER.World(gravity);

  const app = document.getElementById('app');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#03040a');
  scene.fog = new THREE.FogExp2(0x03040a, 0.005); 
  
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 4000);
  const cameraOffset = window.innerWidth < 768 ? new THREE.Vector3(0, 80, 45) : new THREE.Vector3(0, 50, 40);
  camera.position.copy(cameraOffset);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  app.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0x201838, 2.5); 
  scene.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xffdfa0, 3.5); 
  dirLight.position.set(-100, 150, 50);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 1500;
  dirLight.shadow.camera.left = -300;
  dirLight.shadow.camera.right = 300;
  dirLight.shadow.camera.top = 300;
  dirLight.shadow.camera.bottom = -300;
  scene.add(dirLight);

  // MORE STARS (30,000)
  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 30000;
  const posArray = new Float32Array(starsCount * 3);
  const colorsArray = new Float32Array(starsCount * 3);
  for(let i = 0; i < starsCount * 3; i+=3) {
    posArray[i] = (Math.random() - 0.5) * 3500;
    posArray[i+1] = (Math.random() - 0.5) * 3500 - 300; 
    posArray[i+2] = (Math.random() - 0.5) * 3500;
    colorsArray[i] = Math.random() * 0.4 + 0.6;
    colorsArray[i+1] = Math.random() * 0.4 + 0.6;
    colorsArray[i+2] = 1.0;
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  starsGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));
  const starsMaterial = new THREE.PointsMaterial({ size: 3.5, vertexColors: true, transparent: true, opacity: 0.8, sizeAttenuation: true });
  const starField = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starField);

  function getMaterial(color, emissive = 0x000000, intensity = 0, metalness = 0.1, roughness = 0.6, wireframe = false) {
      return new THREE.MeshStandardMaterial({
          color: color,
          emissive: emissive,
          emissiveIntensity: intensity,
          roughness: roughness,
          metalness: metalness,
          flatShading: true,
          wireframe: wireframe
      });
  }

  const stations = [
      { id: 'station1', pos: new THREE.Vector3(0, 0, 0), radius: 25 },
      { id: 'station2', pos: new THREE.Vector3(120, 0, -60), radius: 30 },
      { id: 'station3', pos: new THREE.Vector3(200, 0, -180), radius: 35 },
      { id: 'station4', pos: new THREE.Vector3(120, 0, -300), radius: 35 },
      { id: 'station5', pos: new THREE.Vector3(0, 0, -420), radius: 30 },
      { id: 'station6', pos: new THREE.Vector3(-100, 0, -540), radius: 35 },
      { id: 'station7', pos: new THREE.Vector3(0, 0, -660), radius: 35 }
  ];

  const interactables = []; 
  const blinkers = []; 

  // --- Station 1: Command Hub ---
  const s1 = new THREE.Group();
  s1.position.copy(stations[0].pos);
  
  const padMat = getMaterial('#2c3e50', 0, 0, 0.5, 0.4);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(15, 14, 1, 16), padMat);
  pad.position.y = -1;
  pad.receiveShadow = true;
  s1.add(pad);
  
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(14.5, 12, 1, 16), getMaterial('#1a252f'));
  rim.position.y = -2;
  rim.receiveShadow = true;
  s1.add(rim);

  for (let i = 0; i < 4; i++) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), getMaterial('#7f8c8d'));
      const angle = (Math.PI / 2) * i;
      strut.position.set(Math.cos(angle) * 8, -3.5, Math.sin(angle) * 8);
      strut.rotation.x = Math.PI / 8;
      strut.lookAt(0, -3.5, 0);
      s1.add(strut);
  }

  world.createCollider(RAPIER.ColliderDesc.cylinder(1.5, 15), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s1.position.x, -1.5, s1.position.z)));

  const grid = new THREE.Mesh(new THREE.RingGeometry(5, 14, 16), new THREE.MeshBasicMaterial({ color: '#ffdfa0', wireframe: true, transparent: true, opacity: 0.3 }));
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = -0.49;
  s1.add(grid);

  const beaconGroup = new THREE.Group();
  beaconGroup.position.set(10, 6, -10);
  
  const s1Beacon = new THREE.Mesh(new THREE.IcosahedronGeometry(3, 2), getMaterial('#ff8800', '#ff6600', 2.0));
  beaconGroup.add(s1Beacon);
  
  for(let i=1; i<=3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3 + i*1.2, 0.1, 4, 32), getMaterial('#ffffff', '#ffaa00', 1.0));
      ring.rotation.x = Math.PI/2 + (Math.random()-0.5);
      ring.rotation.y = (Math.random()-0.5);
      beaconGroup.add(ring);
      interactables.push({ mesh: ring, speedX: Math.random()*2, speedY: Math.random()*2, speedZ: Math.random()*2 });
  }
  s1.add(beaconGroup);
  
  const s1BeaconBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.5, 8, 8), getMaterial('#111111'));
  s1BeaconBase.position.set(10, 0, -10);
  s1.add(s1BeaconBase);

  // Collider for beacon base
  world.createCollider(RAPIER.ColliderDesc.cylinder(4, 2.5), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s1.position.x + 10, 0, s1.position.z - 10)));

  scene.add(s1);

  // --- Station 2: Fleet Operations Sector ---
  const s2 = new THREE.Group();
  s2.position.copy(stations[1].pos);

  const hangarBase = new THREE.Mesh(new THREE.BoxGeometry(32, 2, 22), getMaterial('#34495e', 0, 0, 0.6, 0.3));
  hangarBase.position.y = -1;
  hangarBase.receiveShadow = true;
  s2.add(hangarBase);
  world.createCollider(RAPIER.ColliderDesc.cuboid(16, 1, 11), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s2.position.x, -1, s2.position.z)));

  for(let i=-1; i<=1; i+=2) {
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(28, 0.5), getMaterial('#ffffff', '#f1c40f', 1.0));
      strip.rotation.x = -Math.PI/2;
      strip.position.set(0, 0.01, i*5);
      s2.add(strip);
  }

  for(let i=0; i<2; i++) {
      const tGroup = new THREE.Group();
      tGroup.position.set(12, 0, (i===0 ? -8 : 8));
      
      const tBase = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), getMaterial('#2c3e50'));
      tBase.position.y = 2;
      tBase.castShadow = true;
      tGroup.add(tBase);
      
      const tMid = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 4), getMaterial('#1a252f'));
      tMid.position.y = 8;
      tMid.castShadow = true;
      tGroup.add(tMid);
      
      const windowMat = getMaterial('#000', '#00ffff', 0.8);
      const window = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2, 4.2), windowMat);
      window.position.y = 10;
      tGroup.add(window);
      blinkers.push({ mat: windowMat, speed: 1.5, baseInt: 0.2, maxInt: 1.5 });
      
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4), getMaterial('#fff'));
      ant.position.y = 14;
      tGroup.add(ant);
      
      s2.add(tGroup);
      
      // Tower Collider
      world.createCollider(RAPIER.ColliderDesc.cuboid(3, 7, 3), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s2.position.x + 12, 7, s2.position.z + (i===0 ? -8 : 8))));
  }

  const cargoColors = ['#e74c3c', '#f1c40f', '#3498db'];
  for(let i=0; i<5; i++) {
      const cGroup = new THREE.Group();
      
      const cargo = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 6), getMaterial(cargoColors[i%3]));
      cargo.castShadow = true;
      cGroup.add(cargo);
      
      const duct = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), getMaterial('#95a5a6'));
      duct.position.set(0, 1.6, 0);
      cGroup.add(duct);
      
      cGroup.position.set(-8 + Math.random()*4, 2 + i*2, -5 + Math.random()*10);
      cGroup.rotation.set(Math.random(), Math.random(), Math.random());
      s2.add(cGroup);
      
      interactables.push({ mesh: cGroup, speedX: Math.random()*0.5, speedY: Math.random()*0.5, speedZ: Math.random()*0.5 });
  }
  scene.add(s2);

  // --- Station 3: Innovation Labs ---
  const s3 = new THREE.Group();
  s3.position.copy(stations[2].pos);

  const hullMat = getMaterial('#2a2a35', '#000000', 0, 0.8, 0.2);
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(6, 15, 8, 16), hullMat);
  hull.rotation.z = Math.PI / 2;
  hull.position.y = 2;
  hull.castShadow = true;
  hull.receiveShadow = true;
  s3.add(hull);
  
  for (let i = -6; i <= 6; i += 3) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.4, 8, 16), getMaterial('#111'));
      rib.rotation.y = Math.PI / 2;
      rib.position.set(i, 2, 0);
      s3.add(rib);
  }

  world.createCollider(RAPIER.ColliderDesc.capsule(7.5, 6).setRotation({x:0, y:0, z:0.707, w:0.707}), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s3.position.x, 2, s3.position.z)));

  const deptAngles = [Math.PI/4, Math.PI*3/4, Math.PI*5/4, Math.PI*7/4];
  const deptColors = ['#9b59b6', '#1abc9c', '#e67e22', '#3498db'];
  
  deptAngles.forEach((angle, i) => {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 12), getMaterial('#444'));
      tube.rotation.x = Math.PI/2;
      tube.rotation.z = angle;
      const tx = Math.cos(angle)*6;
      const tz = Math.sin(angle)*6;
      tube.position.set(tx, 2, tz);
      s3.add(tube);
      
      // Fix: Add collider for the connector tube so ship doesn't fly through
      const tubeBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s3.position.x + tx, 2, s3.position.z + tz));
      // Tube is rotated 90deg on X, then `angle` on Z. We must pass rotation to collider.
      const euler = new THREE.Euler(Math.PI/2, 0, angle, 'XYZ');
      const q = new THREE.Quaternion().setFromEuler(euler);
      world.createCollider(RAPIER.ColliderDesc.cylinder(6, 1.5).setRotation({x:q.x, y:q.y, z:q.z, w:q.w}), tubeBody);
      
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 1), getMaterial('#222'));
      collar.rotation.copy(tube.rotation);
      collar.position.set(Math.cos(angle)*10, 2, Math.sin(angle)*10);
      s3.add(collar);
      
      const frame = new THREE.Mesh(new THREE.IcosahedronGeometry(4.5, 1), getMaterial('#111', 0, 0, 0, 0, true));
      const px = Math.cos(angle)*14;
      const pz = Math.sin(angle)*14;
      frame.position.set(px, 2, pz);
      s3.add(frame);
      interactables.push({ mesh: frame, speedX: 1.0, speedY: 0.5, speedZ: 0.2 });

      const coreMat = getMaterial(deptColors[i], deptColors[i], 1.5);
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(3.5, 0), coreMat);
      core.position.copy(frame.position);
      s3.add(core);
      blinkers.push({ mat: coreMat, speed: 2 + i*0.5, baseInt: 0.5, maxInt: 2.0 });
      
      world.createCollider(RAPIER.ColliderDesc.ball(4.5), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s3.position.x + px, 2, s3.position.z + pz)));
  });
  scene.add(s3);

  // --- Station 4: Academy Mothership ---
  const s4 = new THREE.Group();
  s4.position.copy(stations[3].pos);

  const carrierBase = new THREE.Mesh(new THREE.BoxGeometry(45, 8, 20), getMaterial('#1c2833', 0, 0, 0.6, 0.4));
  carrierBase.castShadow = true;
  carrierBase.receiveShadow = true;
  s4.add(carrierBase);
  world.createCollider(RAPIER.ColliderDesc.cuboid(22.5, 4, 10), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s4.position.x, 0, s4.position.z)));

  const runway = new THREE.Mesh(new THREE.PlaneGeometry(40, 6), getMaterial('#111'));
  runway.rotation.x = -Math.PI/2;
  runway.position.y = 4.01;
  s4.add(runway);
  
  for(let x=-18; x<=18; x+=4) {
      for(let z=-2; z<=2; z+=4) {
          const rLightMat = getMaterial('#fff', '#e74c3c', 2.0);
          const rLight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.5), rLightMat);
          rLight.position.set(x, 4.05, z);
          s4.add(rLight);
          blinkers.push({ mat: rLightMat, speed: 4.0, baseInt: 0, maxInt: 2.0 });
      }
  }

  const bridgeGeo = new THREE.CylinderGeometry(3, 8, 6, 4); 
  const bridgeMat = getMaterial('#2c3e50', '#3498db', 0.5);
  const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
  bridge.rotation.y = Math.PI / 4;
  bridge.position.set(10, 7, 0);
  bridge.castShadow = true;
  s4.add(bridge);
  blinkers.push({ mat: bridgeMat, speed: 1.0, baseInt: 0.1, maxInt: 1.0 });
  
  // Fix: Collider for bridge
  world.createCollider(RAPIER.ColliderDesc.cuboid(5, 3, 5), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s4.position.x + 10, 7, s4.position.z)));

  for(let i=-1; i<=1; i+=2) {
      const array = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 4), getMaterial('#34495e'));
      array.position.set(0, 0, i*11);
      s4.add(array);
      // Fix: Collider for side arrays
      world.createCollider(RAPIER.ColliderDesc.cuboid(5, 1, 2), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s4.position.x, 0, s4.position.z + i*11)));
  }

  for(let i=-1; i<=1; i+=2) {
      const engine = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 8, 12), getMaterial('#111'));
      engine.rotation.z = Math.PI/2;
      engine.position.set(-22, 0, i*5);
      s4.add(engine);
      
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 1, 12), getMaterial('#00ffff', '#00ffff', 3.0));
      exhaust.rotation.z = Math.PI/2;
      exhaust.position.set(-26, 0, i*5);
      s4.add(exhaust);
      
      // Fix: Collider for engine
      const eQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI/2));
      world.createCollider(RAPIER.ColliderDesc.cylinder(4.5, 5).setRotation({x:eQ.x, y:eQ.y, z:eQ.z, w:eQ.w}), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s4.position.x - 22, 0, s4.position.z + i*5)));
  }

  const holoGroup = new THREE.Group();
  holoGroup.position.set(0, 15, 0);
  for(let i=0; i<7; i++) {
      const blockMat = getMaterial('#ffffff', '#f1c40f', 1.5);
      const block = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2 + Math.random()*2, 0.5), blockMat);
      block.position.x = (i - 3) * 2.5; 
      holoGroup.add(block);
      blinkers.push({ mat: blockMat, speed: 1.5 + i*0.1, baseInt: 0.5, maxInt: 2.0 });
  }
  s4.add(holoGroup);
  interactables.push({ mesh: holoGroup, speedX: 0, speedY: 0, speedZ: 0, bobSpeed: 2.0, bobAmp: 1.5 });

  scene.add(s4);

  // --- Station 5: The Hall of Accolades ---
  const s5 = new THREE.Group();
  s5.position.copy(stations[4].pos);

  for(let i=0; i<3; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(24 - i*4, 2, 24 - i*4), getMaterial('#111', 0, 0, 0.9, 0.1)); 
      step.position.y = -1 + i*2;
      step.receiveShadow = true;
      s5.add(step);
      world.createCollider(RAPIER.ColliderDesc.cuboid(12 - i*2, 1, 12 - i*2), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s5.position.x, -1 + i*2, s5.position.z)));
      
      // Neon yellow glowing trims on the edges of the black base
      const neonTrim = new THREE.Mesh(new THREE.BoxGeometry(24.2 - i*4, 0.2, 24.2 - i*4), getMaterial('#ccff00', '#ccff00', 2.0));
      neonTrim.position.y = i*2;
      s5.add(neonTrim);
  }

  const cPos = [[-10, -10], [10, -10], [-10, 10], [10, 10]];
  cPos.forEach(p => {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.5, 0), getMaterial('#ccff00', '#ccff00', 2.5));
      crystal.position.set(p[0], 2, p[1]);
      s5.add(crystal);
      interactables.push({ mesh: crystal, speedX: 0, speedY: 2.0, speedZ: 0, bobSpeed: 3.0, bobAmp: 0.5 });
  });

  const positions = [[-5, -5], [5, -5], [0, 5]];
  positions.forEach((p, idx) => {
      const monolith = new THREE.Mesh(new THREE.BoxGeometry(3, 14, 3), getMaterial('#050505', 0, 0, 1.0, 0.05));
      monolith.position.set(p[0], 10, p[1]);
      monolith.castShadow = true;
      
      const runeMat = getMaterial('#ffaa00', '#ffaa00', 1.5);
      const rune = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1, 3.2), runeMat);
      rune.position.y = 4;
      monolith.add(rune);
      blinkers.push({ mat: runeMat, speed: 2 + idx, baseInt: 0.5, maxInt: 2.5 });

      const trophy = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 0), getMaterial('#f1c40f', '#f1c40f', 0.8, 1.0, 0.2));
      trophy.position.y = 9;
      monolith.add(trophy);
      interactables.push({ mesh: trophy, speedX: 0, speedY: 1.5, speedZ: 0 });

      s5.add(monolith);
      world.createCollider(RAPIER.ColliderDesc.cuboid(1.5, 7, 1.5), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s5.position.x + p[0], 10, s5.position.z + p[1])));
  });
  scene.add(s5);

  // --- Station 6: Certification & Tech Relay ---
  const s6 = new THREE.Group();
  s6.position.copy(stations[5].pos);

  const arrayCore = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 12, 6), getMaterial('#7f8c8d', 0, 0, 0.8, 0.2, true));
  arrayCore.position.y = 6;
  s6.add(arrayCore);
  
  const innerCore = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 12, 6), getMaterial('#2c3e50'));
  innerCore.position.y = 6;
  s6.add(innerCore);

  world.createCollider(RAPIER.ColliderDesc.cylinder(6, 4), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s6.position.x, 6, s6.position.z)));

  const dishPivot = new THREE.Group();
  dishPivot.position.y = 12;
  
  const s6Dish = new THREE.Mesh(new THREE.CylinderGeometry(15, 2, 2, 16), getMaterial('#ecf0f1'));
  s6Dish.rotation.x = Math.PI / 2;
  s6Dish.position.z = 2;
  dishPivot.add(s6Dish);
  
  // Fix: Add collider for massive dish so ship bounces off
  const dQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2, 0, 0));
  world.createCollider(RAPIER.ColliderDesc.cylinder(1, 15).setRotation({x:dQ.x, y:dQ.y, z:dQ.z, w:dQ.w}), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s6.position.x, 12, s6.position.z + 2)));
  
  const s6Inner = new THREE.Mesh(new THREE.CylinderGeometry(10, 0.1, 0.5, 16), getMaterial('#3498db', '#3498db', 0.5));
  s6Inner.rotation.x = Math.PI / 2;
  s6Inner.position.z = 3;
  dishPivot.add(s6Inner);

  const s6Antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 10), getMaterial('#fff', '#fff', 2.0));
  s6Antenna.rotation.x = Math.PI / 2;
  s6Antenna.position.z = 8;
  dishPivot.add(s6Antenna);
  
  for(let i=0; i<3; i++) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 8), getMaterial('#7f8c8d'));
      const angle = (Math.PI*2/3)*i;
      strut.position.set(Math.cos(angle)*4, Math.sin(angle)*4, 6);
      strut.lookAt(0, 0, 10);
      dishPivot.add(strut);
  }
  
  s6.add(dishPivot);
  interactables.push({ mesh: dishPivot, speedX: 0, speedY: 0.8, speedZ: 0 });

  for(let i=0; i<6; i++) {
      const badgeMat = getMaterial('#1abc9c', '#1abc9c', 1.0);
      const badge = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.4, 4, 6), badgeMat);
      const angle = (Math.PI*2 / 6) * i;
      badge.position.set(Math.cos(angle)*20, 8 + Math.sin(angle*3)*3, Math.sin(angle)*20);
      s6.add(badge);
      interactables.push({ mesh: badge, speedX: 1, speedY: 1, speedZ: 1 });
      blinkers.push({ mat: badgeMat, speed: 3, baseInt: 0.5, maxInt: 2.0 });
  }
  scene.add(s6);


  // --- Station 7: Outro Base ---
  const s7 = new THREE.Group();
  s7.position.copy(stations[6].pos);
  
  const padMat7 = getMaterial('#2c3e50', 0, 0, 0.5, 0.4);
  const pad7 = new THREE.Mesh(new THREE.CylinderGeometry(18, 16, 1, 16), padMat7);
  pad7.position.y = -1;
  pad7.receiveShadow = true;
  s7.add(pad7);
  
  const rim7 = new THREE.Mesh(new THREE.CylinderGeometry(17.5, 14, 1, 16), getMaterial('#1a252f'));
  rim7.position.y = -2;
  rim7.receiveShadow = true;
  s7.add(rim7);

  for (let i = 0; i < 4; i++) {
      const strut = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), getMaterial('#7f8c8d'));
      const angle = (Math.PI / 2) * i;
      strut.position.set(Math.cos(angle) * 10, -3.5, Math.sin(angle) * 10);
      strut.rotation.x = Math.PI / 8;
      strut.lookAt(0, -3.5, 0);
      s7.add(strut);
  }

  world.createCollider(RAPIER.ColliderDesc.cylinder(1.5, 18), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s7.position.x, -1.5, s7.position.z)));

  const grid7 = new THREE.Mesh(new THREE.RingGeometry(5, 16, 16), new THREE.MeshBasicMaterial({ color: '#ffdfa0', wireframe: true, transparent: true, opacity: 0.3 }));
  grid7.rotation.x = -Math.PI / 2;
  grid7.position.y = -0.49;
  s7.add(grid7);

  const beaconGroup7 = new THREE.Group();
  beaconGroup7.position.set(0, 8, 0); 
  
  const s7Beacon = new THREE.Mesh(new THREE.IcosahedronGeometry(4, 2), getMaterial('#ffaa00', '#ffaa00', 3.0));
  beaconGroup7.add(s7Beacon);
  
  for(let i=1; i<=3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(4 + i*1.5, 0.15, 4, 32), getMaterial('#ffffff', '#ffaa00', 1.5));
      ring.rotation.x = Math.PI/2 + (Math.random()-0.5);
      ring.rotation.y = (Math.random()-0.5);
      beaconGroup7.add(ring);
      interactables.push({ mesh: ring, speedX: Math.random()*2, speedY: Math.random()*2, speedZ: Math.random()*2 });
  }
  s7.add(beaconGroup7);
  
  const s7BeaconBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 10, 8), getMaterial('#111111'));
  s7BeaconBase.position.set(0, 0, 0);
  s7.add(s7BeaconBase);

  world.createCollider(RAPIER.ColliderDesc.cylinder(5, 3), world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(s7.position.x, 0, s7.position.z)));
  scene.add(s7);

  // --- Physics Toys (Complex Debris - 2x detail) ---
  const toys = [];
  const toyMats = [
      getMaterial('#e67e22', 0, 0, 0.2, 0.8), // orange
      getMaterial('#3498db', 0, 0, 0.8, 0.2), // blue
      getMaterial('#95a5a6', 0, 0, 0, 1.0)    // gray asteroid
  ];

  function createToy(type, pos) {
      const group = new THREE.Group();
      let colliderDesc;
      
      if (type === 'canister') {
          // Complex Canister
          const bodyColor = toyMats[Math.floor(Math.random()*2)];
          const body = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3, 8), bodyColor);
          body.castShadow = true;
          body.receiveShadow = true;
          group.add(body);
          
          // Metal end caps
          const capGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.4, 8);
          const cap1 = new THREE.Mesh(capGeo, getMaterial('#7f8c8d', 0, 0, 0.8, 0.2));
          cap1.position.y = 1.4;
          group.add(cap1);
          const cap2 = new THREE.Mesh(capGeo, getMaterial('#7f8c8d', 0, 0, 0.8, 0.2));
          cap2.position.y = -1.4;
          group.add(cap2);
          
          // Glowing hazard stripe
          const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.3, 8), getMaterial('#f1c40f', '#f1c40f', 1.5));
          group.add(stripe);
          
          colliderDesc = RAPIER.ColliderDesc.cylinder(1.6, 1.3).setRestitution(0.5).setFriction(0.5).setMass(1);
          
      } else if (type === 'asteroid') {
          // Complex Asteroid
          const r = 2 + Math.random()*2;
          const geo = new THREE.DodecahedronGeometry(r, 0);
          const posAttr = geo.getAttribute('position');
          for(let i=0; i<posAttr.count; i++) {
              posAttr.setX(i, posAttr.getX(i) + (Math.random()-0.5)*0.8);
              posAttr.setY(i, posAttr.getY(i) + (Math.random()-0.5)*0.8);
              posAttr.setZ(i, posAttr.getZ(i) + (Math.random()-0.5)*0.8);
          }
          geo.computeVertexNormals();
          const rock = new THREE.Mesh(geo, toyMats[2]);
          rock.castShadow = true;
          rock.receiveShadow = true;
          group.add(rock);
          
          // Embedded glowing crystals
          for(let c=0; c<3; c++) {
              const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0), getMaterial('#ccff00', '#ccff00', 1.5));
              crystal.position.set((Math.random()-0.5)*r, (Math.random()-0.5)*r, (Math.random()-0.5)*r).normalize().multiplyScalar(r * 0.9);
              // align crystal outwards
              crystal.lookAt(0,0,0);
              group.add(crystal);
          }
          
          colliderDesc = RAPIER.ColliderDesc.ball(r * 1.1).setRestitution(0.2).setFriction(0.8).setMass(3);
          
      } else if (type === 'panel') {
          // Complex Solar Panel
          const base = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 5), getMaterial('#2c3e50', 0, 0, 0.2, 0.9));
          base.castShadow = true;
          group.add(base);
          
          // Grid overlay
          const grid = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6, 4, 4), getMaterial('#3498db', '#3498db', 0.5, 0, 0, true));
          grid.rotation.x = -Math.PI/2;
          grid.position.y = 0.16;
          group.add(grid);
          
          // Broken hinge mechanism
          const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 8), getMaterial('#7f8c8d'));
          hinge.rotation.z = Math.PI/2;
          hinge.position.set(0, 0, 2.5);
          group.add(hinge);
          
          colliderDesc = RAPIER.ColliderDesc.cuboid(2.5, 0.2, 2.7).setRestitution(0.3).setFriction(0.5).setMass(0.8);
      }

      scene.add(group);

      const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(pos.x, pos.y, pos.z)
          .setLinearDamping(0.2)
          .setAngularDamping(0.2);
      const body = world.createRigidBody(bodyDesc);
      world.createCollider(colliderDesc, body);

      toys.push({ mesh: group, body });
  }

  // Scatter toys
  for(let i=0; i<120; i++) {
      const t = Math.random() * 6; 
      const segment = Math.floor(t);
      const frac = t - segment;
      
      let px, pz;
      if (segment < 6) {
          px = THREE.MathUtils.lerp(stations[segment].pos.x, stations[segment+1].pos.x, frac);
          pz = THREE.MathUtils.lerp(stations[segment].pos.z, stations[segment+1].pos.z, frac);
      } else {
          px = stations[6].pos.x;
          pz = stations[6].pos.z;
      }
      
      px += (Math.random() - 0.5) * 80;
      pz += (Math.random() - 0.5) * 80;
      const py = (Math.random() - 0.5) * 20;

      const types = ['canister', 'canister', 'asteroid', 'asteroid', 'panel'];
      createToy(types[Math.floor(Math.random()*types.length)], new THREE.Vector3(px, py, pz));
  }


  // --- Spaceship ---
  const shipGroup = new THREE.Group();
  
  const shipHullMat = getMaterial('#ecf0f1');
  const accentMat = getMaterial('#e74c3c');
  const darkMat = getMaterial('#2c3e50');

  const fuselage = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), shipHullMat);
  fuselage.castShadow = true;
  shipGroup.add(fuselage);

  const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.5), darkMat);
  cockpit.position.set(0, 0.9, 0.5);
  shipGroup.add(cockpit);

  const wings = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 2), accentMat);
  wings.position.set(0, 0, -0.5);
  wings.castShadow = true;
  shipGroup.add(wings);
  
  const hlColor = '#ffffff';
  for (let i = -1; i <= 1; i += 2) {
      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.2), getMaterial(hlColor, hlColor, 3.0));
      bulb.position.set(i * 0.6, 0, 2.0);
      shipGroup.add(bulb);

      const spotLight = new THREE.SpotLight(0xffffff, 6.0, 200, Math.PI / 5, 0.6, 1);
      spotLight.position.set(i * 0.6, 0, 2.0);
      
      const targetObj = new THREE.Object3D();
      targetObj.position.set(i * 0.6, 0, 10.0);
      shipGroup.add(targetObj);
      spotLight.target = targetObj;
      
      spotLight.castShadow = true;
      spotLight.shadow.mapSize.width = 1024;
      spotLight.shadow.mapSize.height = 1024;
      
      shipGroup.add(spotLight);
  }

  const engineMesh = new THREE.Group(); 
  const glow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.5), getMaterial('#00ffff', '#00ffff', 2.0));
  glow.position.set(0, 0, -2.2);
  engineMesh.add(glow);

  const thrusterLight = new THREE.PointLight(0x00ffff, 4, 15);
  thrusterLight.position.set(0, 0, -2.5);
  engineMesh.add(thrusterLight);
  
  shipGroup.add(engineMesh);
  scene.add(shipGroup);

  const shipInitialPos = new THREE.Vector3(0, 5, 20);

  const shipBodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(shipInitialPos.x, shipInitialPos.y, shipInitialPos.z)
    .setLinearDamping(2.0)
    .setAngularDamping(5.0)
    .enabledTranslations(true, true, true)
    .enabledRotations(true, true, true)
    .setCcdEnabled(true);
    
  const shipBody = world.createRigidBody(shipBodyDesc);
  const shipCollider = RAPIER.ColliderDesc.cuboid(3, 0.5, 2).setRestitution(0.5).setFriction(0.5);
  world.createCollider(shipCollider, shipBody);

  // --- Controls & Interaction ---
  const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
  let isModalOpen = false;
  let canInteractWith = null;
  const interactBtn = document.getElementById('interact-btn');

  window.addEventListener('keydown', (e) => { 
      if(keys.hasOwnProperty(e.key)) keys[e.key] = true; 
      if(e.key === 'Escape') closeAllModals();
      if(e.key.toLowerCase() === 'e') triggerInteract();
  });
  window.addEventListener('keyup', (e) => { if(keys.hasOwnProperty(e.key)) keys[e.key] = false; });

  const touchJoystick = document.getElementById('touch-joystick');
  const touchBase = document.getElementById('touch-base');
  const touchKnob = document.getElementById('touch-knob');
  
  let touchId = null;
  let startX = 0;
  let startY = 0;

  if (touchJoystick) {
      touchJoystick.addEventListener('touchstart', (e) => {
          e.preventDefault();
          if (touchId !== null) return; 
          const touch = e.changedTouches[0];
          touchId = touch.identifier;
          startX = touch.clientX;
          startY = touch.clientY;
          
          touchBase.style.left = startX + 'px';
          touchBase.style.top = startY + 'px';
          touchKnob.style.left = startX + 'px';
          touchKnob.style.top = startY + 'px';
          
          touchBase.style.display = 'block';
          touchKnob.style.display = 'block';
      }, {passive: false});

      touchJoystick.addEventListener('touchmove', (e) => {
          e.preventDefault();
          if (touchId === null) return;
          
          let touch = null;
          for(let i=0; i<e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === touchId) {
                  touch = e.changedTouches[i];
                  break;
              }
          }
          if(!touch) return;

          const currentX = touch.clientX;
          const currentY = touch.clientY;
          const dx = currentX - startX;
          const dy = currentY - startY;

          const maxDist = 40;
          const distance = Math.sqrt(dx*dx + dy*dy);
          let knobX = currentX;
          let knobY = currentY;
          
          if (distance > maxDist) {
              const angle = Math.atan2(dy, dx);
              knobX = startX + Math.cos(angle) * maxDist;
              knobY = startY + Math.sin(angle) * maxDist;
          }
          touchKnob.style.left = knobX + 'px';
          touchKnob.style.top = knobY + 'px';

          keys.w = false; keys.s = false; keys.a = false; keys.d = false;
          
          const threshold = 15;
          if (dy < -threshold) keys.w = true;
          if (dy > threshold) keys.s = true;
          if (dx < -threshold) keys.a = true;
          if (dx > threshold) keys.d = true;
      }, {passive: false});

      const handleEnd = (e) => {
          e.preventDefault();
          if (touchId === null) return;
          for(let i=0; i<e.changedTouches.length; i++) {
              if (e.changedTouches[i].identifier === touchId) {
                  touchId = null;
                  keys.w = false; keys.s = false; keys.a = false; keys.d = false;
                  touchBase.style.display = 'none';
                  touchKnob.style.display = 'none';
                  break;
              }
          }
      };

      touchJoystick.addEventListener('touchend', handleEnd, {passive: false});
      touchJoystick.addEventListener('touchcancel', handleEnd, {passive: false});
  }

  if(interactBtn) {
      interactBtn.addEventListener('click', () => {
          triggerInteract();
      });
  }

  function triggerInteract() {
      if(canInteractWith && !isModalOpen) {
          const newEl = document.getElementById(`modal-${canInteractWith}`);
          if(newEl) {
              newEl.classList.add('visible');
              isModalOpen = true;
              document.body.classList.add('modal-open');
              shipBody.setLinvel({x:0, y:0, z:0}, true);
              shipBody.setAngvel({x:0, y:0, z:0}, true);
              if(interactBtn) interactBtn.classList.add('hidden');
          }
      }
  }

  document.querySelectorAll('.close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
          closeAllModals();
      });
  });

  function closeAllModals() {
      document.querySelectorAll('.modal').forEach(m => m.classList.remove('visible'));
      isModalOpen = false;
      document.body.classList.remove('modal-open');
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    if (window.innerWidth < 768) {
        cameraOffset.set(0, 80, 45);
    } else {
        cameraOffset.set(0, 50, 40);
    }
    const tempCam = new THREE.PerspectiveCamera();
    tempCam.position.copy(cameraOffset);
    tempCam.lookAt(0, 0, 0);
    camera.quaternion.copy(tempCam.quaternion);
  });

  setTimeout(() => {
    document.getElementById('loading').classList.add('hidden');
  }, 500);

  const clock = new THREE.Clock();
  
  function updateUI(shipPos) {
      let closestSector = null;
      let minDst = Infinity;

      for (const sector of stations) {
          const dst = shipPos.distanceTo(sector.pos);
          if (dst < sector.radius && dst < minDst) {
              minDst = dst;
              closestSector = sector.id;
          }
      }

      canInteractWith = closestSector;

      if(interactBtn) {
          if (canInteractWith && !isModalOpen) {
              interactBtn.classList.remove('hidden');
          } else {
              interactBtn.classList.add('hidden');
          }
      }
  }

  interactables.forEach(obj => {
     if (obj.bobSpeed) obj.baseY = obj.mesh.position.y; 
  });

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const time = clock.getElapsedTime();

    const up = keys.w || keys.ArrowUp;
    const down = keys.s || keys.ArrowDown;
    const left = keys.a || keys.ArrowLeft;
    const right = keys.d || keys.ArrowRight;

    if (up || down || left || right) {
        const welcomeEl = document.getElementById('welcome');
        if (welcomeEl && !welcomeEl.classList.contains('hidden')) {
            welcomeEl.classList.add('hidden');
        }
    }

    if (isModalOpen) {
        engineMesh.visible = false;
    } else {
        if (left) shipBody.applyTorqueImpulse({ x: 0, y: 7.5, z: 0 }, true);
        if (right) shipBody.applyTorqueImpulse({ x: 0, y: -7.5, z: 0 }, true);

        if (up || down) {
          const rot = shipBody.rotation();
          const q = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);
          const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(q); 
          
          const thrust = up ? 40 : -20;
          shipBody.applyImpulse({ x: forward.x * thrust, y: forward.y * thrust, z: forward.z * thrust }, true);
        }
        
        const currentRot = shipBody.rotation();
        const qShip = new THREE.Quaternion(currentRot.x, currentRot.y, currentRot.z, currentRot.w);
        const upVector = new THREE.Vector3(0, 1, 0).applyQuaternion(qShip);
        const correctionAxis = new THREE.Vector3().crossVectors(upVector, new THREE.Vector3(0, 1, 0));
        shipBody.applyTorqueImpulse({ 
            x: correctionAxis.x * 20, 
            y: correctionAxis.y * 20, 
            z: correctionAxis.z * 20 
        }, true);
        
        engineMesh.visible = up;
    }

    world.step();

    const shipPos = shipBody.translation();
    shipGroup.position.copy(shipPos);
    shipGroup.quaternion.copy(shipBody.rotation());

    const targetCamPos = new THREE.Vector3(shipPos.x, shipPos.y, shipPos.z).add(cameraOffset);
    camera.position.lerp(targetCamPos, 0.08);

    for (const t of toys) {
        t.mesh.position.copy(t.body.translation());
        t.mesh.quaternion.copy(t.body.rotation());
    }

    for (const obj of interactables) {
        if (obj.speedX) obj.mesh.rotation.x += obj.speedX * dt;
        if (obj.speedY) obj.mesh.rotation.y += obj.speedY * dt;
        if (obj.speedZ) obj.mesh.rotation.z += obj.speedZ * dt;
        
        if (obj.bobSpeed) {
            obj.mesh.position.y = obj.baseY + Math.sin(time * obj.bobSpeed) * obj.bobAmp;
        }
    }

    for (const blinker of blinkers) {
        blinker.mat.emissiveIntensity = blinker.baseInt + Math.abs(Math.sin(time * blinker.speed)) * (blinker.maxInt - blinker.baseInt);
    }

    starField.rotation.y = time * 0.005;
    starField.position.x = shipPos.x * 0.5;
    starField.position.z = shipPos.z * 0.5;

    updateUI(new THREE.Vector3(shipPos.x, shipPos.y, shipPos.z));

    renderer.render(scene, camera);
  }

  animate();
}

init().catch(console.error);
