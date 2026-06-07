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
    camera.position.set(0, -modelSize * 1.3, modelSize * 0.2);
    controls.target.set(0, 0, 0);
    controls.update();
}

// ===============================
// 7. OBJ読み込み
// ===============================
const loader = new THREE.OBJLoader();
let loaded = 0;

function checkLoaded() {
    loaded++;
    if (loaded === 2) adjustGroupPosition();
}

loader.load("models/heart.obj", obj => {
    heartMesh = obj;
    obj.traverse(c => {
        if (c.isMesh) {
            c.material = new THREE.MeshStandardMaterial({
                color: 0xffcccc,
                transparent: true,
                opacity: 0.3
            });
        }
    });
    heartGroup.add(obj);
    checkLoaded();
});

loader.load("models/coronary.obj", obj => {
    coronaryMesh = obj;
    obj.traverse(c => {
        if (c.isMesh) {
            c.material = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                transparent: true,
                opacity: 1.0
            });
        }
    });
    heartGroup.add(obj);
    checkLoaded();
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
// 11. ラベル（ピンあり）
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
// 12. あなたの座標
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
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
// ===============================
// 13. ナビゲーションサイコロ（AとPの上下反転を解除版）
// ===============================
const cubeScene = new THREE.Scene();
const cubeCamera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
cubeCamera.position.set(0, 0, 40);

// ★ 文字の回転・反転に対応した makeFace()
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

/*
Three.js BoxGeometry の面の順番：
 0: +X（右）
 1: -X（左）
 2: +Y（奥）
 3: -Y（手前）
 4: +Z（上）
 5: -Z（下）

あなたの表記ルール：
 +X → L
 -X → R
 +Y → P（Superior）
 -Y → A（Inferior）
 +Z → H（Front）
 -Z → F（Back）

今回の調整：
 A：上下反転 → 解除（flipY=false）
 P：上下反転 → 解除（flipY=false）
 F：左右反転 → 維持（flipX=true）
 R：+90°回転 → 維持
 L：-90°回転 → 維持
*/

const navCube = new THREE.Mesh(
    new THREE.BoxGeometry(20, 20, 20),
    [
        // +X → L（右側） → -90°回転
        new THREE.MeshBasicMaterial({
            map: makeFace("L", "#1e88e5", -Math.PI / 2)
        }),

        // -X → R（左側） → +90°回転
        new THREE.MeshBasicMaterial({
            map: makeFace("R", "#43a047", Math.PI / 2)
        }),

        // +Y → P（Superior） → ★180°回転で上下を正す★
        new THREE.MeshBasicMaterial({
            map: makeFace("P", "#fdd835", Math.PI)
        }),

           // -Y → A（Inferior） → ★上下反転なし★
        new THREE.MeshBasicMaterial({
            map: makeFace("A", "#fb8c00")
        }),

        // +Z → H（Front） → そのまま
        new THREE.MeshBasicMaterial({
            map: makeFace("H", "#e53935")
        }),

        // -Z → F（Back） → 左右反転
        new THREE.MeshBasicMaterial({
            map: makeFace("F", "#8e24aa", 0, true,true)
        })
    ]
);


cubeScene.add(navCube);

// ★ 医療ビューア方式：カメラの逆回転を適用
function updateCubeRotation() {
    navCube.quaternion.copy(camera.quaternion).invert();
}

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

    // ラベル追従
    labelElements.forEach(l => {
        const wp = l.pin.position.clone().project(camera);
        if (wp.z > 1) { l.el.style.display = "none"; return; }
        l.el.style.display = "block";
        l.el.style.left = `${(wp.x * 0.5 + 0.5) * window.innerWidth}px`;
        l.el.style.top = `${(-(wp.y * 0.5) + 0.5) * window.innerHeight}px`;
    });

    // ★ メインビュー描画
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissorTest(false);
    renderer.render(scene, camera);

    // ★ サイコロの向きをカメラの逆回転に同期（医療ビューア方式）
    navCube.quaternion.copy(camera.quaternion).invert();

    // ★ 右下サイコロ描画
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
