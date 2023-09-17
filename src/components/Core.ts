import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders";
import * as BABYLON from "@babylonjs/core";
import { HavokPhysicsWithBindings } from "@babylonjs/havok";
// import * as Hammer from "hammerjs";

import Avatar from "./Avatar";
import AvatarController from "./Controller/AvatarController";
import Joystick from "./Controller/Joystick";
import Atom from "./Atoms/Atom";
import ClassicRoom from "./Atoms/ClassicRoom";
import ModernRoom from "./Atoms/ModernRoom";
// import Furniture from "./AtomElements/Furniture";
import LoadingUI from "./LoadingUI";

import { SCENE_SETTINGS } from "../utils/global";
import { isMobile } from "../utils/functions";

// using CDN in index.html
declare function HavokPhysics(): any;

const showOutline = (meshes: BABYLON.AbstractMesh[]) => {
    meshes.forEach(mesh => {
        mesh.renderOutline = true;
    });
};

const hideAllOutlines = () => {
    SCENE_SETTINGS.importedMeshGroups.forEach(parentMesh => {
        parentMesh.getChildMeshes().forEach(mesh => {
            mesh.renderOutline = false;
        });
    });
};

const deleteImportedMesh = (
    scene: BABYLON.Scene,
    gizmoManager: BABYLON.GizmoManager,
) => {
    const { importedMeshGroups, selectedMeshParentName } = SCENE_SETTINGS;
    if (selectedMeshParentName !== "") {
        // dispose meshes
        importedMeshGroups
            .get(selectedMeshParentName)!
            .getChildMeshes()
            .forEach(mesh => {
                SCENE_SETTINGS.importedMeshesMap.delete(mesh.uniqueId);
                scene.removeMesh(mesh);
                mesh.material?.dispose();
                mesh.dispose();
            });

        // dispose parent mesh
        const parentMesh = importedMeshGroups.get(selectedMeshParentName);
        if (parentMesh) {
            scene.removeTransformNode(parentMesh);
            parentMesh.dispose();
        }
        parentMesh?.dispose();
        SCENE_SETTINGS.importedMeshGroups.delete(selectedMeshParentName);

        // reset values
        SCENE_SETTINGS.hasModelSelected = false;
        SCENE_SETTINGS.selectedMeshParentName = "";
        SCENE_SETTINGS.hoveredMeshParentName = "";
        gizmoManager.attachToMesh(null);
    }
};

class Core {
    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _havok!: HavokPhysicsWithBindings;
    private _camera: BABYLON.ArcRotateCamera;
    private _atom!: Atom;
    private _avatar!: Avatar;
    private _avatarController?: AvatarController;
    private _joystick: Joystick;
    private _shadowGenerators: BABYLON.ShadowGenerator[] = [];
    private _gizmoManager: BABYLON.GizmoManager;

    private static readonly CHARACTER_CAMERA_HEIGHT: number = 1.15;

