// ===============================
// 1. シーン・カメラ・レンダラー
// ===============================
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);
camera.up.set(0, 0, 1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById("canvas-container").appendChild(renderer.domElement);

// ===============================
// 2. OrbitControls
// ===============================
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.rotateSpeed = 1.0;
controls.enablePan = false;

// ===============================
// 3. ライト
// ===============================
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(100, 100, 150);
scene.add(dir);

// ===============================
// 4. モデルグループ
// ===============================
const heartGroup = new THREE.Group();
scene.add(heartGroup);

let heartMesh = null;
let coronaryMesh = null;
let modelSize = 50;

// ===============================
// 5. 中心補正
// ===============================
function adjustGroupPosition() {
    const box = new THREE.Box3().setFromObject(heartGroup);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    heartGroup.position.sub(center);
    modelSize = Math.max(size.x, size.y, size.z) * 1.2;

    resetToFront();
}

// ===============================
// 6. 正面ビュー
// ===============================
function resetToFront() {
    camera.position.set(0, -modelSize * 1.8, modelSize * 0.2);
    controls.target.set(0, 0, 0);
    controls.update();
}

// ===============================
// 7. GLB読み込み (修正版)
// ===============================
const loader = new THREE.GLTFLoader(); 
let loaded = 0;

function checkLoaded() {
    loaded++;
    if (loaded === 2) adjustGroupPosition();
}

// ---- heart.glb ----
loader.load("models/heart.glb", gltf => {
    heartMesh = gltf.scene; 

    heartMesh.traverse(c => {
        if (c.isMesh) {
            // クローンを作るか、元のマテリアルのプロパティを直接書き換えます
            c.material = c.material.clone(); // 他のメッシュとの干渉を防ぐためクローン
            c.material.transparent = true;
            c.material.opacity = 0.3;
            c.material.color.setHex(0xffcccc); 
            
            // 【重要】裏面も描画するように設定（表示が欠けるのを防ぐ）
            c.material.side = THREE.DoubleSide; 
        }
    });

    heartGroup.add(heartMesh);
    checkLoaded();
}, undefined, error => {
    console.error("heart.glbの読み込みに失敗しました:", error);
});

// ---- coronary.glb ----
loader.load("models/coronary.glb", gltf => {
    coronaryMesh = gltf.scene; 

    coronaryMesh.traverse(c => {
        if (c.isMesh) {
            c.material = c.material.clone();
            c.material.transparent = true;
            c.material.opacity = 1.0;
            c.material.color.setHex(0xff0000); 
            c.material.side = THREE.DoubleSide;
        }
    });

    heartGroup.add(coronaryMesh);
    checkLoaded();
}, undefined, error => {
    console.error("coronary.glbの読み込みに失敗しました:", error);
});

// ===============================
// 8. 透明度スライダー
// ===============================
document.getElementById("heart-opacity").addEventListener("input", e => {
    const v = parseFloat(e.target.value);
    if (!heartMesh) return;
    heartMesh.traverse(c => { if (c.isMesh) c.material.opacity = v; });
});

document.getElementById("coronary-opacity").addEventListener("input", e => {
    const v = parseFloat(e.target.value);
    if (!coronaryMesh) return;
    coronaryMesh.traverse(c => { if (c.isMesh) c.material.opacity = v; });
});

// ===============================
// 9. 正面ボタン
// ===============================
document.getElementById("view-A").addEventListener("click", resetToFront);

// ===============================
// 10. 心臓 ON/OFF
// ===============================
document.getElementById("toggle-heart").addEventListener("click", () => {
    if (heartMesh) heartMesh.visible = !heartMesh.visible;
});

// ===============================
// 11. ラベル
// ===============================
const labelElements = [];

function createAhaLabel(name, x, y, z) {
    const pin = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    pin.position.set(x, y, z);
    scene.add(pin);

    const el = document.createElement("div");
    el.className = "html-label";
    el.innerText = name;
    document.body.appendChild(el);

    labelElements.push({ pin, el });
}

// ===============================
// 12. 座標
// ===============================
createAhaLabel("#1", -42, -12, 16);
createAhaLabel("#2", -59, -24, -12);
createAhaLabel("#3", -47, -12, -36);
createAhaLabel("#4AV", -13, 21, -40);
createAhaLabel("#4PD", -7.6, 6.6, -46);
createAhaLabel("#5", -3.9, 23, 34);
createAhaLabel("#6", 11, 7.6, 33);
createAhaLabel("#7", 21, -19, 26);
createAhaLabel("#8", 30, -51, -5);
createAhaLabel("#9", 28, 0, 32);
createAhaLabel("#10", 38, -35, 10);
createAhaLabel("#HL", 15, 20, 35.5);
createAhaLabel("#11", 11, 30, 24);
createAhaLabel("#12", 48, 30, -4.9);
createAhaLabel("#13", 26, 46, 0);
createAhaLabel("#14", 45, 25, -22);

// ===============================
// 13. ナビゲーションサイコロ
// ===============================
const cubeScene = new THREE.Scene();
const cubeCamera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
cubeCamera.position.set(0, 0, 40);

function makeFace(label, color, rotate = 0, flipX = false, flipY = false) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 256);

    ctx.save();
    ctx.translate(128, 128);

    if (rotate !== 0) ctx.rotate(rotate);
    if (flipX) ctx.scale(-1, 1);
    if (flipY) ctx.scale(1, -1);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 120px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 0);

    ctx.restore();

    return new THREE.CanvasTexture(c);
}

const navCube = new THREE.Mesh(
    new THREE.BoxGeometry(20, 20, 20),
    [
        new THREE.MeshBasicMaterial({ map: makeFace("L", "#1e88e5", -Math.PI / 2) }),
        new THREE.MeshBasicMaterial({ map: makeFace("R", "#43a047", Math.PI / 2) }),
        new THREE.MeshBasicMaterial({ map: makeFace("P", "#fdd835", Math.PI) }),
        new THREE.MeshBasicMaterial({ map: makeFace("A", "#fb8c00") }),
        new THREE.MeshBasicMaterial({ map: makeFace("H", "#e53935") }),
        new THREE.MeshBasicMaterial({ map: makeFace("F", "#8e24aa", 0, true, true) })
    ]
);

cubeScene.add(navCube);

// ===============================
// 14. リサイズ
// ===============================
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===============================
// 15. アニメーション
// ===============================
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    labelElements.forEach(l => {
        const wp = l.pin.position.clone().project(camera);
        if (wp.z > 1) { l.el.style.display = "none"; return; }
        l.el.style.display = "block";
        l.el.style.left = `${(wp.x * 0.5 + 0.5) * window.innerWidth}px`;
        l.el.style.top = `${(-(wp.y * 0.5) + 0.5) * window.innerHeight}px`;
    });

    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissorTest(false);
    renderer.render(scene, camera);

    navCube.quaternion.copy(camera.quaternion).invert();

    const size = 140;
    const margin = 10;
    const x = window.innerWidth - size - margin;
    const y = margin;

    renderer.setViewport(x, y, size, size);
    renderer.setScissor(x, y, size, size);
    renderer.setScissorTest(true);
    renderer.render(cubeScene, cubeCamera);

    renderer.setScissorTest(false);
}

animate();