import {
    ArcRotateCamera,
    Mesh,
    Nullable,
    SceneLoader,
    Vector3,
} from "@babylonjs/core";
import { SCENE_SETTINGS } from "../utils/global";
import Core from "./Core";

class OverlayElements {
    private _core: Core;

    private _appElement: HTMLElement;
    private _overlayContainerElement!: HTMLDivElement;

    constructor(core: Core) {
        this._core = core;
        this._appElement = document.getElementById("app")!;

        this._createOverlayContainer();
        this._createControlSwitchElement();
        this._createModelUploadButton();
        this._createImageUploadToggleButton();
    }

    private _createOverlayContainer(): void {
        this._overlayContainerElement = document.createElement("div");
        this._overlayContainerElement.id = "overlayContainer";
        const css = document.createElement("style");
        css.innerHTML = `
            #overlayContainer {
                display: flex;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 5;
            }
        `;
        document.getElementsByTagName("head")[0].appendChild(css);
        this._appElement.appendChild(this._overlayContainerElement);
    }

    private _createControlSwitchElement(): void {
        const controlSwitchElement = document.createElement("div");
        controlSwitchElement.id = "controlSwitch";
        const css = document.createElement("style");
        css.innerHTML = `
            #controlSwitch {
                pointer-events: none;
                position: absolute;
                right: 2rem;
                bottom: 2.5rem;
                // background-color: rgba(102, 102, 102, 0.50);
                // backdrop-filter: blur(0.3125rem);
                // border-radius: 1.5rem;
                border: none;
                outline: none;
                padding: 0;
                scale: 1;
                transition: all 0.4s ease-in-out;

                @media screen and (max-width: 768px) {
                    right: -3rem;
                    bottom: -0.4rem;
                    scale: 0.5;
                }
            }

            input[type=checkbox]{
                height: 0;
                width: 0;
                visibility: hidden;
            }
        
            #toggle {
                pointer-events: all;
                cursor: pointer;
                text-indent: -9999px;
                width: 200px;
                height: 100px;
                background: #FC4F91;
                display: block;
                border-radius: 100px;
                position: relative;
                // transition: background-color 0.2s ease-in-out;
                scale: 0.7;
            }
        
            #toggle:after {
                content: '';
                position: absolute;
                top: 5px;
                left: 5px;
                width: 90px;
                height: 90px;
                background: #fff;
                border-radius: 90px;
                transition: 0.3s;
            }
        
            // input:checked + #toggle {
            //     background: #bada55;
            // }
        
            input:checked + #toggle:after {
                left: calc(100% - 5px);
                transform: translateX(-100%);
            }
        
            #toggle:active:after {
                width: 130px;
            }
        `;
        document.getElementsByTagName("head")[0].appendChild(css);

        const toggleInput = document.createElement("input");
        toggleInput.type = "checkbox";
        toggleInput.id = "toggleInput";

        const toggleLabel = document.createElement("label");
        toggleLabel.id = "toggle";
        toggleLabel.htmlFor = "toggleInput";

        controlSwitchElement.appendChild(toggleInput);
        controlSwitchElement.appendChild(toggleLabel);

        toggleLabel.onclick = (e: MouseEvent) => {
            if (SCENE_SETTINGS.isEditingPictureMode) {
                e.preventDefault();
                window.alert("Please turn off image editing mode first!");
                return;
            }
            e.stopPropagation();

            if (SCENE_SETTINGS.isThirdperson) {
                this._core.setFirstperson();
            } else {
                this._core.setThirdperson();
            }
        };

        this._overlayContainerElement.appendChild(controlSwitchElement);
    }

