import "./style.css";
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders";
import * as BABYLON from "@babylonjs/core";
import { HavokPhysicsWithBindings } from "@babylonjs/havok";
import * as Hammer from "hammerjs";

import Character from "./components/Character";
import CharacterController from "./components/CharacterController";
import Joystick from "./components/Joystick";
import ClassicRoom from "./components/Atoms/ClassicRoom";

// using CDN in index.html
declare function HavokPhysics(): any;

class App {
    private canvas: HTMLCanvasElement;
    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private havok!: HavokPhysicsWithBindings;
    private camera!: BABYLON.ArcRotateCamera | BABYLON.UniversalCamera;
    private character?: Character;
    private characterController?: CharacterController;
    private isThirdperson: boolean = false;
    private joystick: Joystick;
    private appState: 0 | 1 | 2 = 1;

    private ground: BABYLON.Mesh;

    constructor() {
        // this.initHUD();

        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.id = "babylonCanvas";
        document.getElementById("app")!.appendChild(this.canvas);

        this.joystick = new Joystick();

        // initialize babylon scene and engine
        this.engine = new BABYLON.Engine(this.canvas, true);

        // show loading screen
        this.engine.displayLoadingUI();

        this.scene = new BABYLON.Scene(this.engine);
        this.character = new Character(this.scene);
        this.ground = new BABYLON.Mesh("ground", this.scene);

        // wait until scene has physics then create scene
        this.initScene().then(async () => {
            this.createAtom();
            this.initFirstPersonController();

            // if (this.character) {
            //     this.initThirdPersonController();
            //     await this.character.init();
            //     this.characterController = new CharacterController(
            //         this.character!.root as BABYLON.Mesh,
            //         this.character!.physicsBody as BABYLON.PhysicsBody,
            //         this.camera as BABYLON.ArcRotateCamera,
            //         this.scene,
            //         this.joystick,
            //     );
            // }

            this.createLight();

            this.initControls();

            // hide loading screen
            this.engine.hideLoadingUI();

            this.engine.runRenderLoop(() => {
                if (this.scene) this.scene.render();
            });

            // the canvas/window resize event handler
            const handleResize = () => this.engine.resize();
            window.addEventListener("resize", handleResize);

            // remove event listener
            this.scene.onDispose = () => {
                window.removeEventListener("resize", handleResize);

                this.dispose();
            };
        });
    }

    async initScene(): Promise<void> {
        const envMapTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
            "/envMap/sky.env",
            this.scene,
        );
        this.scene.environmentTexture = envMapTexture;
        this.scene.createDefaultSkybox(envMapTexture, true);
        this.scene.environmentIntensity = 0.5;

        // Enable physics
        const gravityVector = new BABYLON.Vector3(0, -19.62, 0);
        this.havok = await HavokPhysics();
        // pass the engine to the plugin
        const havokPlugin = new BABYLON.HavokPlugin(true, this.havok);
        // enable physics in the scene with a gravity
        this.scene.enablePhysics(gravityVector, havokPlugin);