    constructor() {
        // replace default loading screen overlay
        new LoadingUI();

        // babylonjs canvas
        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.style.border = "none";
        this._canvas.style.outline = "none";
        this._canvas.id = "babylonCanvas";
        document.getElementById("app")!.appendChild(this._canvas);

        // joystick
        this._joystick = new Joystick();

        // initialize babylon scene and engine
        this._engine = new BABYLON.Engine(this._canvas, true);

        // show loading screen
        this._engine.displayLoadingUI();

        // create scene
        this._scene = new BABYLON.Scene(this._engine);

        // gizmo manager
        this._gizmoManager = new BABYLON.GizmoManager(this._scene);
        this._initGizmoManager();

        // camera
        this._camera = new BABYLON.ArcRotateCamera(
            "camera",
            -Math.PI * 0.5,
            Math.PI * 0.5,
            5,
            new BABYLON.Vector3(0, Core.CHARACTER_CAMERA_HEIGHT, -2), // target
            this._scene,
        );
        this._initCamera();

        // wait until scene has physics then setup scene
        this.initScene().then(async () => {
            // Optimizer
            const options = new BABYLON.SceneOptimizerOptions(120, 2000);
            options.addOptimization(new BABYLON.HardwareScalingOptimization(0, 1));
            const optimizer = new BABYLON.SceneOptimizer(this._scene, options);
            optimizer.start();

            this.createLight();

            this._atom = this.createAtom("classic");

            this._avatar = new Avatar(
                this._scene,
                this._atom,
                this._shadowGenerators,
            );

            await this._avatar.loadModel();

            this.setThirdperson();

            // hide loading screen
            this._engine.hideLoadingUI();

            // new Furniture("table_001.glb", this._scene, this._atom, this._shadowGenerators, {
            //     position: new BABYLON.Vector3(3, 0, 2),
            //     type: "cylinder",
            // });
            // new Furniture("table_002.glb", this._scene, this._atom, this._shadowGenerators, {
            //     position: new BABYLON.Vector3(5, 0, 3),
            //     type: "cylinder",
            // });
            // new Furniture("table_003.glb", this._scene, this._atom, this._shadowGenerators, {
            //     position: new BABYLON.Vector3(0, 0, -1.25),
            // });

            // new Furniture("sofa_001.glb", this._scene, this._atom, this._shadowGenerators, {
            //     position: new BABYLON.Vector3(0, 0, -3),
            //     rotation: new BABYLON.Vector3(0, Math.PI, 0),
            // });
            // new Furniture("sofa_002.glb", this._scene, this._atom, this._shadowGenerators, {
            //     position: new BABYLON.Vector3(6.8, 0, -4),
            //     rotation: new BABYLON.Vector3(0, Math.PI * 0.5, 0),
            // });

            this.initInputControls();

            this._engine.runRenderLoop(() => {
                this._scene.render();
            });

            // canvas/window resize event handler
            const handleResize = () => {
                this._engine.resize();

                // widen camera FOV on narrows screens
                if (window.innerWidth < window.innerHeight) {
                    this._camera.fov = 1;
                } else {
                    this._camera.fov = 0.8;
                }
            };
            window.addEventListener("resize", handleResize);

            // remove event listener
            this._scene.onDispose = () => {
                window.removeEventListener("resize", handleResize);
            };
        });
    }

    public get canvas(): HTMLCanvasElement {
        return this._canvas;
    }
    public get engine(): BABYLON.Engine {
        return this._engine;
    }
    public get scene(): BABYLON.Scene {
        return this._scene;
    }
    public get havok(): HavokPhysicsWithBindings {
        return this._havok;
    }
    public get gizmoManager(): BABYLON.GizmoManager {
        return this._gizmoManager;
    }
    public get camera(): BABYLON.ArcRotateCamera | BABYLON.UniversalCamera {
        return this._camera;
    }
    public get atom(): Atom {
        return this._atom;
    }
    public get character(): Avatar {
        return this._avatar;
    }
    public get characterController(): AvatarController {
        return this._avatarController!;
    }
    public get shadowGenerators(): BABYLON.ShadowGenerator[] {
        return this._shadowGenerators;
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

        // hover object in editing model mode
        this._scene.onPointerMove = () => {
            if (!SCENE_SETTINGS.isEditingModelMode || SCENE_SETTINGS.hasModelSelected)
                return;

            const pickResult = this._scene.pick(
                this._scene.pointerX,
                this._scene.pointerY,
            );

            if (!pickResult.hit) return;
            if (!pickResult.pickedMesh) return;

            if (
                pickResult.pickedMesh.parent &&
                SCENE_SETTINGS.importedMeshGroups.has(pickResult.pickedMesh.parent.name)
            ) {
                showOutline(pickResult.pickedMesh.parent.getChildMeshes());
                SCENE_SETTINGS.hoveredMeshParentName =
                    pickResult.pickedMesh.parent.name;
            } else if (SCENE_SETTINGS.hoveredMeshParentName !== "") {
                SCENE_SETTINGS.importedMeshGroups
                    .get(SCENE_SETTINGS.hoveredMeshParentName)!
                    .getChildMeshes()
                    .forEach(mesh => {
                        mesh.renderOutline = false;
                    });
                SCENE_SETTINGS.hoveredMeshParentName = "";
            }
        };

        // click object in editing model mode
        this._scene.onPointerPick = (e: BABYLON.IPointerEvent) => {
            // left click
            if (e.button === 0) {
                // listen when in editing model mode
                if (!SCENE_SETTINGS.isEditingModelMode) return;

                const pickResult = this._scene.pick(
                    this._scene.pointerX,
                    this._scene.pointerY,
                );

                if (!pickResult.hit) return;
                if (!pickResult.pickedMesh) return;

                hideAllOutlines();

                if (
                    pickResult.pickedMesh.parent &&
                    SCENE_SETTINGS.importedMeshGroups.has(
                        pickResult.pickedMesh.parent.name,
                    )
                ) {
                    // object is selected
                    SCENE_SETTINGS.hasModelSelected = true;
                    showOutline(pickResult.pickedMesh.parent.getChildMeshes());
                    this._gizmoManager.attachToMesh(
                        pickResult.pickedMesh.parent as BABYLON.AbstractMesh,
                    );
                    SCENE_SETTINGS.selectedMeshParentName =
                        pickResult.pickedMesh.parent.name;
                } else if (SCENE_SETTINGS.selectedMeshParentName !== "") {
                    // object unselected
                    SCENE_SETTINGS.hasModelSelected = false;
                    this._gizmoManager.attachToMesh(null);
                }
            }
        };
    }

