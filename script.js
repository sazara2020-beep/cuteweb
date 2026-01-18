let scene, camera, renderer, worldGroup, notebook;
let isDragging = false;
let rotationTarget = { x: 0.15, y: 0.4 };
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/**
 * Creates a dynamic canvas texture for the monitor screen
 * showing the "Harleys in Hawaii" music player.
 */
function createMonitorTexture() {
    const canvas = document.getElementById('monitor-canvas');
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, 512, 256);
    
    // Music Player UI
    ctx.fillStyle = '#1db954'; // Spotify-ish Green
    ctx.fillRect(20, 20, 160, 160); // Album Art Placeholder
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText('Harleys In Hawaii', 200, 60);
    
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '20px Inter, sans-serif';
    ctx.fillText('Katy Perry', 200, 95);
    
    // Progress Bar
    ctx.fillStyle = '#333333';
    ctx.fillRect(200, 140, 280, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(200, 140, 120, 6); // Progress
    
    // Play Controls
    ctx.beginPath();
    ctx.moveTo(330, 200);
    ctx.lineTo(330, 230);
    ctx.lineTo(355, 215);
    ctx.fill();
    
    return new THREE.CanvasTexture(canvas);
}

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a1005);
    
    camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    document.body.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const sunLight = new THREE.DirectionalLight(0xff7733, 2.0);
    sunLight.position.set(0, 6, -15); 
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const ambient = new THREE.AmbientLight(0xffccaa, 0.5);
    scene.add(ambient);

    const frontFill = new THREE.PointLight(0xffaa88, 0.2, 15);
    frontFill.position.set(0, 3, 5);
    scene.add(frontFill);

    createWorld();

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    
    document.addEventListener('mousedown', (e) => { 
        isDragging = true; 
        checkClick(e);
    });
    document.addEventListener('mouseup', () => isDragging = false);
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        rotationTarget.y += e.movementX * 0.003;
        rotationTarget.x += e.movementY * 0.003;
        rotationTarget.x = Math.max(-0.1, Math.min(0.5, rotationTarget.x));
    });
    
    animate();
}

