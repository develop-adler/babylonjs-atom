import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders";
import * as BABYLON from "@babylonjs/core";
import { HavokPhysicsWithBindings } from "@babylonjs/havok";
import * as Hammer from "hammerjs";

import Character from "./Character";
import CharacterController from "./CharacterController";
import Joystick from "./Joystick";
import Atom from "./Atoms/Atom";
import ClassicRoom from "./Atoms/ClassicRoom";
import ModernRoom from "./Atoms/ModernRoom";
import Furniture from "./AtomElements/Furniture";
import LoadingUI from "./LoadingUI";

import { SCENE_SETTINGS } from "../utils/global";

// using CDN in index.html
declare function HavokPhysics(): any;

class Core {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _havok!: HavokPhysicsWithBindings;
    private _camera!: BABYLON.ArcRotateCamera | BABYLON.UniversalCamera;
    private _atom!: Atom;
    private _character!: Character;
    private _characterController?: CharacterController;
    private _joystick: Joystick;
    private _shadowGenerators: BABYLON.ShadowGenerator[] = [];

    constructor() {
        new LoadingUI();

        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.style.border = "none";
        this._canvas.style.outline = "none";
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
            this.createLight();

            this._atom = this.createAtom("classic");

            new Furniture("table_001.glb", this._scene, this._atom, this._shadowGenerators, {
                position: new BABYLON.Vector3(3, 0, 2),
                type: "cylinder",
            });
            new Furniture("table_002.glb", this._scene, this._atom, this._shadowGenerators, {
                position: new BABYLON.Vector3(5, 0, 3),
                type: "cylinder",
            });
            new Furniture("table_003.glb", this._scene, this._atom, this._shadowGenerators, {
                position: new BABYLON.Vector3(0, 0, -1.25),
            });

            new Furniture("sofa_001.glb", this._scene, this._atom, this._shadowGenerators, {
                position: new BABYLON.Vector3(0, 0, -3),
                rotation: new BABYLON.Vector3(0, Math.PI, 0),
            });
            new Furniture("sofa_002.glb", this._scene, this._atom, this._shadowGenerators, {
                position: new BABYLON.Vector3(6.8, 0, -4),
                rotation: new BABYLON.Vector3(0, Math.PI * 0.5, 0),
            });

            // thirperson controller mode as default mode
            this.initThirdPersonController();
            await this.initCharacterAsync().then(() => {
                this._characterController = new CharacterController(
                    this._character.root as BABYLON.Mesh,
                    this._character.physicsBody,
                    this._camera as BABYLON.ArcRotateCamera,
                    this._scene,
                    this._joystick,
                );
            });

            this.initInputControls();

            // hide loading screen
            this._engine.hideLoadingUI();

            this._engine.runRenderLoop(() => {
                if (this._scene) this._scene.render();
            });

            // the canvas/window resize event handler
            const handleResize = () => {
                this._engine.resize();

                // widen camera FOV on narrows screens
                if (window.innerWidth < window.innerHeight) {
                    this._camera.fov = 1;
                } else {
                    this._camera.fov = 0.8;
                }
            }
            window.addEventListener("resize", handleResize);

            // remove event listener
            this._scene.onDispose = () => {
                window.removeEventListener("resize", handleResize);
                this.dispose();
            };
        });
    }

    public get engine(): BABYLON.Engine {
        return this._engine;
    }
    public get scene(): BABYLON.Scene {
        return this._scene;
    }
    public get camera(): BABYLON.ArcRotateCamera | BABYLON.UniversalCamera {
        return this._camera;
    }
    public get atom(): Atom {
        return this._atom;
    }
    public get shadowGenerators(): BABYLON.ShadowGenerator[] {
        return this._shadowGenerators;
    }
    public get havok(): HavokPhysicsWithBindings {
        return this._havok;
    }
    public get joystick(): Joystick {
        return this._joystick;
    }

    private async initScene(): Promise<void> {
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

    private initFirstPersonController(pointerLock: boolean = false): void {
        if (!SCENE_SETTINGS.isThirdperson) return;

        this.resetCamera();

        this._camera = new BABYLON.UniversalCamera(
            "camera",
            new BABYLON.Vector3(0, 2.5, -2),
            this._scene,
        );
        this._camera.attachControl();
        this._scene.switchActiveCamera(this._camera);

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
        this._camera.ellipsoid = new BABYLON.Vector3(0.6, 1.1, 0.6); // collision box
        this._camera.speed = 1; // walking speed
        this._camera.inertia = 0.5; // reduce slipping
        this._camera.minZ = 0.1; // prevent clipping
        this._camera.angularSensibility = 1200; // mouse sensitivity: higher value = less sensitive

        this._camera.keysUp.push(87); // W
        this._camera.keysLeft.push(65); // A
        this._camera.keysDown.push(83); // S
        this._camera.keysRight.push(68); // D
    }

    private initThirdPersonController(): void {
        if (SCENE_SETTINGS.isThirdperson) return;
        this.resetCamera();

        this._camera = new BABYLON.ArcRotateCamera(
            "camera",
            -Math.PI * 0.5,
            Math.PI * 0.5,
            5,
            new BABYLON.Vector3(0, 1.15, -2), // target
            this._scene,
        );

        this._camera.position = new BABYLON.Vector3(0, 3, -3.5);

        // This attaches the camera to the canvas
        this._camera.attachControl(this._canvas, true);
        this._scene.switchActiveCamera(this._camera);

        // widen camera FOV on narrows screens
        if (window.innerWidth < window.innerHeight) {
            this._camera.fov = 1;
        } else {
            this._camera.fov = 0.8;
        }

        // prevent clipping
        this._camera.minZ = 0.1;

        // don't zoom in or out as much when scrolling mouse wheel
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

        SCENE_SETTINGS.isThirdperson = true;
    }

    public setFirstperson(pointerLock: boolean = false): void {
        if (!SCENE_SETTINGS.isThirdperson) return;
        // switch to first person controller (without pointer lock) by pressing 2
        this.stopCharacterController();
        this._character?.hide();
        this.initFirstPersonController(pointerLock);

        SCENE_SETTINGS.isThirdperson = false;
    }

    public setThirdperson(): void {
        if (SCENE_SETTINGS.isThirdperson) return;
        // switch to third person controller by pressing 3
        this.initThirdPersonController();

        if (!this._character) {
            this.initCharacterAsync().then(() => {
                if (!this._characterController) {
                    this._characterController = new CharacterController(
                        this._character.root as BABYLON.Mesh,
                        this._character.physicsBody,
                        this._camera as BABYLON.ArcRotateCamera,
                        this._scene,
                        this._joystick,
                    );
                } else {
                    this._characterController.start();
                }
            });
        } else {
            this._character.show();

            if (!this._characterController) {
                this._characterController = new CharacterController(
                    this._character.root as BABYLON.Mesh,
                    this._character.physicsBody,
                    this._camera as BABYLON.ArcRotateCamera,
                    this._scene,
                    this._joystick,
                );
            } else {
                this._characterController.start();
            }
        }

        if (!this._characterController) {
            this._characterController = new CharacterController(
                this._character.root as BABYLON.Mesh,
                this._character.physicsBody,
                this._camera as BABYLON.ArcRotateCamera,
                this._scene,
                this._joystick,
            );
        } else {
            this._characterController.start();
        }

        SCENE_SETTINGS.isThirdperson = true;
    }

    private initInputControls(): void {
        // Keyboard input
        this._scene.onKeyboardObservable.add(kbInfo => {
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
                        this.setFirstperson(true);
                        break;
                    case "2":
                        // switch to first person controller (without pointer lock) by pressing 2
                        this.setFirstperson(false);
                        break;
                    case "3":
                        this.setThirdperson();
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

    private createLight(): void {
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
            new BABYLON.Vector3(6.5, -20, -2),
            this._scene,
        );

        dirLight.position = new BABYLON.Vector3(3, 60, -5);
        dirLight.intensity = 1;
        dirLight.shadowEnabled = true;
        dirLight.shadowMinZ = 10;
        dirLight.shadowMaxZ = 60;

        // this.createLightGizmo(dirLight);

        // const spotLight = new BABYLON.SpotLight(
        //     "spotLight",
        //     new BABYLON.Vector3(-3, 60, -5),
        //     new BABYLON.Vector3(6.5, -20, -5),
        //     Math.PI / 4,
        //     1,
        //     this._scene,
        // );

        // this.createLightGizmo(spotLight);

        // Shadows
        const shadowGenerator = new BABYLON.ShadowGenerator(2048, dirLight);
        shadowGenerator.bias = 0.01;

        // enable PCF shadows for WebGL2
        shadowGenerator.usePercentageCloserFiltering = true;
        shadowGenerator.blurScale = 0.1;

        this._shadowGenerators.push(shadowGenerator);

        // low quality for better performance
        // shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_LOW;
    }

    // private createLightGizmo(customLight: BABYLON.Light): void {
    //     const lightGizmo = new BABYLON.LightGizmo();
    //     lightGizmo.scaleRatio = 2;
    //     lightGizmo.light = customLight;

    //     const gizmoManager = new BABYLON.GizmoManager(this._scene);
    //     gizmoManager.positionGizmoEnabled = true;
    //     gizmoManager.rotationGizmoEnabled = true;
    //     gizmoManager.usePointerToAttachGizmos = false;
    //     gizmoManager.attachToMesh(lightGizmo.attachedMesh);
    // }

    private resetCamera(): void {
        if (this._camera) {
            this._scene.removeCamera(this._camera);
            this._camera.dispose();
        }

        this._engine.exitPointerlock();
        this._scene.onPointerDown = undefined;
    }

    private createAtom(type: string): Atom {
        switch (type) {
            case "classic":
                return new ClassicRoom(this._scene);
            case "modern":
                return new ModernRoom(this._scene);
        }

        return undefined!;
    }

    // private initCharacter(): void {
    //     if (this._character) return;
    //     this._character = new Character(this._scene, this._atom, _shadowGenerators);
    //     this._character.loadModel();
    // }

    private async initCharacterAsync(): Promise<void> {
        if (this._character) return;
        this._character = new Character(this._scene, this._atom, this._shadowGenerators);
        await this._character.loadModel();
    }

    private disposeCharacter(): void {
        this._character?.dispose();
        this._character = null!;
    }

    private stopCharacterController(): void {
        this._characterController?.dispose();
        this._characterController = null!;
    }

    private dispose(): void {
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

export default Core;
