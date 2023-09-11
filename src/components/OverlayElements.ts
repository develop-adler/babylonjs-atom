import { Mesh, SceneLoader } from "@babylonjs/core";
import { SCENE_SETTINGS } from "../utils/global";
import Core from "./Core";

class OverlayElements {
    private _core: Core;

    private _appElement: HTMLElement;
    private _overlayContainerElement!: HTMLElement;
    private _controlSwitchElement!: HTMLElement;

    constructor(core: Core) {
        this._core = core;
        this._appElement = document.getElementById("app")!;

        this.createOverlayContainer();
        this.createControlSwitchElement();
        this.createFileUploadButton();
    }

    private async loadModelFromFile(file: File): Promise<void> {
        SceneLoader.ImportMesh(
            "",
            "",
            file,
            this._core.scene,
            (meshes, particleSystems, skeletons, animationGroups) => { //onSuccess
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
            (_, message, exception) => { // onError
                throw new Error(exception ?? `Error loading model: ${message}`);
            }
        );
    }

    private createFileUploadButton(): void {
        const fileUploadInputButton = document.createElement("button");
        fileUploadInputButton.id = "fileUploadInputButton";
        fileUploadInputButton.innerHTML = "Upload Model";

        const fileUploadInputField = document.createElement("input");
        fileUploadInputField.id = "fileUploadInputField";
        fileUploadInputField.type = "file";
        fileUploadInputField.accept = ".glb, .gltf";
        fileUploadInputField.multiple = true;
        const css = document.createElement("style");
        css.innerHTML = `
            #fileUploadInputButton {
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
            }
            #fileUploadInputField {
                display: none;
            }
        `;
        document.getElementsByTagName("head")[0].appendChild(css);

        fileUploadInputButton.appendChild(fileUploadInputField);

        fileUploadInputButton.onclick = (e: MouseEvent) => {
            e.stopPropagation();
            fileUploadInputField.click();
        };

        // read file
        fileUploadInputField.onchange = async (e: Event) => {
            e.stopPropagation();
            const target = e.target as HTMLInputElement;
            const file = (target.files as FileList)[0];

            // Reset the input field to allow uploading the same file again
            target.value = "";

            this.loadModelFromFile(file);
        };

        this._overlayContainerElement.appendChild(fileUploadInputButton);
    }

    private createOverlayContainer(): void {
        this._overlayContainerElement = document.createElement("div");
        this._overlayContainerElement.id = "overlayContainer";
        const css = document.createElement("style");
        css.innerHTML = `
            #overlayContainer {
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

    private createControlSwitchElement(): void {
        this._controlSwitchElement = document.createElement("div");
        this._controlSwitchElement.id = "controlSwitch";
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
                padding: 0;
                scale: 1;
            
                @media (max-width: 768px) {
                    left: auto;
                    right: 0.1rem;
                    bottom: 0.1rem;
                    scale: 0.8;
                }
                transition: all 0.4s ease-in-out;
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

        this._controlSwitchElement.appendChild(toggleInput);
        this._controlSwitchElement.appendChild(toggleLabel);

        toggleLabel.onclick = (e: MouseEvent) => {
            e.stopPropagation();
            this.switchControlMode();
        };

        this._overlayContainerElement.appendChild(this._controlSwitchElement);
    }

    private switchControlMode(): void {
        if (SCENE_SETTINGS.isThirdperson) {
            this._core.setFirstperson();
        } else {
            this._core.setThirdperson();
        }
    }
}

export default OverlayElements;