function createWorld() {
    worldGroup = new THREE.Group();
    const oakMat = new THREE.MeshStandardMaterial({ color: 0xdbbe9d, roughness: 0.6 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.8 });
    const pinkMat = new THREE.MeshStandardMaterial({ color: 0xff8da1, roughness: 0.3, metalness: 0.1 }); 
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 1 });
    const deskBaseHeight = 0.8;

    // FLOOR
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -2; worldGroup.add(floor);

    // WALLS
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(17, 25), wallMat);
    leftWall.position.set(-11.75, 8, -6);
    worldGroup.add(leftWall);
    
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(17, 25), wallMat);
    rightWall.position.set(11.75, 8, -6);
    worldGroup.add(rightWall);

    const topWall = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 18), wallMat);
    topWall.position.set(0, 11.5, -6);
    worldGroup.add(topWall);

    const bottomWall = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 4), wallMat);
    bottomWall.position.set(0, 0, -6);
    worldGroup.add(bottomWall);

    // SUNSET
    const skyBack = new THREE.Mesh(new THREE.PlaneGeometry(100, 60), new THREE.MeshBasicMaterial({ color: 0xff4422 }));
    skyBack.position.set(0, 10, -25); worldGroup.add(skyBack);

    const sunsetSun = new THREE.Mesh(new THREE.CircleGeometry(4, 32), new THREE.MeshBasicMaterial({ color: 0xffcc44 }));
    sunsetSun.position.set(0, 4.5, -24.9); worldGroup.add(sunsetSun);

    const mountainGeo = new THREE.ConeGeometry(12, 10, 4);
    const mountainMat = new THREE.MeshBasicMaterial({ color: 0x1a0500 });
    for(let i=0; i<6; i++) {
        const mt = new THREE.Mesh(mountainGeo, mountainMat);
        mt.position.set(-20 + (i * 10), -2, -24.8);
        mt.scale.y = 0.4 + Math.random() * 0.6;
        worldGroup.add(mt);
    }

    // WINDOW
    const frame = new THREE.Mesh(new THREE.BoxGeometry(6.5, 5.2, 0.4), whiteMat);
    frame.position.set(0, 4.5, -6); worldGroup.add(frame);
    
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.8), new THREE.MeshPhysicalMaterial({
            roughness: 0, transmission: 1.0, thickness: 0.1, transparent: true, opacity: 0.2, color: 0xffccaa
    }));
    glass.position.set(0, 4.5, -5.9);
    worldGroup.add(glass);

    // LIFTED OBJECTS
    const liftedGroup = new THREE.Group();
    liftedGroup.position.y = deskBaseHeight;

    // DESK
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(8, 0.25, 4.5), oakMat);
    deskTop.receiveShadow = true; deskTop.castShadow = true;
    liftedGroup.add(deskTop);

    // MONITOR
    const monitorGroup = new THREE.Group();
    const monitorBody = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.6, 0.2), pinkMat);
    monitorBody.position.set(0, 2, -1.15);
    const monitorStand = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 0.1), pinkMat);
    monitorStand.position.set(0, 0.9, -1.2);
    const monitorBase = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 1.0), pinkMat);
    monitorBase.position.set(0, 0.125, -1.2); 
    
    // Screen with Texture
    const screenTex = createMonitorTexture();
    const monitorScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(4.5, 2.3), 
        new THREE.MeshBasicMaterial({ map: screenTex })
    );
    monitorScreen.position.set(0, 2, -1.04);
    monitorGroup.add(monitorBody, monitorStand, monitorBase, monitorScreen);
    liftedGroup.add(monitorGroup);

    // NOTEBOOK
    notebook = new THREE.Group();
    notebook.name = "notebook";
    const coverMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.7 });
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xfffef0 });
    const cover = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 1.5), coverMat);
    const pages = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 1.45), paperMat);
    pages.position.y = 0.05;
    notebook.add(cover, pages);
    notebook.position.set(-1.8, 0.2, 0.8);
    notebook.rotation.y = 0.4;
    liftedGroup.add(notebook);

    // --- LAMP WITH GOLDEN LIGHT ---
    const lampGroup = new THREE.Group();
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05), whiteMat);
    lampBase.position.set(-3.2, 0.13, 0.5);
    lampGroup.add(lampBase);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4), whiteMat);
    stem.position.set(-3.4, 1.2, 0.5);
    stem.rotation.z = 0.25;
    lampGroup.add(stem);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 16, 0, Math.PI*2, 0, Math.PI/2), whiteMat);
    head.position.set(-2.9, 2.3, 0.5);
    head.rotation.x = Math.PI;
    head.rotation.z = -0.5;
    lampGroup.add(head);

    // Glowing Bulb
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), new THREE.MeshBasicMaterial({color: 0xffea00}));
    bulb.position.set(-2.8, 2.15, 0.5);
    lampGroup.add(bulb);

    // Golden Point Light
    const lampLight = new THREE.PointLight(0xffcc00, 1.2, 6);
    lampLight.position.set(-2.8, 2.1, 0.5);
    lampLight.castShadow = true;
    lampGroup.add(lampLight);

    // Golden Spotlight
    const lampSpot = new THREE.SpotLight(0xffdd44, 2.0, 10, Math.PI/4, 0.5, 1);
    lampSpot.position.set(-2.8, 2.15, 0.5);
    lampSpot.target.position.set(-1.8, 0, 0.8);
    lampSpot.castShadow = true;
    lampGroup.add(lampSpot);
    lampGroup.add(lampSpot.target);

    liftedGroup.add(lampGroup);

    // MUG & PLANT
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.5, 16), new THREE.MeshStandardMaterial({color: 0x88aabb}));
    mug.position.set(2.2, 0.38, 1); liftedGroup.add(mug);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.4), new THREE.MeshStandardMaterial({color:0xdddddd}));
    pot.position.set(3, 0.3, -0.8); liftedGroup.add(pot);

    worldGroup.add(liftedGroup);
    scene.add(worldGroup);
}

function checkClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(worldGroup.children, true);
    for (let intersect of intersects) {
        let obj = intersect.object;
        while(obj.parent) {
            if(obj.name === "notebook") { openNotebook(); return; }
            obj = obj.parent;
        }
    }
}

function openNotebook() {
    document.getElementById('notebook-overlay').classList.add('active');
    rotationTarget.x = 0.5; rotationTarget.y = 0.1;
}

function closeNotebook() { document.getElementById('notebook-overlay').classList.remove('active'); }

function showPage(type) {
    document.getElementById('todo-page').classList.remove('active');
    document.getElementById('story-page').classList.remove('active');
    document.getElementById(type + '-page').classList.add('active');
}

function addTodo() {
    const input = document.getElementById('todo-input');
    if (!input.value.trim()) return;
    const li = document.createElement('li');
    li.innerHTML = `<span>${input.value}</span> <span class="del-task" onclick="this.parentElement.remove()">✕</span>`;
    document.getElementById('todo-list').appendChild(li);
    input.value = "";
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    worldGroup.rotation.y += (rotationTarget.y - worldGroup.rotation.y) * 0.05;
    worldGroup.rotation.x += (rotationTarget.x - worldGroup.rotation.x) * 0.05;
    if (notebook) { notebook.position.y = 0.18 + Math.sin(Date.now() * 0.002) * 0.02; }
    renderer.render(scene, camera);
}

// Start everything on load
window.onload = init;