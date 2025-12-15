import * as THREE from 'three';

class World {
    constructor(experience) {
        this.experience = experience;

        this.experience.gltfLoader.setPath('assets/');
        this.clock = new THREE.Clock();

        // Array to Store Meshes 
        this.roadTiles = [];
        this.centerLines = [];
        this.barrierLines = [];
        this.streetLights = [];
        this.roadBarriers = [];

        // ADDED: Terrain Tile Arrays
        this.leftTerrainTiles = [];
        this.rightTerrainTiles = [];

        // Initializing
        // this.loadScooter();
        this.loadMoi();
        this.loadStreetLight();
        this.createRoadTiles();
        this.loadRoadBarrier();
        
        // CALL THE NEW TILING FUNCTION
        this.createTiledTerrainSide('left');
        this.createTiledTerrainSide('right');
    }

    loadScooter() {
        this.experience.gltfLoader.load(
            '/scooter.glb',
            (gltf) => {
                console.log('SUCCESS: Scooter model loaded!');

                const box = new THREE.Box3().setFromObject(gltf.scene);
                const size = box.getSize(new THREE.Vector3());
                console.log(`\n--- SCOOTER DIMENSIONS ---`);
                console.log(`X (Width): ${size.x.toFixed(2)} units`);
                console.log(`Y (Height): ${size.y.toFixed(2)} units`);
                console.log(`Z (Depth): ${size.z.toFixed(2)} units`);
                console.log(`-------------------------\n`);

                const scaleFactor = 0.003;
                gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
                gltf.scene.position.y = 0.6;

                this.scooter = gltf.scene;  // store reference
                this.experience.scene.add(this.scooter);
            },
            undefined,
            (error) => {
                console.error('CRITICAL ERROR: Failed to load scooter model.', error);
            }
        );
    }

    loadMoi() {
        this.experience.gltfLoader.load(
            'meonmoped.glb',
            (gltf) => {
                console.log('SUCCESS: Scooter model loaded!');

                const box = new THREE.Box3().setFromObject(gltf.scene);
                const size = box.getSize(new THREE.Vector3());
                console.log(`\n--- SCOOTER DIMENSIONS ---`);
                console.log(`X (Width): ${size.x.toFixed(2)} units`);
                console.log(`Y (Height): ${size.y.toFixed(2)} units`);
                console.log(`Z (Depth): ${size.z.toFixed(2)} units`);
                console.log(`-------------------------\n`);

                const scaleFactor = 0.5;
                gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
                gltf.scene.position.y = 0.6;

                this.scooter = gltf.scene;  // store reference
                this.experience.scene.add(this.scooter);
            },
            undefined,
            (error) => {
                console.error('CRITICAL ERROR: Failed to load scooter model.', error);
            }
        );
    }

