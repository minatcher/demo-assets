/*--------------------
Setup
--------------------*/
console.clear();
const canvas = document.querySelector('#bubble');
let width = canvas.width = Math.max(Math.min(window.innerWidth, window.innerHeight), 800);
let height = canvas.height = width;
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true });

const scene = new THREE.Scene();
let camera;

const setup = () => {
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  renderer.setClearColor(0xffffff, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // renderer.shadowMapSoft = true;

  scene.fog = new THREE.Fog(0x000000, 10, 950);

  const aspectRatio = width / height;
  const fieldOfView = 100;
  const nearPlane = 0.1;
  const farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane);

  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = width > 575 ? 180 : 100;
};
setup();


/*--------------------
Lights
--------------------*/
let hemispshereLight, shadowLight, light2;
const createLights = () => {
  hemisphereLight = new THREE.HemisphereLight(0x666666, 0x000000);

  light2 = new THREE.AmbientLight(0xcae1ff);

  light3 = new THREE.PointLight( 0xcae1ff, 1, 0);
  light3.position.set(-300, 450, 300);

  scene.add(hemisphereLight);
  scene.add(light2);
  scene.add(light3);
};
createLights();


/*--------------------
Bubble
--------------------*/
const vertex = width > 575 ? 50 : 40;
const bubbleGeometry = new THREE.SphereGeometry(120, vertex, vertex);
let bubble;
let bubble2;
const createBubble = () => {

  const texture = new THREE.TextureLoader().load('https://minatcher.github.io/demo-assets/typo2.png');
  texture.offset.set(0.25, 0);

  const bubbleMaterial2 = new THREE.MeshPhysicalMaterial({
    transparent: true,
    opacity: 1,
    depthTest: false,
    depthWrite: false,
    side: THREE.FrontSide,
    emissive: 0x000000,
    emissiveIntensity: 0.5,
    map: texture,
    roughness: 0.15,
    // metalness: 0.2,
    reflectivity: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial2);
  bubble.castShadow = true;
  bubble.receiveShadow = false;

  scene.add(bubble);
  // scene.add(bubble2);
};
createBubble();

/*--------------------
Map
--------------------*/
const map = (num, in_min, in_max, out_min, out_max) => {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};


/*--------------------
Distance
--------------------*/
const distance = (a, b) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  return d;
};


/*--------------------
Mouse
--------------------*/
let cursor = new THREE.Vector3(-1, -1, 1);
let hoveredObj = [];

const setHoveredObj = (a, b) => {
  TweenMax.to(cursor, 0.4, {
    x: map(a, 0, canvas.offsetWidth, -1, 1),
    y: map(b, 0, canvas.offsetHeight, -1, 1),
    ease: Power2.easeOut });
  
  cursor.unproject(camera);
  const ray = new THREE.Raycaster(camera.position, cursor.sub(camera.position).normalize());
  hoveredObj = ray.intersectObjects([bubble]);
};

canvas.addEventListener('mousemove', (e) => {
  const x = e.offsetX ?? 0;
  const y = e.offsetY ?? 0;
  setHoveredObj(x, y);
});

canvas.addEventListener('touchmove', (e) => {
  const x = e.touches[0]?.clientX ?? 0;
  const y = e.touches[0]?.clientY ?? 0;
  setHoveredObj(x, y);
});

canvas.addEventListener('touchend', (e) => {
  cursor = new THREE.Vector3(-1, -1, 1);
  console.log('touch end');
  hoveredObj = [];
});

/*--------------------
Resize
--------------------*/
const onResize = () => {
  width = height = Math.max(Math.min(window.innerWidth, window.innerHeight), 800);
  // height = Math.min(window.innerWidth, window.innerHeight);
  camera.aspect = width / height;
  camera.position.z = width > 575 ? 180 : 100;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};
let resizeTm;
window.addEventListener('resize', function () {
  resizeTm = clearTimeout(resizeTm);
  resizeTm = setTimeout(onResize, 200);
});


/*--------------------
Noise
--------------------*/
const maxStrength =  0.15;
const position = bubbleGeometry.attributes.position.array;
let strength = 0;
// let prevDist = null;

const updateVertices = time => {
  if (hoveredObj.length > 0) {
    // const dist = distance(cursor, hoveredObj[0].object.position);
    if (strength < maxStrength) {
      strength += 0.001;
    }
    // prevDist = dist;
    // canvas.style.cursor = 'pointer';
  } else {
    if (strength > 0) strength -= 0.001;
    // prevDist = null;
    // canvas.style.cursor = 'auto';
  }

  let array = new Float32Array(position.length);
  for (let i = 0; i < position.length; i += 3) {
    const vector = new THREE.Vector3(position[i], position[i + 1], position[i + 2]);
    let perlin = noise.simplex3(
      vector.x * 0.006 + time * 0.0008,
      vector.y * 0.006 + time * 0.0008,
      vector.z * 0.006 + time * 0.0008);

    let ratio = perlin * 0.3 * (strength + 0.1) + 0.8;
    vector.multiplyScalar(ratio);
    array[i] = vector.x;
    array[i + 1] = vector.y;
    array[i + 2] = vector.z;
  }
  bubbleGeometry.setAttribute( 'position', new THREE.BufferAttribute(array, 3) );
  bubbleGeometry.attributes.position.needsUpdate = true;
};


/*--------------------
Animate
--------------------*/
const render = a => {
  requestAnimationFrame(render);
  updateVertices(a);
  renderer.clear();
  renderer.render(scene, camera);
};
requestAnimationFrame(render);
renderer.render(scene, camera);