    private _initGizmoManager(): void {
        this._gizmoManager.positionGizmoEnabled = true;
        this._gizmoManager.rotationGizmoEnabled = true;
        this._gizmoManager.scaleGizmoEnabled = true;

        // use world orientation for gizmos
        this._gizmoManager.gizmos.positionGizmo!.updateGizmoRotationToMatchAttachedMesh =
            false;
        this._gizmoManager.gizmos.rotationGizmo!.updateGizmoRotationToMatchAttachedMesh =
            false;

        // disable y axis for position and rotation gizmo
        this._gizmoManager.gizmos.positionGizmo!.yGizmo.isEnabled = false;
        this._gizmoManager.gizmos.rotationGizmo!.xGizmo.isEnabled = false;
        this._gizmoManager.gizmos.rotationGizmo!.zGizmo.isEnabled = false;

        // enable only position gizmo by default
        this._gizmoManager.rotationGizmoEnabled = false;
        this._gizmoManager.scaleGizmoEnabled = false;
        this._gizmoManager.positionGizmoEnabled = true;

        // disable pointer to attach gizmos
        this._gizmoManager.usePointerToAttachGizmos = false;
        this._gizmoManager.attachableMeshes = []; // don't allow any mesh to be attached
    }

    private _initCamera(): void {
        this._camera = new BABYLON.ArcRotateCamera(
            "camera",
            -Math.PI * 0.5,
            Math.PI * 0.5,
            5,
            new BABYLON.Vector3(0, Core.CHARACTER_CAMERA_HEIGHT, -2), // target
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
        this._camera.upperRadiusLimit = 5;

        //  lower rotation sensitivity, higher value = less sensitive
        this._camera.angularSensibilityX = isMobile() ? 1000 : 2200;
        this._camera.angularSensibilityY = isMobile() ? 1000 : 2200;

        // disable rotation using keyboard arrow key
        this._camera.keysUp = [];
        this._camera.keysDown = [];
        this._camera.keysLeft = [];
        this._camera.keysRight = [];

        // disable panning
        this._camera.panningSensibility = 0;
    }

    public setFirstperson(pointerLock: boolean = false): void {
        this._avatar.hide();

        if (pointerLock && !isMobile()) {
            this._engine.enterPointerlock();
            this._scene.onPointerDown = e => {
                // left click
                if (e.button === 0) this._engine.enterPointerlock();
            };
        } else {
            this._engine.exitPointerlock();
            this._scene.onPointerDown = undefined;
        }

        this._camera.lowerRadiusLimit = 0; // min distance
        this._camera.upperRadiusLimit = 0; // max distance
        this._scene.switchActiveCamera(this._camera);

        SCENE_SETTINGS.isThirdperson = false;

        SCENE_SETTINGS.isThirdperson = false;
    }

    public async setThirdperson(): Promise<void> {
        this._camera.lowerRadiusLimit = 0.5; // min distance
        this._camera.upperRadiusLimit = 3; // max distance
        this._scene.switchActiveCamera(this._camera);

        this._avatar.show();
        if (!this._avatarController) {
            this._avatarController = new AvatarController(
                this._avatar.root,
                this._avatar.physicsBody,
                this._camera,
                this._scene,
                this._joystick,
            );
        } else {
            this._avatarController.start();
        }

        SCENE_SETTINGS.isThirdperson = true;
    }

    public async _loadModelFromFile(file: File): Promise<void> {
        BABYLON.SceneLoader.ImportMesh(
            "",
            "",
            file,
            this._scene,
            (meshes, _particleSystems, _skeleton, animationGroups) => {
                // mesh naming convention: filename + _ + number
                // get file name, remove extension
                let filename = file.name.replace(".glb", "").replace(".gltf", "");

                // if there's a mesh with the same name, add a number to the end of the name
                if (SCENE_SETTINGS.importedMeshGroups.has(file.name)) {
                    let i = 1;
                    while (SCENE_SETTINGS.importedMeshGroups.has(filename)) {
                        filename = `${file.name.split(".")[0]}_${i}.${file.name.split(".")[1]
                            }`;
                        i++;
                    }
                }

                // add meshes to a parent node and assign to imported mesh map
                const parent = new BABYLON.TransformNode(filename, this._scene);
                meshes.forEach(mesh => {
                    mesh.outlineColor = BABYLON.Color3.Green();
                    mesh.outlineWidth = 0.05;
                    mesh.parent = parent;
                    SCENE_SETTINGS.importedMeshesMap.set(mesh.uniqueId, mesh);
                });

                SCENE_SETTINGS.importedMeshGroups.set(filename, parent);

                // don't play animations
                animationGroups.forEach(animation => {
                    animation.stop();
                });

                // enable shadows
                if (this._shadowGenerators.length) {
                    this._shadowGenerators?.forEach(generator => {
                        meshes.forEach(mesh => {
                            mesh.receiveShadows = true;
                            generator.addShadowCaster(mesh);
                        });
                    });
                }

                // add meshes to reflection list
                this._atom.addMeshesToReflectionList(meshes as BABYLON.Mesh[]);
            },
            null, // onProgress
            (_, message, exception) => {
                // onError
                throw new Error(exception ?? `Error loading model: ${message}`);
            },
        );
    }

    private initInputControls(): void {
        // Keyboard input
        this._scene.onKeyboardObservable.add(kbInfo => {
            if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
                switch (kbInfo.event.key.toLowerCase()) {
                    case "i":
                        if (this._scene.debugLayer.isVisible()) {
                            this._scene.debugLayer.hide();
                        } else {
                            this._scene.debugLayer.show();
                        }
                        break;
                    case "delete":
                        deleteImportedMesh(this._scene, this._gizmoManager);
                        break;
                }
            }
        });

        // // phone input
        // const hammerManager = new Hammer.Manager(this._canvas);

        // // create swipe gesture recognizer and add recognizer to manager
        // const Swipe = new Hammer.Swipe();
        // hammerManager.add(Swipe);

        // hammerManager.get("swipe").set({ direction: Hammer.DIRECTION_ALL });
        // hammerManager.on("swipe", (e: any) => {
        //     switch (e.direction) {
        //         case Hammer.DIRECTION_UP:
        //             break;
        //         case Hammer.DIRECTION_LEFT:
        //             break;
        //         case Hammer.DIRECTION_RIGHT:
        //             break;
        //     }
        // });
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

    private createAtom(type: string): Atom {
        switch (type) {
            case "classic":
                return new ClassicRoom(this._scene);
            case "modern":
                return new ModernRoom(this._scene);
        }

        return undefined!;
    }

    public dispose(): void {
        // dispose cameras
        this._scene.cameras.forEach(camera => {
            this._scene.removeCamera(camera);
            camera.dispose();
        });

        // dispose character and character controller
        this._avatar?.dispose();
        this._avatar = null!;
        this._avatarController?.dispose();
        this._avatarController = null!;
        this._joystick.dispose();
        this._joystick = null!;

        this._engine.stopRenderLoop();
        this._scene.dispose();
        this._engine.dispose();
    }
}

export default Core;