    createRoadTiles() {
        const textureLoader = new THREE.TextureLoader();

        // Load all textures
        const concreteBaseColor = textureLoader.load('/assets/concreteBaseColor.png');
        const concreteNormalMap = textureLoader.load('/assets/concreteNormalMap.png');
        const concreteHeightMap = textureLoader.load('/assets/concreteHeightMap.png');
        const concreteRoughnessMap = textureLoader.load('/assets/concreteRoughnessMap.png');
        const concreteAmbientOcclusion = textureLoader.load('/assets/concreteAmbientOcclusionMap.png');

        // Set wrapping for the tile and ensure texture repetition is set for tiling
        concreteBaseColor.wrapS = THREE.RepeatWrapping;
        concreteBaseColor.wrapT = THREE.RepeatWrapping;
        concreteBaseColor.repeat.set(2, 4);

        this.roadTileLength = 30; // FIX: Defined tile length as a class property

        // Use PlaneGeometry for a flat tile, using the defined tile length
        this.roadTileLength = this.roadTileLength; // Use class property
        this.roadTileGeometry = new THREE.PlaneGeometry(7, this.roadTileLength, 1, 1);

        this.roadTileMaterial = new THREE.MeshStandardMaterial({
            color: 0x5E5D5B,
            map: concreteBaseColor,
            normalMap: concreteNormalMap,
            displacementMap: concreteHeightMap,
            roughnessMap: concreteRoughnessMap,
            aoMap: concreteAmbientOcclusion,
            side: THREE.DoubleSide,
        });

        const overlapAmount = 0.05;

        // --- Road Tile Creation ---
        // Creates 30 segments to make the visible road very long.
        for (let i = 0; i < 30; i++) {
            this.roadTile = new THREE.Mesh(this.roadTileGeometry, this.roadTileMaterial);
            // Positioned with a slight overlap to prevent gaps
            this.roadTile.position.z = -i * (this.roadTileLength - overlapAmount);
            this.roadTile.rotation.x = -Math.PI * 0.5;
            this.roadTiles.push(this.roadTile);
            this.experience.scene.add(this.roadTile);
        }

        // Yellow Center Line

        const centerLineGeometry = new THREE.PlaneGeometry(0.075, this.roadTileLength, 1, 1);
        const centerLineMaterial = new THREE.MeshBasicMaterial({ color: 0xbd8311 }); // Bright Yellow
        const groundOffset = 0.6; // Lift off the ground to prevent Z-fighting (flickering)
        const gapCenter = 0.1; // Horizontal separation from center (0.4 units total gap)


        for (let i = 0; i < 200; i++) {
            const zPos = -i * (this.roadTileLength - overlapAmount);

            // Left Yellow Line
            const leftCenterLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
            leftCenterLine.position.set(-gapCenter, groundOffset, zPos);
            leftCenterLine.rotation.x = -Math.PI * 0.5;
            this.centerLines.push(leftCenterLine);
            this.experience.scene.add(leftCenterLine);

            // Right Yellow Line
            const rightCenterLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
            rightCenterLine.position.set(gapCenter, groundOffset, zPos);
            rightCenterLine.rotation.x = -Math.PI * 0.5;
            this.centerLines.push(rightCenterLine);
            this.experience.scene.add(rightCenterLine);
        }

        // White Barrier Line

        const barrierLineGeometry = new THREE.PlaneGeometry(0.075, this.roadTileLength, 1, 1);
        const barrierLineMaterial = new THREE.MeshBasicMaterial({ color: 0xC4B593 }); // Bright Yellow
        const gabBarrier = 2.3; // Horizontal separation from barrier (0.4 units total gap)

        for (let i = 0; i < 200; i++) {
            const zPos = -i * (this.roadTileLength - overlapAmount);

            // Left Yellow Line
            const leftBarrierLine = new THREE.Mesh(barrierLineGeometry, barrierLineMaterial);
            leftBarrierLine.position.set(-gabBarrier, groundOffset, zPos);
            leftBarrierLine.rotation.x = -Math.PI * 0.5;
            this.barrierLines.push(leftBarrierLine);
            this.experience.scene.add(leftBarrierLine);

            // Right Yellow Line
            const rightBarrierLine = new THREE.Mesh(barrierLineGeometry, barrierLineMaterial);
            rightBarrierLine.position.set(gabBarrier, groundOffset, zPos);
            rightBarrierLine.rotation.x = -Math.PI * 0.5;
            this.barrierLines.push(rightBarrierLine);
            this.experience.scene.add(rightBarrierLine);
        }
    }