    private async _loadModelFromFile(file: File): Promise<void> {
        SceneLoader.ImportMesh(
            "",
            "",
            file,
            this._core.scene,
            (meshes, particleSystems, skeletons, animationGroups) => {
                //onSuccess
                console.log(meshes);
                console.log(particleSystems);
                console.log(skeletons);
                console.log(animationGroups);

                console.log(file);

                // enable shadows and collisions
                if (this._core.shadowGenerators.length) {
                    this._core.shadowGenerators?.forEach(generator => {
                        meshes.forEach(mesh => {
                            mesh.receiveShadows = true;
                            mesh.checkCollisions = true;
                            generator.addShadowCaster(mesh);
                        });
                    });
                }

                // add meshes to reflection list
                this._core.atom.addMeshesToReflectionList(meshes as Mesh[]);
            },
            null, // onProgress
            (_, message, exception) => {
                // onError
                throw new Error(exception ?? `Error loading model: ${message}`);
            },
        );
    }

    private _createModelUploadButton(): void {
        const modelUploadInputButton = document.createElement("button");
        modelUploadInputButton.id = "modelUploadInputButton";
        modelUploadInputButton.innerHTML = "Upload Model";

        const modelUploadInputField = document.createElement("input");
        modelUploadInputField.id = "modelUploadInputField";
        modelUploadInputField.type = "file";
        modelUploadInputField.accept = ".glb, .gltf";
        modelUploadInputField.multiple = true;
        const css = document.createElement("style");
        css.innerHTML = `
            #modelUploadInputButton {
                position: absolute;
                top: 1rem;
                left: 1rem;
                pointer-events: all;
                cursor: pointer;
                font-size: 1.5rem;
                color: #ffffff;
                background-color: #FC4F91;
                padding: 0.4rem 0.8rem;
                border: none;
                border-radius: 0.5rem;

                @media screen and (max-width: 768px) {
                    font-size: 0.7rem;
                }
            }
            #modelUploadInputField {
                display: none;
            }
        `;
        document.getElementsByTagName("head")[0].appendChild(css);

        modelUploadInputButton.appendChild(modelUploadInputField);

        modelUploadInputButton.onclick = (e: MouseEvent) => {
            e.stopPropagation();
            modelUploadInputField.click();
        };

        // read file
        modelUploadInputField.onchange = async (e: Event) => {
            e.stopPropagation();
            const target = e.target as HTMLInputElement;
            const file = (target.files as FileList)[0];

            // Reset the input field to allow uploading the same file again
            target.value = "";

            this._loadModelFromFile(file);
        };

        this._overlayContainerElement.appendChild(modelUploadInputButton);
    }

    private _createImageUploadToggleButton(): void {
        const toggleImageEditingButton = document.createElement("button");
        toggleImageEditingButton.id = "toggleImageEditingButton";
        toggleImageEditingButton.innerHTML = "Toggle Image Editing";

        const css = document.createElement("style");
        css.innerHTML = `
            #toggleImageEditingButton {
                position: absolute;
                top: 1rem;
                left: 13rem;
                pointer-events: all;
                cursor: pointer;
                font-size: 1.5rem;
                color: #ffffff;
                background-color: #8a8a8a;
                padding: 0.4rem 0.8rem;
                border: none;
                border-radius: 0.5rem;

                @media screen and (max-width: 768px) {
                    font-size: 0.7rem;
                    left: 7rem;
                }
            }
        `;
        document.getElementsByTagName("head")[0].appendChild(css);

        toggleImageEditingButton.onclick = (e: MouseEvent) => {
            e.stopPropagation();
            SCENE_SETTINGS.isEditingPictureMode =
                !SCENE_SETTINGS.isEditingPictureMode;

            const uploadImageGuideText = document.getElementById(
                "uploadImageGuideText",
            )!;
            if (SCENE_SETTINGS.isEditingPictureMode) {
                toggleImageEditingButton.style.backgroundColor = "#fc4f91";
                uploadImageGuideText.style.display = "block";
            } else {
                SCENE_SETTINGS.editingImage = null;
                toggleImageEditingButton.style.backgroundColor = "#8a8a8a";
                uploadImageGuideText.style.display = "none";
            }

            this._setupImageUpload();
        };
        this._overlayContainerElement.appendChild(toggleImageEditingButton);

        this._createUploadImageButton();
    }

