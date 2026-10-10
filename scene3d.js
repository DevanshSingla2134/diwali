/**
 * scene3d.js - Complete Three.js 3D Festive Diwali World
 * Features:
 * - 3D Terracotta Sacred Diya with multi-layer animated flickering flame
 * - Voice-reactive flame dynamics (swells and radiates with microphone input)
 * - 3D Floating Sky Lanterns (Akash Deep)
 * - 3D Rotating Sacred Floor Rangoli
 * - 3D Particle Fireworks & Rocket Launcher with physics
 * - Dynamic Starfield and warm golden lighting
 */

class Diwali3DWorld {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // Diya & Flame objects
    this.diyaGroup = null;
    this.flameGroup = null;
    this.flameCore = null;
    this.flameOuter = null;
    this.flameLight = null;
    this.isDiyaLit = true;
    this.baseFlameScale = 1.0;

    // Lanterns & Decor
    this.lanterns = [];
    this.rangoliMesh = null;
    this.embers = null;

    // Fireworks
    this.rockets = [];
    this.fireworkParticles = [];

    // Raycaster for sky & diya interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init();
  }

  init() {
    // 1. Scene & Deep Nocturnal Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0316);
    this.scene.fog = new THREE.FogExp2(0x0a0316, 0.012);

    // 2. Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 1000);
    this.camera.position.set(0, 7.5, 17);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (window.THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't go deep beneath floor
      this.controls.minDistance = 6;
      this.controls.maxDistance = 45;
      this.controls.target.set(0, 1.8, 0);
    }

    // 5. Lighting Setup
    this.setupLighting();

    // 6. Build Scene Elements
    this.createStarfield();
    this.createFloorAndRangoli();
    this.create3DDiya();
    this.createEmbers();
    this.createSkyLanterns(28);

    // 7. Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    this.renderer.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));

    // 8. Start Animation Loop
    this.animate();
  }

  setupLighting() {
    // Ambient soft nocturnal indigo light
    const ambientLight = new THREE.AmbientLight(0x2d174d, 0.8);
    this.scene.add(ambientLight);

    // Gentle celestial moonlight from above
    const moonLight = new THREE.DirectionalLight(0xa5b4fc, 0.5);
    moonLight.position.set(10, 30, -15);
    this.scene.add(moonLight);
  }

  createStarfield() {
    const starCount = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 90 + Math.random() * 40;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 5; // Keep mostly in upper hemisphere
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Warm golden, amber, and silver-white stars
      const isGold = Math.random() > 0.4;
      colors[i * 3] = isGold ? 1.0 : 0.85;
      colors[i * 3 + 1] = isGold ? 0.85 + Math.random() * 0.15 : 0.9;
      colors[i * 3 + 2] = isGold ? 0.3 : 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  createFloorAndRangoli() {
    // Floor plane
    const floorGeo = new THREE.PlaneGeometry(160, 160);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x090314,
      roughness: 0.85,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.05;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Sacred Rangoli Mandala disc texture generated procedurally
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const cx = 512, cy = 512;

    // Draw intricate Rangoli Mandala
    ctx.clearRect(0, 0, 1024, 1024);

    // Glowing concentric rings
    const drawRing = (r, color, width = 3) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    };

    drawRing(480, 'rgba(255, 215, 0, 0.8)', 6);
    drawRing(450, 'rgba(255, 105, 180, 0.7)', 3);
    drawRing(380, 'rgba(255, 215, 0, 0.6)', 4);
    drawRing(300, 'rgba(255, 69, 0, 0.75)', 4);
    drawRing(220, 'rgba(255, 215, 0, 0.9)', 5);
    drawRing(140, 'rgba(255, 140, 0, 0.85)', 4);

    // 16 Petals Lotus mandala pattern
    const petals = 16;
    for (let i = 0; i < petals; i++) {
      const angle = (i * Math.PI * 2) / petals;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);

      // Outer petal
      ctx.beginPath();
      ctx.moveTo(0, -180);
      ctx.quadraticCurveTo(60, -320, 0, -450);
      ctx.quadraticCurveTo(-60, -320, 0, -180);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 170, 0, 0.25)' : 'rgba(220, 20, 60, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner ornate teardrop
      ctx.beginPath();
      ctx.moveTo(0, -90);
      ctx.quadraticCurveTo(35, -170, 0, -250);
      ctx.quadraticCurveTo(-35, -170, 0, -90);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.fill();
      ctx.stroke();

      // Mini Diyas on outer rim
      ctx.beginPath();
      ctx.arc(0, -465, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#ffdf00';
      ctx.fill();

      ctx.restore();
    }

    const rangoliTexture = new THREE.CanvasTexture(canvas);
    const rangoliGeo = new THREE.CircleGeometry(7.2, 64);
    const rangoliMat = new THREE.MeshBasicMaterial({
      map: rangoliTexture,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.rangoliMesh = new THREE.Mesh(rangoliGeo, rangoliMat);
    this.rangoliMesh.rotation.x = -Math.PI / 2;
    this.rangoliMesh.position.set(0, 0.02, 0);
    this.scene.add(this.rangoliMesh);
  }

  create3DDiya() {
    this.diyaGroup = new THREE.Group();
    this.diyaGroup.position.set(0, 0, 0);

    // 1. Terracotta Diya Lathe Body (traditional rounded earthen oil lamp)
    const points = [];
    points.push(new THREE.Vector2(0.0, 0.0));
    points.push(new THREE.Vector2(1.2, 0.05));
    points.push(new THREE.Vector2(2.1, 0.4));
    points.push(new THREE.Vector2(2.7, 0.9));
    points.push(new THREE.Vector2(2.8, 1.4));
    points.push(new THREE.Vector2(2.4, 1.55));
    points.push(new THREE.Vector2(1.9, 1.35));
    points.push(new THREE.Vector2(1.2, 0.8));
    points.push(new THREE.Vector2(0.0, 0.65));

    const diyaGeo = new THREE.LatheGeometry(points, 48);
    // Terracotta clay material with golden rim sheen
    const diyaMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412,     // Terracotta rich clay
      roughness: 0.45,
      metalness: 0.25,
      emissive: 0x431407,
      emissiveIntensity: 0.2
    });
    const diyaMesh = new THREE.Mesh(diyaGeo, diyaMat);
    diyaMesh.castShadow = true;
    diyaMesh.receiveShadow = true;
    this.diyaGroup.add(diyaMesh);

    // 2. Golden rim edge trim
    const rimGeo = new THREE.TorusGeometry(2.65, 0.08, 16, 48);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0xb45309,
      emissiveIntensity: 0.3
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 1.45;
    this.diyaGroup.add(rimMesh);

    // 3. Sacred Oil pool inside Diya
    const oilGeo = new THREE.CylinderGeometry(1.95, 1.5, 0.15, 32);
    const oilMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.1,
      metalness: 0.7,
      transparent: true,
      opacity: 0.95
    });
    const oilMesh = new THREE.Mesh(oilGeo, oilMat);
    oilMesh.position.y = 1.0;
    this.diyaGroup.add(oilMesh);

    // 4. Cotton Wick
    const wickGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.7, 12);
    const wickMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f });
    const wickMesh = new THREE.Mesh(wickGeo, wickMat);
    wickMesh.position.set(0, 1.25, 0.35);
    wickMesh.rotation.x = 0.2;
    this.diyaGroup.add(wickMesh);

    // 5. Multi-Layer Animated Sacred Flame
    this.flameGroup = new THREE.Group();
    this.flameGroup.position.set(0, 1.6, 0.42);

    // Flame Core (White-gold heat)
    const coreGeo = new THREE.ConeGeometry(0.22, 1.1, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
      transparent: true,
      opacity: 0.95
    });
    this.flameCore = new THREE.Mesh(coreGeo, coreMat);
    this.flameCore.position.y = 0.55;
    this.flameGroup.add(this.flameCore);

    // Flame Middle (Warm Radiant Amber)
    const midGeo = new THREE.ConeGeometry(0.42, 1.45, 16);
    const midMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    this.flameMid = new THREE.Mesh(midGeo, midMat);
    this.flameMid.position.y = 0.7;
    this.flameGroup.add(this.flameMid);

    // Flame Outer Glow (Fiery Vermilion Red-Orange)
    const outGeo = new THREE.ConeGeometry(0.65, 1.85, 16);
    const outMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending
    });
    this.flameOuter = new THREE.Mesh(outGeo, outMat);
    this.flameOuter.position.y = 0.85;
    this.flameGroup.add(this.flameOuter);

    // Dynamic Golden Point Light from Flame
    this.flameLight = new THREE.PointLight(0xffaa00, 3.8, 16);
    this.flameLight.position.set(0, 0.8, 0);
    this.flameLight.castShadow = true;
    this.flameLight.shadow.bias = -0.002;
    this.flameGroup.add(this.flameLight);

    this.diyaGroup.add(this.flameGroup);
    this.scene.add(this.diyaGroup);
  }

  createEmbers() {
    // Rising sparks from the sacred flame
    const emberCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);
    this.emberSpeeds = [];

    for (let i = 0; i < emberCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 1] = 1.8 + Math.random() * 3.5;
      positions[i * 3 + 2] = 0.4 + (Math.random() - 0.5) * 0.8;

      this.emberSpeeds.push({
        vy: 0.02 + Math.random() * 0.03,
        vx: (Math.random() - 0.5) * 0.015,
        vz: (Math.random() - 0.5) * 0.015
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.35,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.embers = new THREE.Points(geometry, material);
    this.scene.add(this.embers);
  }

  createSkyLanterns(count = 25) {
    const lanternGeo = new THREE.CylinderGeometry(0.55, 0.42, 1.1, 8);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xff7700,
      emissive: 0xffaa00,
      emissiveIntensity: 1.2,
      roughness: 0.3,
      transparent: true,
      opacity: 0.92
    });

    for (let i = 0; i < count; i++) {
      const lantern = new THREE.Mesh(lanternGeo, lanternMat);

      // Random position spread across the festive sky
      lantern.position.set(
        (Math.random() - 0.5) * 70,
        4 + Math.random() * 35,
        (Math.random() - 0.5) * 60 - 10
      );

      // Sway drift properties
      lantern.userData = {
        floatSpeed: 0.015 + Math.random() * 0.02,
        swaySpeed: 1 + Math.random() * 2,
        swayRange: 0.015 + Math.random() * 0.02,
        origX: lantern.position.x,
        origZ: lantern.position.z,
        timeOffset: Math.random() * 100
      };

      this.lanterns.push(lantern);
      this.scene.add(lantern);
    }
  }

  // Release extra burst of 15 sky lanterns upwards
  releaseExtraLanterns() {
    this.createSkyLanterns(15);
    if (window.confetti) {
      window.confetti({
        particleCount: 50,
        spread: 90,
        origin: { y: 0.8 },
        colors: ['#ffd700', '#ff6b00', '#ff007f']
      });
    }
  }

  // Interactive Firework Launch to target 3D Vector
  launchRocket(targetPos) {
    if (!targetPos) {
      targetPos = new THREE.Vector3(
        (Math.random() - 0.5) * 35,
        15 + Math.random() * 18,
        (Math.random() - 0.5) * 25 - 5
      );
    }

    const startPos = new THREE.Vector3(
      targetPos.x * 0.3 + (Math.random() - 0.5) * 4,
      0.1,
      targetPos.z * 0.3 + (Math.random() - 0.5) * 4
    );

    // Rocket head
    const rocketGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const rocketMat = new THREE.MeshBasicMaterial({ color: 0xffe066 });
    const rocketMesh = new THREE.Mesh(rocketGeo, rocketMat);
    rocketMesh.position.copy(startPos);
    this.scene.add(rocketMesh);

    // Audio whoosh
    if (window.festiveAudio) {
      window.festiveAudio.playRocketWhoosh();
    }

    this.rockets.push({
      mesh: rocketMesh,
      start: startPos,
      target: targetPos,
      progress: 0,
      speed: 0.025 + Math.random() * 0.015
    });
  }

  // Create Explosion at position
  explodeFirework(pos) {
    // Play explosion sound
    if (window.festiveAudio) {
      window.festiveAudio.playExplosion();
    }

    // Flash light at explosion center
    const flash = new THREE.PointLight(0xffeedd, 5, 25);
    flash.position.copy(pos);
    this.scene.add(flash);
    setTimeout(() => this.scene.remove(flash), 120);

    // Color palettes for fireworks (Gold, Crimson, Magenta, Cyan, Lime)
    const colorThemes = [0xffd700, 0xff007f, 0x00f5ff, 0xff4500, 0x39ff14, 0xffaa00];
    const burstColor = colorThemes[Math.floor(Math.random() * colorThemes.length)];

    const pCount = 140;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);
    const velocities = [];

    for (let i = 0; i < pCount; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      // Spherical dispersion velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 0.2 + Math.random() * 0.45;

      velocities.push({
        x: speed * Math.sin(phi) * Math.cos(theta),
        y: speed * Math.sin(phi) * Math.sin(theta),
        z: speed * Math.cos(phi)
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: burstColor,
      size: 0.65,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    this.fireworkParticles.push({
      points: particles,
      velocities: velocities,
      life: 1.0,
      decay: 0.016 + Math.random() * 0.008
    });

    // Also trigger canvas confetti burst
    if (window.confetti && Math.random() > 0.5) {
      window.confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.5 }
      });
    }
  }

  // Toggle Diya lit state
  toggleDiya() {
    this.isDiyaLit = !this.isDiyaLit;
    if (this.flameGroup) {
      this.flameGroup.visible = this.isDiyaLit;
    }
    if (this.isDiyaLit) {
      if (window.festiveAudio) window.festiveAudio.playBell(659.25);
      this.explodeFirework(new THREE.Vector3(0, 4.5, 0.4));
    }
    return this.isDiyaLit;
  }

  // Pointer Down Interaction (diya click or sky fireworks)
  onPointerDown(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check intersection with Diya
    if (this.diyaGroup) {
      const intersects = this.raycaster.intersectObjects(this.diyaGroup.children, true);
      if (intersects.length > 0) {
        this.toggleDiya();
        return;
      }
    }

    // Otherwise launch firework to sky position
    const distance = 25;
    const target = new THREE.Vector3();
    this.raycaster.ray.at(distance, target);
    target.y = Math.max(target.y, 8); // Ensure it detonates in sky
    this.launchRocket(target);
  }

  onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Main Render & Physics Loop
  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // 1. Controls update
    if (this.controls) this.controls.update();

    // 2. Rotate Rangoli slowly
    if (this.rangoliMesh) {
      this.rangoliMesh.rotation.z = time * 0.08;
    }

    // 3. Flame flickering + Voice reactivity
    if (this.flameGroup && this.isDiyaLit) {
      // Check microphone voice amplitude if active
      let micBoost = 1.0;
      if (window.micAmplitude && window.micAmplitude > 0.02) {
        micBoost = 1.0 + Math.min(window.micAmplitude * 3.5, 2.5);
      }

      const flicker = 1.0 + Math.sin(time * 18.0) * 0.08 + Math.cos(time * 31.0) * 0.05;
      const targetScaleY = flicker * micBoost;
      const targetScaleXZ = (1.0 + Math.sin(time * 12.0) * 0.05) * Math.sqrt(micBoost);

      this.flameGroup.scale.set(targetScaleXZ, targetScaleY, targetScaleXZ);

      // Flame tilt with gentle wind
      this.flameGroup.rotation.z = Math.sin(time * 4.0) * 0.08;
      this.flameGroup.rotation.x = Math.cos(time * 3.5) * 0.06;

      // Dynamic light intensity
      if (this.flameLight) {
        this.flameLight.intensity = (3.5 + Math.sin(time * 25.0) * 0.7) * micBoost;
      }
    }

    // 4. Update Embers
    if (this.embers && this.isDiyaLit) {
      const positions = this.embers.geometry.attributes.position.array;
      for (let i = 0; i < positions.length / 3; i++) {
        const s = this.emberSpeeds[i];
        positions[i * 3] += s.vx;
        positions[i * 3 + 1] += s.vy;
        positions[i * 3 + 2] += s.vz;

        // Reset if drifted too high
        if (positions[i * 3 + 1] > 6.0) {
          positions[i * 3] = (Math.random() - 0.5) * 0.8;
          positions[i * 3 + 1] = 1.8;
          positions[i * 3 + 2] = 0.4 + (Math.random() - 0.5) * 0.8;
        }
      }
      this.embers.geometry.attributes.position.needsUpdate = true;
    }

    // 5. Update Sky Lanterns
    for (let lantern of this.lanterns) {
      const u = lantern.userData;
      lantern.position.y += u.floatSpeed;
      lantern.position.x = u.origX + Math.sin(time * u.swaySpeed + u.timeOffset) * u.swayRange * 10;
      lantern.position.z = u.origZ + Math.cos(time * u.swaySpeed + u.timeOffset) * u.swayRange * 10;
      lantern.rotation.y = time * 0.2;

      // Respawn at bottom if too high
      if (lantern.position.y > 45) {
        lantern.position.y = 2;
      }
    }

    // 6. Update Rocket Physics
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.progress += r.speed;

      r.mesh.position.lerpVectors(r.start, r.target, r.progress);

      if (r.progress >= 1.0) {
        this.explodeFirework(r.target);
        this.scene.remove(r.mesh);
        this.rockets.splice(i, 1);
      }
    }

    // 7. Update Firework Particle Bursts
    for (let i = this.fireworkParticles.length - 1; i >= 0; i--) {
      const fw = this.fireworkParticles[i];
      fw.life -= fw.decay;
      fw.points.material.opacity = Math.max(0, fw.life);

      const positions = fw.points.geometry.attributes.position.array;
      for (let j = 0; j < fw.velocities.length; j++) {
        const vel = fw.velocities[j];
        positions[j * 3] += vel.x;
        positions[j * 3 + 1] += vel.y;
        positions[j * 3 + 2] += vel.z;

        // Apply gravity & air drag
        vel.y -= 0.007; // Gravity
        vel.x *= 0.985;
        vel.y *= 0.985;
        vel.z *= 0.985;
      }
      fw.points.geometry.attributes.position.needsUpdate = true;

      if (fw.life <= 0) {
        this.scene.remove(fw.points);
        this.fireworkParticles.splice(i, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Global 3D World instance
window.diwaliWorld = null;