    createTiledTerrainSide(side) {
        const TERRAIN_WIDTH = 1.5;
        const TERRAIN_LENGTH = this.roadTileLength || 30;
        const totalTiles = 30;
        const overlapAmount = 0.05;

        // --- MATERIAL SETUP ---
        const textureLoader = new THREE.TextureLoader();

        const dirtBaseColor = textureLoader.load('/assets/dirtBaseColor.png');
        const dirtNormalMap = textureLoader.load('/assets/dirtNormalMap.png');
        const dirtHeightMap = textureLoader.load('/assets/dirtHeightMap.png');
        const dirtRoughnessMap = textureLoader.load('/assets/dirtRoughnessMap.png');
        const dirtAmbientOcclusion = textureLoader.load('/assets/dirtAmbientOcclusionMap.png');

        [dirtBaseColor, dirtNormalMap, dirtHeightMap, dirtRoughnessMap, dirtAmbientOcclusion].forEach(t => {
            if (t) {
                t.wrapS = THREE.RepeatWrapping;
                t.wrapT = THREE.RepeatWrapping;
                t.repeat.set(2, 20); // 2 repeats wide, 20 repeats long
            }
        });

        const dirtMaterial = new THREE.MeshStandardMaterial({
            color: 0x5E5D5B,
            map: dirtBaseColor,
            normalMap: dirtNormalMap,
            displacementMap: dirtHeightMap,
            displacementScale: 0.1,
            roughnessMap: dirtRoughnessMap,
            aoMap: dirtAmbientOcclusion,
            side: THREE.DoubleSide,
        });

        // --- GEOMETRY AND CURVE DEFINITION ---
        const curveGeo = new THREE.PlaneGeometry(TERRAIN_WIDTH, TERRAIN_LENGTH, 10, 42);

        const p = curveGeo.attributes.position;
        const curveStrength = 0.25;

        for (let i = 0; i < p.count; i++) {
            const x = p.array[3 * i + 0];
            const normalizedX = x / (TERRAIN_WIDTH / 2); // Range: -1 (inner) to 1 (outer)

            // Parabolic curve based on distance from the inner edge (normalizedX = -1)
            const distanceFactor = Math.pow(normalizedX + 1, 2);

            // Apply negative Z offset to curve DOWN. 
            let zOffset = distanceFactor * curveStrength;
            p.array[3 * i + 2] = -zOffset;
        }

        curveGeo.computeVertexNormals();
        p.needsUpdate = true;

        // Calculate the fixed X position for this side
        let fixedXPosition;
        if (side === 'left') {
            fixedXPosition = -4.2;
        } else {
            fixedXPosition = 4.2;
        }

        for (let i = 0; i < totalTiles; i++) {
            // Create the mesh using the pre-curved geometry and material
            const terrainTile = new THREE.Mesh(curveGeo, dirtMaterial);

            // Rotate the mesh -90 degrees around X to lay the long plane flat along Z
            terrainTile.rotation.x = -Math.PI / 2;

            // --- MIRRORING ADJUSTMENT ---
            if (side === 'left') {
                // 1. Mirror the scale on the X-axis for the left side
                terrainTile.scale.x = -1;
                // Use the calculated X position
                terrainTile.position.x = fixedXPosition;
            } else {
                // Right side remains normal scale
                terrainTile.scale.x = 1; 
                terrainTile.position.x = fixedXPosition; // Fixed: Use calculated X position
            }
            // ----------------------------
            
            // Set the final Y-position (height).
            terrainTile.position.y = 0.55; // Kept your original value of 0.6

            // Position the tile along the Z-axis
            terrainTile.position.z = -i * (TERRAIN_LENGTH - overlapAmount);

            // Store the tile and add to scene
            if (side === 'left') {
                this.leftTerrainTiles.push(terrainTile);
            } else {
                this.rightTerrainTiles.push(terrainTile);
            }

            this.experience.scene.add(terrainTile);
        }
    }

