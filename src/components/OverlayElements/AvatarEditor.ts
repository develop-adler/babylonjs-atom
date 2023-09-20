import { FEMALE_PARTS, MALE_PARTS } from "../../utils/global";
import Core from "../Core";

class AvatarEditor {
    private _core: Core;
    private _overlayContainer: HTMLDivElement;
    private _editorOverlay: HTMLDivElement;
    // private _avatarViewer!: HTMLDivElement;
    private _partSelection!: HTMLDivElement;

    private _currentCategory: string = "gender";
    private _partStyleImageElements: Array<HTMLImageElement | null>;
    private _partStylePath: string;
    private _partStyleImageList!: string[];

    constructor(overlay: HTMLDivElement, core: Core) {
        this._overlayContainer = overlay;
        this._core = core;

        this._editorOverlay = document.createElement("div");
        this._editorOverlay.id = "avatarEditingOverlay";
        this._editorOverlay.style.display = "none";
        this._editorOverlay.style.position = "absolute";
        this._editorOverlay.style.top = "0";
        this._editorOverlay.style.right = "0";
        this._editorOverlay.style.width = "33%";
        this._editorOverlay.style.height = "100%";
        this._editorOverlay.style.pointerEvents = "all";
        this._editorOverlay.style.background = "rgba(255, 255, 255, 0.9)";
        this._editorOverlay.style.backdropFilter = "blur(0.3125rem)";

        this._overlayContainer.appendChild(this._editorOverlay);
        this._partStylePath = "/images/parts/";
        this._partStyleImageList = [];
        this._partStyleImageElements = [];

        // this._createAvatarView();
        this._createPartSelection();
    }
    public get editorOverlay(): HTMLDivElement {
        return this._editorOverlay;
    }

    // private _createAvatarView(): void {
    //     this._avatarViewer = document.createElement("div");
    //     this._avatarViewer.id = "avatarViewer";
    //     this._avatarViewer.style.width = "45%";

    //     this._editorOverlay.appendChild(this._avatarViewer);
    // }

    private _createPartSelection(): void {
        this._partSelection = document.createElement("div");
        this._partSelection.id = "partSelection";
        this._partSelection.style.display = "flex";
        this._partSelection.style.flexDirection = "column";
        // this._partSelection.style.alignItems = "center";
        // this._partSelection.style.justifyContent = "center";
        // this._partSelection.style.textAlign = "center";
        this._partSelection.style.flexGrow = "1";
        this._partSelection.style.borderLeft = "1px solid #000";

        this._editorOverlay.appendChild(this._partSelection);

        this._createBodyPartSelectionContainer();
    }

