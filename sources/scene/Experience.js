// ThreeJS modules 
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

// Scene Modules 
import { World } from './World.js';

class Experience {
    constructor(canvas) {
        this.canvas = canvas;

        this.loadingManager = new THREE.LoadingManager();

        this.gltfLoader = new GLTFLoader(this.loadingManager);
        this.skyLoader = new HDRLoader(this.loadingManager);

        this.controls = null;
        this._previousRAF = null;
        this.isDragging = false;

        // General Setup 
        this.createSetup();

        // World Scene 
        this.world = new World(this);

        // Utils 
        this.createLoadingManager();
        this.onWindowResize();
        this.setupDragListeners();
        this.animate();
    }

    createSetup() {
        this.scene = new THREE.Scene();

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.8;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor('#211d20');
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        document.body.appendChild(this.renderer.domElement);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Camera Setup (Aspect ratio for a square: 1)
        const fov = 60;
        const aspect = 1;
        const near = 0.1;
        const far = 100;

        // Main Camera (Center View)
        this.mainCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.mainCamera.position.set(2, 2, 5);

        // Camera 2 (Left View)
        this.cameraLeft = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.cameraLeft.position.set(-5, 5, 2);

        // Camera 3 (Right View)
        this.cameraRight = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.cameraRight.position.set(0, 7, 0);

        // Orbit Controls Setup
        this.controls = new OrbitControls(this.mainCamera, this.renderer.domElement);
        this.controls.enableDamping = true;

        // Limit Zoom/Distance
        this.controls.minDistance = 2;
        this.controls.maxDistance = 15;

        // Limit Vertical Rotation (Polar Angle)
        // this.controls.minPolarAngle = Math.PI / 4;
        // this.controls.maxPolarAngle = Math.PI - (Math.PI / 4);

        // Set initial active camera
        this.activeCamera = this.mainCamera;

        // Fog 
        const fogCOLOR = 0xBDB7B1;
        const nearFOG = 0.2;
        const farFOG = 50;

        this.scene.fog = new THREE.FogExp2(fogCOLOR, nearFOG, farFOG);

        // Background 

        this.backgroundTexture = this.skyLoader.load('./assets/puresky.hdr', function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
        });
        this.scene.background = this.backgroundTexture;

        // Hemisphere Light  

        this.hemisphereLight = new THREE.HemisphereLight(0xffeac7, 0x008532, 5);
        this.scene.add(this.hemisphereLight);
    }

    // --- MOUSE INTERACTION LOGIC ---

    setupDragListeners() {
        const domElement = this.renderer.domElement;

        domElement.addEventListener('mousedown', (event) => {
            this.isDragging = true;
            this.selectCameraByClick(event);
        }, false);

        domElement.addEventListener('mouseup', () => {
            this.isDragging = false;
        }, false);
    }

    selectCameraByClick(event) {
        const dragX = event.clientX;
        const width = window.innerWidth;

        let newCamera;

        // Determine the camera associated with the click location
        if (dragX < width / 3) {
            newCamera = this.cameraLeft;
        } else if (dragX < (width / 3) * 2) {
            newCamera = this.mainCamera;
        } else {
            newCamera = this.cameraRight;
        }

        if (newCamera !== this.activeCamera) {
            const oldCamera = this.activeCamera;

            // Switch the OrbitControls object
            this.controls.object = newCamera;
            this.activeCamera = newCamera;

            // Update controls
            this.controls.update();
            console.log(`Control locked onto: ${newCamera === this.cameraLeft ? 'Left' : newCamera === this.mainCamera ? 'Center' : 'Right'} Camera`);
        }
    }

    // --- ANIMATION AND RENDER LOOP ---

    animate() {
        requestAnimationFrame((t) => {
            if (this._previousRAF === null) {
                this._previousRAF = t;
            }

            this.animate();

            this.world.Update();

            this._Step(t - this._previousRAF);
            this._previousRAF = t;

            // --- VIEWPORT CALCULATIONS FOR CUBES ---

            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;

            const MARGIN = 20;
            const totalCubeWidth = windowWidth - (MARGIN * 4);
            const CUBE_SIZE = totalCubeWidth / 3;
            const startY = (windowHeight / 2) - (CUBE_SIZE / 2);

            this.renderer.setScissorTest(true);
            this.renderer.clear();

            // --- VIEWPORT 1: LEFT CUBE (cameraLeft) ---

            let x1 = MARGIN;
            let y1 = startY;
            let w1 = CUBE_SIZE;
            let h1 = CUBE_SIZE;

            this.renderer.setViewport(x1, y1, w1, h1);
            this.renderer.setScissor(x1, y1, w1, h1);

            this.cameraLeft.aspect = 1;
            this.cameraLeft.updateProjectionMatrix();

            this.renderer.render(this.scene, this.cameraLeft);

            // --- VIEWPORT 2: CENTER CUBE (mainCamera) ---

            let x2 = MARGIN * 2 + CUBE_SIZE;
            let y2 = startY;
            let w2 = CUBE_SIZE;
            let h2 = CUBE_SIZE;

            this.renderer.setViewport(x2, y2, w2, h2);
            this.renderer.setScissor(x2, y2, w2, h2);

            this.mainCamera.aspect = 1;
            this.mainCamera.updateProjectionMatrix();

            this.renderer.render(this.scene, this.mainCamera);

            // --- VIEWPORT 3: RIGHT CUBE (cameraRight) ---

            let x3 = MARGIN * 3 + CUBE_SIZE * 2;
            let y3 = startY;
            let w3 = CUBE_SIZE;
            let h3 = CUBE_SIZE;

            this.renderer.setViewport(x3, y3, w3, h3);
            this.renderer.setScissor(x3, y3, w3, h3);

            this.cameraRight.aspect = 1;
            this.cameraRight.updateProjectionMatrix();

            this.renderer.render(this.scene, this.cameraRight);

            this.renderer.setScissorTest(false);
        });
    }

    _Step() {
        // Only update controls if dragging is enabled, which ensures the active camera moves.
        if (this.controls) {
            this.controls.update();
        }
    }

    createLoadingManager() {
        this.loadingManager.onLoad = function () {
    const landingScreen = document.getElementById("landingScreen");
    if (landingScreen) { 
        landingScreen.style.opacity = "0"; 
        // Use a timeout to ensure the CSS transition finishes before hiding completely
        setTimeout(() => {
            landingScreen.style.visibility = "hidden";
        }, 1000); 
    }
}
    }

    onWindowResize() {
        window.addEventListener('resize', () => {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);
    }
};

export { Experience };