        this.scene.collisionsEnabled = true;
    }

    initFirstPersonController(pointerLock: boolean = false): void {
        this.resetCamera();
        this.disposeCharacter();

        this.camera = new BABYLON.UniversalCamera(
            "camera",
            new BABYLON.Vector3(0, 2.5, -2),
            this.scene,
        );
        this.camera.attachControl();

        if (pointerLock) {
            this.engine.enterPointerlock();
            this.scene.onPointerDown = e => {
                // left click
                if (e.button === 0) this.engine.enterPointerlock();
            };
        } else {
            this.engine.exitPointerlock();
            this.scene.onPointerDown = undefined;
        }

        this.camera.applyGravity = true; // apply gravity to the camera
        this.camera.checkCollisions = true; // prevent walking through walls
        this.camera.ellipsoid = new BABYLON.Vector3(1, 1.25, 1); // collision box
        this.camera.speed = 1; // walking speed
        this.camera.inertia = 0.5; // reduce slipping
        this.camera.minZ = 0.1; // prevent clipping
        this.camera.angularSensibility = 1200; // mouse sensitivity: higher value = less sensitive

        this.camera.keysUp.push(87); // W
        this.camera.keysLeft.push(65); // A
        this.camera.keysDown.push(83); // S
        this.camera.keysRight.push(68); // D

        // Create invisible floor as ground to walk on with physics
        // this.ground = BABYLON.MeshBuilder.CreateGround(
        //     "ground",
        //     { width: 140, height: 66 },
        //     this.scene,
        // );
        // this.ground.position.z = 2.5;
        // this.ground.position.y = -0.1;
        // this.ground.checkCollisions = true;
        // this.ground.material = new BABYLON.StandardMaterial(
        //     "groundMat",
        //     this.scene,
        // );
        // this.ground.material.alpha = 0;
    }

    initThirdPersonController(): void {
        this.resetCamera();

        this.camera = new BABYLON.ArcRotateCamera(
            "camera",
            -Math.PI * 0.5,
            Math.PI * 0.5,
            5,
            new BABYLON.Vector3(0, 2.5, -2), // target
            this.scene,
        );

        this.camera.position = new BABYLON.Vector3(0, 3, -6);

        // This attaches the camera to the canvas
        this.camera.attachControl(this.canvas, true);

        // prevent clipping
        this.camera.minZ = 0.1;

        this.camera.wheelPrecision = 100;

        // camera min distance and max distance
        this.camera.lowerRadiusLimit = 0.5;
        this.camera.upperRadiusLimit = 10;

        //  lower rotation sensitivity, higher value = less sensitive
        this.camera.angularSensibilityX = 2000;
        this.camera.angularSensibilityY = 2000;

        // disable rotation using keyboard arrow key
        this.camera.keysUp = [];
        this.camera.keysDown = [];
        this.camera.keysLeft = [];
        this.camera.keysRight = [];
    }

    initControls(): void {
        // Keyboard input
        this.scene.onKeyboardObservable.add(async kbInfo => {
            if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                switch (kbInfo.event.key.toLowerCase().trim()) {
                    case "i":
                        if (this.scene.debugLayer.isVisible()) {
                            this.scene.debugLayer.hide();
                        } else {
                            this.scene.debugLayer.show();
                        }
                        break;
                    case "1":
                        // switch to first person controller (with pointer lock) by pressing 1
                        this.disposeCharacterController();
                        this.initFirstPersonController(true);
                        break;
                    case "2":
                        // switch to first person controller (without pointer lock) by pressing 2
                        this.disposeCharacterController();
                        this.initFirstPersonController(false);
                        break;
                    case "3":
                        // switch to third person controller by pressing 3
                        this.initThirdPersonController();

                        if (!this.character) {
                            this.character = new Character(this.scene);
                            await this.character.init();
                        }
                        this.characterController = new CharacterController(
                            this.character!.root as BABYLON.Mesh,
                            this.character!.physicsBody as BABYLON.PhysicsBody,
                            this.camera as BABYLON.ArcRotateCamera,
                            this.scene,
                            this.joystick,
                        );
                        break;
                }
            }
        });

        // phone input for ball
        const hammerManager = new Hammer.Manager(this.canvas);

        // create swipe gesture recognizer and add recognizer to manager
        const Swipe = new Hammer.Swipe();
        hammerManager.add(Swipe);

        hammerManager.get("swipe").set({ direction: Hammer.DIRECTION_ALL });
        hammerManager.on("swipe", (e: any) => {
            switch (e.direction) {
                // swipe up to throw ball
                case Hammer.DIRECTION_UP:
                    break;
                case Hammer.DIRECTION_LEFT:
                    break;
                case Hammer.DIRECTION_RIGHT:
                    break;
            }
        });
    }

    createLight(): void {
        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        const hemiLight = new BABYLON.HemisphericLight(
            "hemiLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene,
        );

        // dim light a small amount
        hemiLight.intensity = 0.7;

        const dirLight = new BABYLON.DirectionalLight(
            "dirLight",
            new BABYLON.Vector3(-0.5, -1, -0.5),
            this.scene,
        );

        dirLight.position = new BABYLON.Vector3(30, 20, -10);
        dirLight.intensity = 2.5;
        dirLight.shadowEnabled = true;
        dirLight.shadowMinZ = 10;
        dirLight.shadowMaxZ = 60;

        // this.createLightGizmo(dirLight);

        // Shadows
        const shadowGenerator = new BABYLON.ShadowGenerator(2048, dirLight);
        shadowGenerator.bias = 0.01;

        // enable PCF shadows for WebGL2
        shadowGenerator.usePercentageCloserFiltering = true;
        shadowGenerator.blurScale = 0.1;

        // low quality for better performance
        // shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_LOW;

        // this.character?.meshes.forEach(mesh => {
        //     mesh.receiveShadows = true;
        //     shadowGenerator.addShadowCaster(mesh);
        // });

        // this.bowlingAlleyObjects.ball.receiveShadows = true;
        // shadowGenerator.addShadowCaster(this.bowlingAlleyObjects.ball);

        // this.bowlingAlleyObjects.pinMeshes.forEach(mesh => {
        //     mesh.receiveShadows = true;
        //     shadowGenerator.addShadowCaster(mesh);
        // });
        // this.bowlingAlleyObjects.facility.forEach(mesh => {
        //     mesh.receiveShadows = true;
        //     shadowGenerator.addShadowCaster(mesh);
        // });
    }

    createLightGizmo(customLight: BABYLON.Light): void {
        const lightGizmo = new BABYLON.LightGizmo();
        lightGizmo.scaleRatio = 2;
        lightGizmo.light = customLight;

        const gizmoManager = new BABYLON.GizmoManager(this.scene);
        gizmoManager.positionGizmoEnabled = true;
        gizmoManager.rotationGizmoEnabled = true;
        gizmoManager.usePointerToAttachGizmos = false;
        gizmoManager.attachToMesh(lightGizmo.attachedMesh);
    }

    resetCamera(): void {
        this.scene.removeCamera(this.camera);
        if (this.camera instanceof BABYLON.ArcRotateCamera) {
            this.camera.dispose();
        }

        this.engine.exitPointerlock();
        this.scene.onPointerDown = undefined;

        this.isThirdperson = false;

        if (this.ground) {
            this.scene.removeMesh(this.ground);

            if (this.ground?.material) {
                this.scene.removeMaterial(this.ground.material);
                this.ground.material!.dispose();
            }

            this.ground?.dispose();
            this.ground = null!;
        }
    }

    createAtom(): void {
        const classicRoom = new ClassicRoom(this.scene);
        console.log(classicRoom);
    }

    initCharacter(): void {
        if (this.character) return;
        this.character = new Character(this.scene);
        this.character.init();
    }

    async initCharacterAsync(): Promise<void> {
        if (this.character) return;
        this.character = new Character(this.scene);
        await this.character.init();
    }

    disposeCharacter(): void {
        this.character?.dispose();
        this.character = null!;
    }

    disposeCharacterController(): void {
        this.characterController?.dispose();
        this.characterController = null!;
    }

    dispose(): void {
        this.engine.stopRenderLoop();
        this.scene.dispose();
        this.engine.dispose();

        // dispose cameras
        this.scene.cameras.forEach(camera => {
            camera.dispose();
        });

        this.disposeCharacter();
        this.disposeCharacterController();
        this.joystick.dispose();
    }
}

new App();
