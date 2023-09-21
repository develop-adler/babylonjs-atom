import {
    AbstractMesh,
    ArcRotateCamera,
    Nullable,
    Vector3,
} from "@babylonjs/core";
import { SCENE_SETTINGS } from "../utils/global";
import Core from "./Core";
import AvatarEditor from "./OverlayElements/AvatarEditor";

class OverlayElements {
    private _core: Core;

    private _appElement: HTMLElement;
    private _overlayContainerElement!: HTMLDivElement;
    private _buttonContainerElement!: HTMLDivElement;
    // private _controlSwitchElement!: HTMLDivElement;

    constructor(core: Core) {
        this._core = core;
        this._appElement = document.getElementById("app")!;

        this._createOverlayContainer();
        this._createButtonContainer();
        // this._createControlSwitchElement();
        this._createToggleImageEditingButton();
        this._createModelEditingUI();
        this._createToggleAvatarEditingButton();
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
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                z-index: 5;
            }
        `;
        document.getElementsByTagName("head")[0].appendChild(css);
        this._appElement.appendChild(this._overlayContainerElement);
    }

    private _createButtonContainer(): void {
        this._buttonContainerElement = document.createElement("div");
        this._buttonContainerElement.id = "buttonContainer";
        const css = document.createElement("style");
        css.innerHTML = `
            #buttonContainer {
                display: flex;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 5%;
                padding: 1rem 1rem;
                pointer-events: none;
                z-index: 6;
            }
        `;
        document.getElementsByTagName("head")[0].appendChild(css);
        this._overlayContainerElement.appendChild(this._buttonContainerElement);
    }

    // private _createControlSwitchElement(): void {
    //     // this._controlSwitchElement = document.createElement("div");
    //     // this._controlSwitchElement.id = "controlSwitch";
    //     const css = document.createElement("style");
    //     css.innerHTML = `
    //         #controlSwitch {
    //             pointer-events: none;
    //             position: absolute;
    //             right: 2rem;
    //             bottom: 2.5rem;
    //             // background-color: rgba(102, 102, 102, 0.50);
    //             // backdrop-filter: blur(0.3125rem);
    //             // border-radius: 1.5rem;
    //             border: none;
    //             outline: none;
    //             padding: 0;
    //             scale: 1;
    //             transition: all 0.4s ease-in-out;

    //             @media screen and (max-width: 768px) {
    //                 right: -3rem;
    //                 bottom: -0.4rem;
    //                 scale: 0.5;
    //             }
    //         }

    //         input[type=checkbox]{
    //             height: 0;
    //             width: 0;
    //             visibility: hidden;
    //         }
        
    //         #toggle {
    //             pointer-events: all;
    //             cursor: pointer;
    //             text-indent: -9999px;
    //             width: 200px;
    //             height: 100px;
    //             background: #FC4F91;
    //             display: block;
    //             border-radius: 100px;
    //             position: relative;
    //             // transition: background-color 0.2s ease-in-out;
    //             scale: 0.7;
    //         }
        
    //         #toggle:after {
    //             content: '';
    //             position: absolute;
    //             top: 5px;
    //             left: 5px;
    //             width: 90px;
    //             height: 90px;
    //             background: #fff;
    //             border-radius: 90px;
    //             transition: 0.3s;
    //         }
        
    //         // input:checked + #toggle {
    //         //     background: #bada55;
    //         // }
        
    //         input:checked + #toggle:after {
    //             left: calc(100% - 5px);
    //             transform: translateX(-100%);
    //         }
        
    //         #toggle:active:after {
    //             width: 130px;
    //         }
    //     `;
    //     document.getElementsByTagName("head")[0].appendChild(css);

    //     const toggleInput = document.createElement("input");
    //     toggleInput.type = "checkbox";
    //     toggleInput.id = "toggleInput";

    //     const toggleLabel = document.createElement("label");
    //     toggleLabel.id = "toggle";
    //     toggleLabel.htmlFor = "toggleInput";

    //     // this._controlSwitchElement.appendChild(toggleInput);
    //     // this._controlSwitchElement.appendChild(toggleLabel);

    //     toggleLabel.onclick = (e: MouseEvent) => {
    //         if (
    //             SCENE_SETTINGS.isEditingModelMode ||
    //             SCENE_SETTINGS.isEditingPictureMode
    //         ) {
    //             e.preventDefault();
    //             window.alert("Please turn off editing mode first!");
    //             return;
    //         }
    //         e.stopPropagation();

    //         if (SCENE_SETTINGS.isThirdperson) {
    //             this._core.setFirstperson();
    //         } else {
    //             this._core.setThirdperson();
    //         }
    //     };

    //     this._overlayContainerElement.appendChild(// this._controlSwitchElement);
    // }

    private _createModelEditingUI(): void {
        this._createToggleModelEditingButton();
        this._createModelTransformButtons();
    }

    private _createModelTransformButtons(): void {
        const modelTransformButtonsContainer = document.createElement("div");
        modelTransformButtonsContainer.id = "modelTransformButtonsContainer";

        const modelTransformButtonTop = document.createElement("button");
        modelTransformButtonTop.id = "modelTransformButtonTop";
        modelTransformButtonTop.classList.add("modelTransformButtons");

        modelTransformButtonTop.innerHTML = `
            <svg fill="white" viewBox="0 0 16 16" height="2.6rem" width="2.6rem">
                <path
                    fillRule="evenodd"
                    d="M7.646.146a.5.5 0 01.708 0l2 2a.5.5 0 01-.708.708L8.5 1.707V5.5a.5.5 0 01-1 0V1.707L6.354 2.854a.5.5 0 11-.708-.708l2-2zM8 10a.5.5 0 01.5.5v3.793l1.146-1.147a.5.5 0 01.708.708l-2 2a.5.5 0 01-.708 0l-2-2a.5.5 0 01.708-.708L7.5 14.293V10.5A.5.5 0 018 10zM.146 8.354a.5.5 0 010-.708l2-2a.5.5 0 11.708.708L1.707 7.5H5.5a.5.5 0 010 1H1.707l1.147 1.146a.5.5 0 01-.708.708l-2-2zM10 8a.5.5 0 01.5-.5h3.793l-1.147-1.146a.5.5 0 01.708-.708l2 2a.5.5 0 010 .708l-2 2a.5.5 0 01-.708-.708L14.293 8.5H10.5A.5.5 0 0110 8z"
                />
            </svg>
        `;

        const modelTransformButtonMiddle = document.createElement("button");
        modelTransformButtonMiddle.id = "modelTransformButtonMiddle";
        modelTransformButtonMiddle.classList.add("modelTransformButtons");

        modelTransformButtonMiddle.innerHTML = `
            <svg
                fill="none"
                stroke="white"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                viewBox="0 0 24 24"
                height="2.6rem"
                width="2.6rem"
            >
                <path stroke="none" d="M0 0h24v24H0z" />
                <path d="M20 11A8.1 8.1 0 004.5 9M4 5v4h4M4 13a8.1 8.1 0 0015.5 2m.5 4v-4h-4" />
                <path d="M13 12 A1 1 0 0 1 12 13 A1 1 0 0 1 11 12 A1 1 0 0 1 13 12 z" />
            </svg>
        `;

        const modelTransformButtonBottom = document.createElement("button");
        modelTransformButtonBottom.id = "modelTransformButtonBottom";
        modelTransformButtonBottom.classList.add("modelTransformButtons");

        modelTransformButtonBottom.innerHTML = `
            <svg viewBox="0 0 64 64" fill="white" height="2.4rem" width="2.4rem">
                <path
                    fill="none"
                    stroke="white"
                    strokeWidth={4}
                    d="M1 28V1h62v62H36"
                />
                <path
                    fill="white"
                    stroke="white"
                    strokeWidth={4}
                    d="M1 33h30v30H1z"
                />
                <path
                    fill="none"
                    stroke="white"
                    strokeLinejoin="bevel"
                    strokeWidth={4}
                    d="M57 20V9H46"
                />
                <path fill="none" stroke="white" strokeWidth={4} d="M57 9L41 25" />
            </svg>
        `;

        const modelTransformButtonsCSS = document.createElement("style");
        modelTransformButtonsCSS.innerHTML = `
            #modelTransformButtonsContainer {
                display: none;
                position: absolute;
                left: 1%;
                top: 10%;
                height: max-content;
                width: 5rem;
            }

            .modelTransformButtons {
                pointer-events: all;
                cursor: default;
                height: 5rem;
                width: 5rem;
                background-color: #1f2937;
                padding: 1rem;
                color: white;
                outline: 1px solid #4b5563;
                outline-offset: -1px;
                border: none;

                border-top-left-radius: 0
                border-top-right-radius: 0
                border-bottom-left-radius: 0;
                border-bottom-right-radius: 0;
            }

            .modelTransformButtons:hover {
                background-color: #374151;
            }

            .transformButtonSelected {
                background-color: #152f6e;
            }
            
            .transformButtonSelected:hover {
                background-color: #171f29;
            }

            #modelTransformButtonTop {
                border-top-left-radius: 0.25rem;
                border-top-right-radius: 0.25rem;
                border-bottom-left-radius: 0;
                border-bottom-right-radius: 0;
            }

            #modelTransformButtonMiddle {
            }

            #modelTransformButtonBottom {
                border-top-left-radius: 0;
                border-top-right-radius: 0;
                border-bottom-left-radius: 0.25rem;
                border-bottom-right-radius: 0.25rem;
            }
        `;

        const toggleSelected = (
            e: MouseEvent,
            button: "top" | "middle" | "bottom",
        ) => {
            e.stopPropagation();
            switch (button) {
                case "top":
                    modelTransformButtonTop.classList.add("transformButtonSelected");
                    modelTransformButtonMiddle.classList.remove(
                        "transformButtonSelected",
                    );
                    modelTransformButtonBottom.classList.remove(
                        "transformButtonSelected",
                    );
                    break;
                case "middle":
                    modelTransformButtonMiddle.classList.add("transformButtonSelected");
                    modelTransformButtonTop.classList.remove("transformButtonSelected");
                    modelTransformButtonBottom.classList.remove(
                        "transformButtonSelected",
                    );
                    break;
                case "bottom":
                    modelTransformButtonBottom.classList.add("transformButtonSelected");
                    modelTransformButtonTop.classList.remove("transformButtonSelected");
                    modelTransformButtonMiddle.classList.remove(
                        "transformButtonSelected",
                    );
                    break;
            }
        };

        modelTransformButtonTop.onclick = (e: MouseEvent) => {
            toggleSelected(e, "top");
            this._core.gizmoManager.rotationGizmoEnabled = false;
            this._core.gizmoManager.scaleGizmoEnabled = false;
            this._core.gizmoManager.positionGizmoEnabled = true;
        };
        modelTransformButtonMiddle.onclick = (e: MouseEvent) => {
            toggleSelected(e, "middle");
            this._core.gizmoManager.positionGizmoEnabled = false;
            this._core.gizmoManager.scaleGizmoEnabled = false;
            this._core.gizmoManager.rotationGizmoEnabled = true;
        };
        modelTransformButtonBottom.onclick = (e: MouseEvent) => {
            toggleSelected(e, "bottom");
            this._core.gizmoManager.positionGizmoEnabled = false;
            this._core.gizmoManager.rotationGizmoEnabled = false;
            this._core.gizmoManager.scaleGizmoEnabled = true;
        };

        // have position gizmo selected by default
        modelTransformButtonTop.classList.add("transformButtonSelected")

        document
            .getElementsByTagName("head")[0]
            .appendChild(modelTransformButtonsCSS);
        modelTransformButtonsContainer.appendChild(modelTransformButtonTop);
        modelTransformButtonsContainer.appendChild(modelTransformButtonMiddle);
        modelTransformButtonsContainer.appendChild(modelTransformButtonBottom);

        this._overlayContainerElement.appendChild(modelTransformButtonsContainer);
    }

    private _createToggleModelEditingButton(): void {
        const toggleModelEditingButton = document.createElement("button");
        toggleModelEditingButton.id = "toggleModelEditingButton";
        toggleModelEditingButton.innerHTML = "Toggle Model Editing";

        const css = document.createElement("style");
        css.innerHTML = `
            #toggleModelEditingButton {
                margin-right: 0.6rem;
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
                    left: 15.2rem;
                }
            }
        `;
        document.getElementsByTagName("head")[0].appendChild(css);

        toggleModelEditingButton.onclick = (e: MouseEvent) => {
            e.stopPropagation();

            if (SCENE_SETTINGS.isEditingPictureMode) {
                window.alert("Please turn off picture editing mode first!");
                return;
            }

            SCENE_SETTINGS.isEditingModelMode = !SCENE_SETTINGS.isEditingModelMode;

            if (SCENE_SETTINGS.isEditingModelMode) {
                toggleModelEditingButton.style.backgroundColor = "#fc4f91";

                const modelTransformButtonsContainer = document.getElementById(
                    "modelTransformButtonsContainer",
                )!;
                modelTransformButtonsContainer.style.display = "block";

                const modelUploadInputButton = document.getElementById(
                    "modelUploadInputButton",
                )!;
                modelUploadInputButton.style.display = "block";

                // this._controlSwitchElement.style.display = "none";
            } else {
                SCENE_SETTINGS.editingImage = null;
                this._core.gizmoManager.attachToMesh(null);

                toggleModelEditingButton.style.backgroundColor = "#8a8a8a";

                const modelTransformButtonsContainer = document.getElementById(
                    "modelTransformButtonsContainer",
                )!;
                modelTransformButtonsContainer.style.display = "none";

                const modelUploadInputButton = document.getElementById(
                    "modelUploadInputButton",
                )!;
                modelUploadInputButton.style.display = "none";

                // this._controlSwitchElement.style.display = "block";
            }
            this._setupModelEditing();
        };
        this._buttonContainerElement.appendChild(toggleModelEditingButton);

        this._createModelUploadButton();
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
                display: none;
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

            this._core._loadModelFromFile(file);
        };

        this._buttonContainerElement.appendChild(modelUploadInputButton);
    }

    private _createToggleImageEditingButton(): void {
        const toggleImageEditingButton = document.createElement("button");
        toggleImageEditingButton.id = "toggleImageEditingButton";
        toggleImageEditingButton.innerHTML = "Toggle Image Editing";

        const css = document.createElement("style");
        css.innerHTML = `
            #toggleImageEditingButton {
                margin-right: 0.6rem;
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

            if (SCENE_SETTINGS.isEditingModelMode) {
                window.alert("Please turn off model editing mode first!");
                return;
            }

            SCENE_SETTINGS.isEditingPictureMode =
                !SCENE_SETTINGS.isEditingPictureMode;

            const uploadImageGuideText = document.getElementById(
                "uploadImageGuideText",
            )!;
            if (SCENE_SETTINGS.isEditingPictureMode) {
                toggleImageEditingButton.style.backgroundColor = "#fc4f91";
                uploadImageGuideText.style.display = "block";

                // this._controlSwitchElement.style.display = "none";
            } else {
                SCENE_SETTINGS.editingImage = null;
                toggleImageEditingButton.style.backgroundColor = "#8a8a8a";
                uploadImageGuideText.style.display = "none";

                // this._controlSwitchElement.style.display = "block";
            }

            this._setupImageUpload();
        };
        this._buttonContainerElement.appendChild(toggleImageEditingButton);

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
            this._core.avatar.hide();
            this._core.avatarController.stop();
            this._core.joystick.hide();
        } else {
            this._core.scene.switchActiveCamera(this._core.camera);
            this._core.avatar.show();
            this._core.avatarController.start();
            this._core.joystick.show();
        }
    }

    private _setupModelEditing(): void {
        let editingModelCamera: Nullable<ArcRotateCamera> = null;
        if (SCENE_SETTINGS.isEditingModelMode) {
            if (editingModelCamera !== null) return;
            editingModelCamera = new ArcRotateCamera(
                "editingModelCamera",
                -Math.PI * 0.5,
                Math.PI * 0.5,
                10,
                new Vector3(0, this._core.atom.dimensions.height * 0.5, 0),
                this._core.scene,
            );
            editingModelCamera.position = new Vector3(
                -this._core.atom.dimensions.width * 1.75,
                this._core.atom.dimensions.height * 2,
                this._core.atom.dimensions.depth * 2,
            );

            // widen camera FOV on narrows screens
            if (window.innerWidth < window.innerHeight) {
                editingModelCamera.fov = 1.3;
            } else {
                editingModelCamera.fov = 1;
            }

            // prevent clipping
            editingModelCamera.minZ = 0.1;

            editingModelCamera.wheelPrecision = 100;

            // camera min distance and max distance
            editingModelCamera.lowerRadiusLimit = 0;
            editingModelCamera.upperRadiusLimit = 20;

            //  lower rotation sensitivity, higher value = less sensitive
            editingModelCamera.angularSensibilityX = 3000;
            editingModelCamera.angularSensibilityY = 3000;

            // lower panning sensitivity, higher value = less sensitive
            editingModelCamera.panningSensibility = 1000;

            // disable rotation using keyboard arrow key
            editingModelCamera.keysUp = [];
            editingModelCamera.keysDown = [];
            editingModelCamera.keysLeft = [];
            editingModelCamera.keysRight = [];

            this._core.scene.switchActiveCamera(editingModelCamera);
            this._core.avatar.hide();
            this._core.avatarController.stop();
            this._core.joystick.hide();
        } else {
            this._core.scene.switchActiveCamera(this._core.camera);
            this._core.scene.meshes.forEach((mesh: AbstractMesh) => {
                mesh.renderOutline = false;
            });

            this._core.avatar.show();
            this._core.avatarController.start();
            this._core.joystick.show();
        }
    }

    private _createToggleAvatarEditingButton(): void {
        const toggleAvatarEditingButton = document.createElement("button");
        toggleAvatarEditingButton.id = "toggleAvatarEditingButton";
        toggleAvatarEditingButton.innerHTML = "Toggle Avatar Editing";

        const css = document.createElement("style");
        css.innerHTML = `
            #toggleAvatarEditingButton {
                margin-right: 0.6rem;
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

        const avatarEditor = new AvatarEditor(this._overlayContainerElement, this._core);

        toggleAvatarEditingButton.onclick = (e: MouseEvent) => {
            e.stopPropagation();

            if (SCENE_SETTINGS.isEditingModelMode) {
                window.alert("Please turn off model editing mode first!");
                return;
            }
            if (SCENE_SETTINGS.isEditingPictureMode) {
                window.alert("Please turn off picture editing mode first!");
                return;
            }

            SCENE_SETTINGS.isEditingAvatarMode =
                !SCENE_SETTINGS.isEditingAvatarMode;

            if (SCENE_SETTINGS.isEditingAvatarMode) {
                toggleAvatarEditingButton.style.backgroundColor = "#fc4f91";
                // this._controlSwitchElement.style.display = "none";
                avatarEditor.editorOverlay.style.display = "flex";
                this._core.joystick.hide();
            } else {
                toggleAvatarEditingButton.style.backgroundColor = "#8a8a8a";
                // this._controlSwitchElement.style.display = "block";
                avatarEditor.editorOverlay.style.display = "none";
                this._core.joystick.show();
            }
        };
        this._buttonContainerElement.appendChild(toggleAvatarEditingButton);
    }
}

export default OverlayElements;