    private _createBodyPartSelectionContainer(): void {
        const bodyPartSelectionContainer = document.createElement("div");
        bodyPartSelectionContainer.id = "bodyPartSelectionContainer";

        bodyPartSelectionContainer.innerHTML = `
            <div id="bodyPartSelectionButtonContainer"></div>
            <hr id="bodyPartSelectionButtonContainerLinebreak" />
        `;

        this._partSelection.appendChild(bodyPartSelectionContainer);

        const buttonCSS = document.createElement("style");
        buttonCSS.innerHTML = `
            #bodyPartSelectionContainer {
                display: block;
                width: auto;
                height: auto;
                border: 2px solid red;
            }

            #bodyPartSelectionButtonContainer {
                display: flex;
                margin-top: 1rem;
            }

            #bodyPartSelectionButtonContainerLinebreak {
                height: 0.2rem;
                border: none;
                background: #00000066;
                margin: 2rem 0;
            }
            
            .bodyPartSelectionButton {
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                width: auto;
                height: 2rem;
                border: none;
                border-bottom: 0.2rem solid #FC4F9100;
                border-radius: 0;
                outline: none;
                padding: 1.4rem 1rem;
                margin: 0 0.8rem 0.2rem 0.8rem;
                cursor: pointer;
                font-size: 1.5rem;
                font-weight: 700;
                background: none;
            }

            .bodyPartSelectionButton:hover {
                border-bottom: 0.2rem solid #FC4F91;
            }

            .selectedCategory {
                border-bottom: 0.2rem solid #FC4F91;
            }

            .partStyleImage {
                width: auto;
                height: 14rem;
                border: none;
                cursor: pointer;
                margin: 2rem;
                outline: 0.01rem solid #000;

                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
            }

            .partStyleImage:hover {
                outline: 0.3rem solid #FC4F91;
            }

            .partStyleImageSelected {
                outline: 0.3rem solid #FC4F91;
            }
        `;
        document.head.appendChild(buttonCSS);

        // create category buttons
        const categories = ["gender", "hair", "top", "bottom", "shoes"];
        const bodyPartSelectionButtonContainer = document.getElementById(
            "bodyPartSelectionButtonContainer",
        )!;

        // initialize category buttons
        categories.forEach(name => {
            const bodyPartSelectionButton = document.createElement("button");
            bodyPartSelectionButton.classList.add("bodyPartSelectionButton");
            bodyPartSelectionButton.innerHTML =
                name.charAt(0).toUpperCase() + name.slice(1);

            switch (name) {
                case "gender":
                    bodyPartSelectionButton.classList.add("selectedCategory");
                    bodyPartSelectionButton.onclick = () => {
                        if (this._currentCategory === "gender") {
                            return;
                        }

                        // remove selected category class from all buttons
                        const bodyPartSelectionButtons = document.getElementsByClassName(
                            "bodyPartSelectionButton",
                        );
                        for (let i = 0; i < bodyPartSelectionButtons.length; i++) {
                            const button = bodyPartSelectionButtons[i] as HTMLButtonElement;
                            if (button.classList.contains("selectedCategory")) {
                                button.classList.remove("selectedCategory");
                            }
                        }
                        bodyPartSelectionButton.classList.add("selectedCategory");

                        this._currentCategory = "gender";
                        this._partStyleImageList = ["male", "female"];
                        this._partStylePath = "/images/parts/";

                        this._partStyleImageElements.forEach(image => {
                            // remove button from the DOM
                            image?.remove();
                            image = null;
                        });
                        this._partStyleImageElements = [];

                        this._createPartStyleImages(bodyPartSelectionContainer);
                    };
                    break;
                default:
                    bodyPartSelectionButton.onclick = () => {
                        this._currentCategory = name;

                        // remove selected category class from all buttons
                        const bodyPartSelectionButtons = document.getElementsByClassName(
                            "bodyPartSelectionButton",
                        );
                        for (let i = 0; i < bodyPartSelectionButtons.length; i++) {
                            const button = bodyPartSelectionButtons[i] as HTMLButtonElement;
                            if (button.classList.contains("selectedCategory")) {
                                button.classList.remove("selectedCategory");
                            }
                        }
                        bodyPartSelectionButton.classList.add("selectedCategory");

                        this._partStyleImageList = []; // clear list before pushing new items
                        const parts =
                            this._core.avatar.gender === "male" ? MALE_PARTS : FEMALE_PARTS;
                        parts[name as keyof GenderParts].forEach((_, index) => {
                            this._partStyleImageList.push(`${index + 1}`);
                        });
                        this._partStylePath = `/images/parts/${this._core.avatar.gender}/${name}/`;

                        this._partStyleImageElements.forEach(image => {
                            // remove button from the DOM
                            image?.remove();
                            image = null;
                        });
                        this._partStyleImageElements = [];

                        this._createPartStyleImages(bodyPartSelectionContainer);
                    };
                    break;
            }

            bodyPartSelectionButtonContainer.appendChild(bodyPartSelectionButton);
        });

        // set to gender by default
        this._partStyleImageList = ["male", "female"];
        this._partStylePath = "/images/parts/";

        this._createPartStyleImages(bodyPartSelectionContainer);
    }

    private _createPartStyleImages(container: HTMLDivElement): void {
        // create part style buttons
        this._partStyleImageList.forEach(name => {
            const partStyleImage = document.createElement("img");
            partStyleImage.classList.add("partStyleImage");
            partStyleImage.src = `${this._partStylePath}${name}.avif`;
            partStyleImage.alt = name;

            // disable right click and click-and-drag
            partStyleImage.oncontextmenu = () => false;
            partStyleImage.ondragstart = () => false;

            // highlight image
            if (this._currentCategory === "gender") {
                if (name === localStorage.getItem("avatarGender")) {
                    partStyleImage.classList.add("partStyleImageSelected");
                }
            } else {
                // check the index of the current part style in gender parts
                // if it matches the index of the current part style in the current category,
                // highlight the image
                if (
                    Number(name) - 1 ===
                    MALE_PARTS[this._currentCategory as keyof GenderParts].indexOf(
                        this._core.avatar.parts[
                        this._currentCategory as keyof GenderParts
                        ][0],
                    ) ||
                    Number(name) - 1 ===
                    FEMALE_PARTS[this._currentCategory as keyof GenderParts].indexOf(
                        this._core.avatar.parts[
                        this._currentCategory as keyof GenderParts
                        ][0],
                    )
                ) {
                    partStyleImage.classList.add("partStyleImageSelected");
                }
            }

            partStyleImage.onclick = () => {
                // remove selected category class from all buttons
                this._partStyleImageElements.forEach(image => {
                    if (image?.classList.contains("partStyleImageSelected")) {
                        image.classList.remove("partStyleImageSelected");
                    }
                });

                // add selected class to clicked button
                partStyleImage.classList.add("partStyleImageSelected");

                if (this._currentCategory === "gender") {
                    if (name !== localStorage.getItem("avatarGender")) {
                        this._core.avatar.changeGender(name as Gender);
                    }
                } else {
                    this._core.avatar.changePartStyle(
                        this._currentCategory,
                        name as keyof GenderParts,
                    );
                }
            };

            container.appendChild(partStyleImage);

            this._partStyleImageElements.push(partStyleImage);
        });
    }
}

export default AvatarEditor;
