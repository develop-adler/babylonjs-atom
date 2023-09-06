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
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _havok!: HavokPhysicsWithBindings;
    private _camera!: BABYLON.ArcRotateCamera | BABYLON.UniversalCamera;
    private _character!: Character;
    private _characterController?: CharacterController;
    private _joystick: Joystick;
    // private appState: 0 | 1 | 2 = 1;

    private isThirdperson: boolean = false;

    constructor() {
        // this.initHUD();

        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.id = "babylonCanvas";
        document.getElementById("app")!.appendChild(this._canvas);

        this._joystick = new Joystick();

        // initialize babylon scene and engine
        this._engine = new BABYLON.Engine(this._canvas, true);

        // show loading screen
        this._engine.displayLoadingUI();

        this._scene = new BABYLON.Scene(this._engine);

        // wait until scene has physics then create scene
        this.initScene().then(async () => {
            this.createAtom("classic");
            // this.initFirstPersonController();

            // thirperson controller mode as default mode
            this.initThirdPersonController();
            await this.initCharacterAsync();
            this._characterController = new CharacterController(
                this._character!.root as BABYLON.Mesh,
                this._character!.physicsBody as BABYLON.PhysicsBody,
                this._camera as BABYLON.ArcRotateCamera,
                this._scene,
                this._joystick,
            );

            this.createLight();

            this.initControls();

            // hide loading screen
            this._engine.hideLoadingUI();

            this._engine.runRenderLoop(() => {
                if (this._scene) this._scene.render();
            });

            // the canvas/window resize event handler
            const handleResize = () => this._engine.resize();
            window.addEventListener("resize", handleResize);

            // remove event listener
            this._scene.onDispose = () => {
                window.removeEventListener("resize", handleResize);

                this.dispose();
            };
        });
    }

    async initScene(): Promise<void> {
        const envMapTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
            "/envMap/sky.env",
            this._scene,
        );
        this._scene.environmentTexture = envMapTexture;
        this._scene.createDefaultSkybox(envMapTexture, true);
        this._scene.environmentIntensity = 0.5;

        // Enable physics
        const gravityVector = new BABYLON.Vector3(0, -19.62, 0);
        this._havok = await HavokPhysics();
        // pass the engine to the plugin
        const havokPlugin = new BABYLON.HavokPlugin(true, this._havok);
        // enable physics in the scene with a gravity
        this._scene.enablePhysics(gravityVector, havokPlugin);

        this._scene.collisionsEnabled = true;
    }

    initFirstPersonController(pointerLock: boolean = false): void {
        this.resetCamera();

        this._camera = new BABYLON.UniversalCamera(
            "camera",
            new BABYLON.Vector3(0, 2.5, -2),
            this._scene,
        );
        this._camera.attachControl();

        if (pointerLock) {
            this._engine.enterPointerlock();
            this._scene.onPointerDown = e => {
                // left click
                if (e.button === 0) this._engine.enterPointerlock();
            };
        } else {
            this._engine.exitPointerlock();
            this._scene.onPointerDown = undefined;
        }

        this._camera.applyGravity = true; // apply gravity to the camera
        this._camera.checkCollisions = true; // prevent walking through walls
        this._camera.ellipsoid = new BABYLON.Vector3(1, 1.25, 1); // collision box
        this._camera.speed = 1; // walking speed
        this._camera.inertia = 0.5; // reduce slipping
        this._camera.minZ = 0.1; // prevent clipping
        this._camera.angularSensibility = 1200; // mouse sensitivity: higher value = less sensitive

        this._camera.keysUp.push(87); // W
        this._camera.keysLeft.push(65); // A
        this._camera.keysDown.push(83); // S
        this._camera.keysRight.push(68); // D

        this.isThirdperson = false;
    }

    initThirdPersonController(): void {
        if (this.isThirdperson) return;
        this.resetCamera();

        this._camera = new BABYLON.ArcRotateCamera(
            "camera",
            -Math.PI * 0.5,
            Math.PI * 0.5,
            5,
            new BABYLON.Vector3(0, 1.15, -2), // target
            this._scene,
        );

        this._camera.position = new BABYLON.Vector3(0, 3, -6);

        // This attaches the camera to the canvas
        this._camera.attachControl(this._canvas, true);

        // prevent clipping
        this._camera.minZ = 0.1;

        this._camera.wheelPrecision = 100;

        // camera min distance and max distance
        this._camera.lowerRadiusLimit = 0.5;
        this._camera.upperRadiusLimit = 10;

        //  lower rotation sensitivity, higher value = less sensitive
        this._camera.angularSensibilityX = 2000;
        this._camera.angularSensibilityY = 2000;

        // disable rotation using keyboard arrow key
        this._camera.keysUp = [];
        this._camera.keysDown = [];
        this._camera.keysLeft = [];
        this._camera.keysRight = [];

        // disable panning
        this._camera.panningSensibility = 0;

        this.isThirdperson = true;
    }

    initControls(): void {
        // Keyboard input
        this._scene.onKeyboardObservable.add(async kbInfo => {
            if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                switch (kbInfo.event.key.toLowerCase().trim()) {
                    case "i":
                        if (this._scene.debugLayer.isVisible()) {
                            this._scene.debugLayer.hide();
                        } else {
                            this._scene.debugLayer.show();
                        }
                        break;
                    case "1":
                        // switch to first person controller (with pointer lock) by pressing 1
                        this.stopCharacterController();
                        this._character?.hide();
                        this.initFirstPersonController(true);
                        break;
                    case "2":
                        // switch to first person controller (without pointer lock) by pressing 2
                        this.stopCharacterController();
                        this._character?.hide();
                        this.initFirstPersonController(false);
                        break;
                    case "3":
                        if (this.isThirdperson) return;
                        // switch to third person controller by pressing 3
                        this.initThirdPersonController();

                        if (!this._character) {
                            await this.initCharacterAsync();
                        } else {
                            this._character.show();
                        }

                        if (!this._characterController) {
                            this._characterController = new CharacterController(
                                this._character!.root as BABYLON.Mesh,
                                this._character!.physicsBody as BABYLON.PhysicsBody,
                                this._camera as BABYLON.ArcRotateCamera,
                                this._scene,
                                this._joystick,
                            );
                        } else {
                            this._characterController.start();
                        }
                        break;
                }
            }
        });

        // phone input
        const hammerManager = new Hammer.Manager(this._canvas);

        // create swipe gesture recognizer and add recognizer to manager
        const Swipe = new Hammer.Swipe();
        hammerManager.add(Swipe);

        hammerManager.get("swipe").set({ direction: Hammer.DIRECTION_ALL });
        hammerManager.on("swipe", (e: any) => {
            switch (e.direction) {
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
            this._scene,
        );

        // dim light a small amount
        hemiLight.intensity = 0.7;

        const dirLight = new BABYLON.DirectionalLight(
            "dirLight",
            new BABYLON.Vector3(4.5, -20, -5),
            this._scene,
        );

        dirLight.position = new BABYLON.Vector3(-3, 40, -5);
        dirLight.intensity = 1;
        dirLight.shadowEnabled = true;
        dirLight.shadowMinZ = 10;
        dirLight.shadowMaxZ = 60;

        this.createLightGizmo(dirLight);

        // Shadows
        const shadowGenerator = new BABYLON.ShadowGenerator(2048, dirLight);
        shadowGenerator.bias = 0.01;

        // enable PCF shadows for WebGL2
        shadowGenerator.usePercentageCloserFiltering = true;
        shadowGenerator.blurScale = 0.1;

        // low quality for better performance
        // shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_LOW;

        this._character?.meshes.forEach(mesh => {
            mesh.receiveShadows = true;
            shadowGenerator.addShadowCaster(mesh);
        });

        // TODO: add atom shadows
    }

    createLightGizmo(customLight: BABYLON.Light): void {
        const lightGizmo = new BABYLON.LightGizmo();
        lightGizmo.scaleRatio = 2;
        lightGizmo.light = customLight;

        const gizmoManager = new BABYLON.GizmoManager(this._scene);
        gizmoManager.positionGizmoEnabled = true;
        gizmoManager.rotationGizmoEnabled = true;
        gizmoManager.usePointerToAttachGizmos = false;
        gizmoManager.attachToMesh(lightGizmo.attachedMesh);
    }

    resetCamera(): void {
        this._scene.removeCamera(this._camera);
        if (this._camera instanceof BABYLON.ArcRotateCamera) {
            this._camera.dispose();
        }

        this._engine.exitPointerlock();
        this._scene.onPointerDown = undefined;
    }

    createAtom(type: string): void {
        switch(type){
            case "classic":
                new ClassicRoom(this._scene);
                break;
        }
    }

    initCharacter(): void {
        if (this._character) return;
        this._character = new Character(this._scene);
        this._character.init();
    }

    async initCharacterAsync(): Promise<void> {
        if (this._character) return;
        this._character = new Character(this._scene);
        await this._character.init();
    }

    disposeCharacter(): void {
        this._character?.dispose();
        this._character = null!;
    }

    stopCharacterController(): void {
        this._characterController?.dispose();
        this._characterController = null!;
    }

    dispose(): void {
        // dispose cameras
        this._scene.cameras.forEach(camera => {
            camera.dispose();
        });

        // dispose character and character controller
        this.disposeCharacter();
        this.stopCharacterController();
        this._joystick.dispose();

        this._engine.stopRenderLoop();
        this._scene.dispose();
        this._engine.dispose();
    }
}

new App();