    private _createUploadImageButton(): void {
        const uploadImageGuideText = document.createElement("div");
        uploadImageGuideText.id = "uploadImageGuideText";
        uploadImageGuideText.style.fontFamily = "Roboto, sans-serif";
        uploadImageGuideText.innerHTML = `
            <p>Click on the picture you want to update image for.</p>
            <p>Then upload your image to replace image.</p>
        `;

        const editingImageSide = document.createElement("p");
        editingImageSide.id = "editingImageSide";
        editingImageSide.innerHTML = `Editing image: ${SCENE_SETTINGS.editingImage ?? "None"
            }`;
        uploadImageGuideText.appendChild(editingImageSide);

        SCENE_SETTINGS.imageUploadInputField = document.createElement("input");
        SCENE_SETTINGS.imageUploadInputField.id = "imageUploadInputField";
        SCENE_SETTINGS.imageUploadInputField.type = "file";
        SCENE_SETTINGS.imageUploadInputField.accept = "image/*";
        SCENE_SETTINGS.imageUploadInputField.multiple = true;
        const css = document.createElement("style");
        css.innerHTML = `
            #uploadImageGuideText {
                display: none;
                position: absolute;
                top: 1rem;
                left: auto;
                right: 1rem;
                font-size: 1.8rem;
                font-weight: 700;
                text-align: right;

                @media screen and (max-width: 768px) {
                    font-size: 0.7rem;
                    top: 3rem;
                    left: 1rem;
                    right: auto;
                    text-align: left;
                }
            }
            #imageUploadInputField {
                display: none;
            }
        `;
        document.getElementsByTagName("head")[0].appendChild(css);

        this._overlayContainerElement.appendChild(uploadImageGuideText);

        // read file
        SCENE_SETTINGS.imageUploadInputField.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = (target.files as FileList)[0];

            // Reset the input field to allow uploading the same file again
            target.value = "";

            // get src from uploaded file
            const src = URL.createObjectURL(file);

            this._core.atom.updatePictureInAtom(src, SCENE_SETTINGS.editingImage!);
        };
    }

    private _setupImageUpload(): void {
        let editingPictureCamera: Nullable<ArcRotateCamera> = null;
        if (SCENE_SETTINGS.isEditingPictureMode) {
            if (editingPictureCamera !== null) return;
            editingPictureCamera = new ArcRotateCamera(
                "editingPictureCamera",
                -Math.PI * 0.5,
                Math.PI * 0.5,
                10,
                new Vector3(0, this._core.atom.dimensions.height, 0),
                this._core.scene,
            );
            editingPictureCamera.position = new Vector3(
                0,
                this._core.atom.dimensions.height,
                0,
            );

            // widen camera FOV on narrows screens
            if (window.innerWidth < window.innerHeight) {
                editingPictureCamera.fov = 1.3;
            } else {
                editingPictureCamera.fov = 1;
            }

            // prevent clipping
            editingPictureCamera.minZ = 0.1;

            // camera min distance and max distance
            editingPictureCamera.lowerRadiusLimit = 0;
            editingPictureCamera.upperRadiusLimit = 0;

            //  lower rotation sensitivity, higher value = less sensitive
            editingPictureCamera.angularSensibilityX = 3000;
            editingPictureCamera.angularSensibilityY = 3000;

            // disable rotation using keyboard arrow key
            editingPictureCamera.keysUp = [];
            editingPictureCamera.keysDown = [];
            editingPictureCamera.keysLeft = [];
            editingPictureCamera.keysRight = [];

            // disable panning
            editingPictureCamera.panningSensibility = 0;

            this._core.scene.switchActiveCamera(editingPictureCamera);
        } else {
            this._core.scene.switchActiveCamera(this._core.camera);
        }
    }
}

export default OverlayElements;