    loadStreetLight() {
        this.experience.gltfLoader.load(
            'streetlight.glb',
            (gltf) => {
                const scaleFactor = 0.35;
                const streetLightSpacing = 15;
                // Scale the base model once
                gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);

                // Store the loaded scene as a template for cloning
                const streetLightTemp = gltf.scene;

                // Total visible distance is 30 road segments
                const totalDistance = 30 * streetLightSpacing;
                // Number of required streetlights
                const count = Math.ceil(totalDistance / streetLightSpacing);

                const xOffset = 3.5; // Slightly further out than the road's edge (2.5)
                const yOffset = 0.6; // Vertical placement

                for (let i = 0; i <= count; i++) {
                    const zPos = -i * streetLightSpacing;

                    // Left Streetlight Instance
                    const leftStretLight = streetLightTemp.clone();
                    leftStretLight.position.set(-xOffset, yOffset, zPos);
                    this.streetLights.push(leftStretLight);
                    this.experience.scene.add(leftStretLight);

                    // Right Streetlight Instance
                    const rightStretLight = streetLightTemp.clone();
                    rightStretLight.position.set(xOffset, yOffset, zPos);
                    rightStretLight.rotation.y = Math.PI; // Face the lights inward (optional, but realistic)
                    this.streetLights.push(rightStretLight);
                    this.experience.scene.add(rightStretLight);
                }
            }
        );
    }

    loadRoadBarrier() {
        this.experience.gltfLoader.load(
            'roadBarrier.glb',
            (gltf) => {
                const scaleFactor = 0.3;
                const roadBarrierSpacing = 2.7;
                // Scale the base model once
                gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);

                // Store the loaded scene as a template for cloning
                const roadBarrierTemp = gltf.scene;

                // Total visible distance is 30 road segments 
                const totalDistance = 30 * roadBarrierSpacing;
                // Number of required road barriers
                const count = Math.ceil(totalDistance / roadBarrierSpacing);

                const xOffset = 3; // Slightly further out than the road's edge (2.5)
                const yOffset = 0.6; // Vertical placement

                for (let i = 0; i <= 200; i++) {
                    const zPos = -i * roadBarrierSpacing;

                    // Left Streetlight Instance
                    const leftStretLight = roadBarrierTemp.clone();
                    leftStretLight.position.set(-xOffset, yOffset, zPos);
                    this.roadBarriers.push(leftStretLight);
                    this.experience.scene.add(leftStretLight);

                    // Right Streetlight Instance
                    const rightStretLight = roadBarrierTemp.clone();
                    rightStretLight.position.set(xOffset, yOffset, zPos);
                    rightStretLight.rotation.y = Math.PI;
                    this.roadBarriers.push(rightStretLight);
                    this.experience.scene.add(rightStretLight);
                }
            }
        );
    }

    loadTrees() {
        this.experience.gltfLoader.load(
            'trees.glb',
            (gltf) => {
                const scaleFactor = 1;
                const streetLightSpacing = 1;
                // Scale the base model once
                gltf.scene.scale.set(scaleFactor, scaleFactor, scaleFactor);

                // Store the loaded scene as a template for cloning
                const streetLightTemp = gltf.scene;

                // Total visible distance is 30 road segments
                const totalDistance = 30 * streetLightSpacing;
                // Number of required streetlights
                const count = Math.ceil(totalDistance / streetLightSpacing);

                const xOffset = 3.5; // Slightly further out than the road's edge (2.5)
                const yOffset = 0.6; // Vertical placement

                for (let i = 0; i <= count; i++) {
                    const zPos = -i * streetLightSpacing;

                    // Left Streetlight Instance
                    const leftStretLight = streetLightTemp.clone();
                    leftStretLight.position.set(-xOffset, yOffset, zPos);
                    this.streetLights.push(leftStretLight);
                    this.experience.scene.add(leftStretLight);

                    // Right Streetlight Instance
                    const rightStretLight = streetLightTemp.clone();
                    rightStretLight.position.set(xOffset, yOffset, zPos);
                    rightStretLight.rotation.y = Math.PI; // Face the lights inward (optional, but realistic)
                    this.streetLights.push(rightStretLight);
                    this.experience.scene.add(rightStretLight);
                }
            }
        );
    }

    Update() {

        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();

        // Scooter Sine Wave Movement
        // Add guard clause to ensure scooter is loaded before attempting to move it

        this.movementRange = 0.1;
        this.movementSpeed = 1;
        this.centerPositionX = 1.25;

        if (this.scooter) {
            const newXPosition = Math.sin(elapsedTime * this.movementSpeed) * this.movementRange;
            this.scooter.position.x = this.centerPositionX + newXPosition;

            // Rotate the scooter slightly to face the direction of movement
            const velocity = Math.cos(elapsedTime * this.movementSpeed);
            this.scooter.rotation.z = THREE.MathUtils.lerp(this.scooter.rotation.z, velocity * 0.1, 0.025);
        }

        // Tile movement speed
        const scrollSpeed = 10; // Units per second
        const distanceMoved = scrollSpeed * deltaTime;

        const totalRoadLength = 200;
        const recyclePointZ = 30

        // Move and Recycle Road Tiles
        this.roadTiles.forEach((roadTile) => {
            // Guard clause for safety against undefined elements
            if (!roadTile) return;

            roadTile.position.z += distanceMoved;

            if (roadTile.position.z > 30) {
                // Move the tile back by the total distance of the segment train
                roadTile.position.z -= totalRoadLength;
            }
        })

        // Move and Recycle Center Lines
        this.centerLines.forEach((line) => {
            if (!line) return;

            line.position.z += distanceMoved;

            if (line.position.z > recyclePointZ) {
                line.position.z -= totalRoadLength; // Use the same recycling length
            }
        });

        // Move and Recycle Streetlights
        this.streetLights.forEach((light) => {
            if (!light) return;

            light.position.z += distanceMoved;

            // Recycling logic: When a streetlight passes the camera (recyclePointZ), 
            // move it back by the total scrolling distance (totalRoadLength)
            if (light.position.z > recyclePointZ) {
                light.position.z -= totalRoadLength;
            }
        });

        // Move and Recycle Streetlights
        this.roadBarriers.forEach((light) => {
            if (!light) return;

            light.position.z += distanceMoved;

            // Recycling logic: When a roadBarrier passes the camera (recyclePointZ), 
            // move it back by the total scrolling distance (totalRoadLength)
            if (light.position.z > recyclePointZ) {
                light.position.z -= totalRoadLength;
            }
        });

        // Move and Recycle Left Terrain Tiles
        this.leftTerrainTiles.forEach((tile) => {
            if (!tile) return;
            tile.position.z += distanceMoved;
            if (tile.position.z > recyclePointZ) {
                tile.position.z -= totalRoadLength;
            }
        });

        // Move and Recycle Right Terrain Tiles
        this.rightTerrainTiles.forEach((tile) => {
            if (!tile) return;
            tile.position.z += distanceMoved;
            if (tile.position.z > recyclePointZ) {
                tile.position.z -= totalRoadLength;
            }
        });
    }
}

export { World };