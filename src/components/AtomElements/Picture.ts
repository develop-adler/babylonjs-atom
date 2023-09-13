import {
    ActionManager,
    Color3,
    ExecuteCodeAction,
    Mesh,
    MeshBuilder,
    PointerEventTypes,
    PointerInfo,
    Scene,
    StandardMaterial,
    Texture,
    Vector3,
} from "@babylonjs/core";
import Atom from "../Atoms/Atom";
import { SCENE_SETTINGS } from "../../utils/global";

class Picture {
    private _scene: Scene;
    private _atom: Atom;
    private _src: string;
    private _pictureFrameMesh!: Mesh;
    private _pictureMesh!: Mesh;
    private _texture!: Texture;
    private _pictureFrameMaterial!: StandardMaterial;
    private _pictureMaterial!: StandardMaterial;
    private _side: PictureSide;

    constructor(src: string, scene: Scene, atom: Atom, side?: PictureSide) {
        this._src = src;
        this._scene = scene;
        this._atom = atom;
        this._side = side ?? "front";

        this.createPicture();
    }
    public get src(): string {
        return this._src;
    }
    public get scene(): Scene {
        return this._scene;
    }
    public get atom(): Atom {
        return this._atom;
    }
    public get side():
        | "front"
        | "leftFront"
        | "rightFront"
        | "leftBack"
        | "rightBack" {
        return this._side;
    }
    public get picture(): Mesh {
        return this._pictureMesh;
    }
    public get pictureFrame(): Mesh {
        return this._pictureFrameMesh;
    }
    public get texture(): Texture {
        return this._texture;
    }

    private createPicture(): void {
        const image = new Image();
        image.src = this._src;

        let imgWidth = 0;
        let imgHeight = 0;
        let pictureFrameMeshWidth = this._atom.dimensions.width * 2.25;
        let pictureFrameMeshHeight = this._atom.dimensions.height * 2.25;

        if (this._side !== "front") {
            pictureFrameMeshWidth = this._atom.dimensions.width;
            pictureFrameMeshHeight = this._atom.dimensions.height;
        }

        // create materials
        this._pictureFrameMaterial = new StandardMaterial(
            `pictureFrame_${this._src}_material`,
            this._scene,
        );
        this._pictureFrameMaterial.diffuseColor = new Color3(0.25, 0.25, 0.25);

        this._pictureMaterial = new StandardMaterial(
            `picture_${this._src}_material`,
            this._scene,
        );
        this._texture = new Texture(this._src, this._scene);
        this._pictureMaterial.diffuseTexture = this._texture;
        this._pictureMaterial.emissiveColor = new Color3(0.5, 0.5, 0.5); // brighten image
        this._pictureMaterial.useAlphaFromDiffuseTexture = true;

        // get the aspect ratio of the image and apply the ratio to the picture frame mesh
        image.onload = () => {
            imgWidth = image.width; // Get the width
            imgHeight = image.height; // Get the height

            const aspectRatio = imgWidth / imgHeight;

            if (imgHeight > imgWidth) {
                // if the height is greater than the width, then the image is portrait
                pictureFrameMeshWidth *= aspectRatio;
            } else {
                // if the width is greater than the height, then the image is landscape
                pictureFrameMeshHeight /= aspectRatio;
            }

            switch (this._side) {
                case "front":
                    this._pictureFrameMesh = MeshBuilder.CreateBox(
                        "pictureFrame_" + this._src + "_mesh",
                        {
                            width: pictureFrameMeshWidth,
                            height: pictureFrameMeshHeight,
                            depth: 0.02,
                        },
                        this._scene,
                    );
                    this._pictureFrameMesh.material = this._pictureFrameMaterial;

                    this._pictureMesh = MeshBuilder.CreatePlane(
                        "picture_" + this._src + "_mesh",
                        {
                            width: pictureFrameMeshWidth - 0.1,
                            height: pictureFrameMeshHeight - 0.1,
                        },
                        this._scene,
                    );
                    this._pictureMesh.material = this._pictureMaterial;

                    // fix picture position and rotation
                    this._pictureMesh.position.z = 0.011;
                    this._pictureMesh.rotation.y = Math.PI;

                    // attach to picture frame
                    this._pictureMesh.parent = this._pictureFrameMesh;

                    this._pictureFrameMesh.receiveShadows = true;
                    this._pictureMesh.receiveShadows = true;

                    // position picture frame
                    if (imgHeight > imgWidth) {
                        this._pictureFrameMesh.position = new Vector3(
                            0,
                            this._atom.dimensions.height * 1.5,
                            -this._atom.dimensions.depth * 2,
                        );
                    } else {
                        // position picture frame
                        this._pictureFrameMesh.position = new Vector3(
                            0,
                            this._atom.dimensions.height * (1.5 / aspectRatio),
                            -this._atom.dimensions.depth * 2,
                        );
                    }
                    break;
                case "leftFront":
                    this._pictureFrameMesh = MeshBuilder.CreateBox(
                        "pictureFrame_" + this._src + "_mesh",
                        {
                            width: 0.02,
                            height: pictureFrameMeshHeight,
                            depth: pictureFrameMeshWidth,
                        },
                        this._scene,
                    );
                    this._pictureFrameMesh.material = this._pictureFrameMaterial;

                    this._pictureMesh = MeshBuilder.CreatePlane(
                        "picture_" + this._src + "_mesh",
                        {
                            width: pictureFrameMeshWidth - 0.1,
                            height: pictureFrameMeshHeight - 0.1,
                        },
                        this._scene,
                    );
                    this._pictureMesh.material = this._pictureMaterial;

                    // fix picture position and rotation
                    this._pictureMesh.position.x = -0.011;
                    this._pictureMesh.rotation.y = Math.PI * 0.5;

                    // attach to picture frame
                    this._pictureMesh.parent = this._pictureFrameMesh;

                    this._pictureFrameMesh.receiveShadows = true;
                    this._pictureMesh.receiveShadows = true;

                    // position picture frame
                    this._pictureFrameMesh.position = new Vector3(
                        this._atom.dimensions.width * 2,
                        this._atom.dimensions.height,
                        -this._atom.dimensions.depth * 1.15,
                    );
                    break;
                case "rightFront":
                    this._pictureFrameMesh = MeshBuilder.CreateBox(
                        "pictureFrame_" + this._src + "_mesh",
                        {
                            width: 0.02,
                            height: pictureFrameMeshHeight,
                            depth: pictureFrameMeshWidth,
                        },
                        this._scene,
                    );
                    this._pictureFrameMesh.material = this._pictureFrameMaterial;

                    this._pictureMesh = MeshBuilder.CreatePlane(
                        "picture_" + this._src + "_mesh",
                        {
                            width: pictureFrameMeshWidth - 0.1,
                            height: pictureFrameMeshHeight - 0.1,
                        },
                        this._scene,
                    );
                    this._pictureMesh.material = this._pictureMaterial;

                    // fix picture position and rotation
                    this._pictureMesh.position.x = 0.011;
                    this._pictureMesh.rotation.y = -Math.PI * 0.5;

                    // attach to picture frame
                    this._pictureMesh.parent = this._pictureFrameMesh;

                    this._pictureFrameMesh.receiveShadows = true;
                    this._pictureMesh.receiveShadows = true;

                    // position picture frame
                    this._pictureFrameMesh.position = new Vector3(
                        -this._atom.dimensions.width * 2,
                        this._atom.dimensions.height,
                        -this._atom.dimensions.depth * 1.15,
                    );
                    break;
                case "leftBack":
                    this._pictureFrameMesh = MeshBuilder.CreateBox(
                        "pictureFrame_" + this._src + "_mesh",
                        {
                            width: 0.02,
                            height: pictureFrameMeshHeight,
                            depth: pictureFrameMeshWidth,
                        },
                        this._scene,
                    );
                    this._pictureFrameMesh.material = this._pictureFrameMaterial;

                    this._pictureMesh = MeshBuilder.CreatePlane(
                        "picture_" + this._src + "_mesh",
                        {
                            width: pictureFrameMeshWidth - 0.1,
                            height: pictureFrameMeshHeight - 0.1,
                        },
                        this._scene,
                    );
                    this._pictureMesh.material = this._pictureMaterial;

                    // fix picture position and rotation
                    this._pictureMesh.position.x = -0.011;
                    this._pictureMesh.rotation.y = Math.PI * 0.5;

                    // attach to picture frame
                    this._pictureMesh.parent = this._pictureFrameMesh;

                    this._pictureFrameMesh.receiveShadows = true;
                    this._pictureMesh.receiveShadows = true;

                    // position picture frame
                    this._pictureFrameMesh.position = new Vector3(
                        this._atom.dimensions.width * 2,
                        this._atom.dimensions.height,
                        this._atom.dimensions.depth * 1.15,
                    );
                    break;
                case "rightBack":
                    this._pictureFrameMesh = MeshBuilder.CreateBox(
                        "pictureFrame_" + this._src + "_mesh",
                        {
                            width: 0.02,
                            height: pictureFrameMeshHeight,
                            depth: pictureFrameMeshWidth,
                        },
                        this._scene,
                    );
                    this._pictureFrameMesh.material = this._pictureFrameMaterial;

                    this._pictureMesh = MeshBuilder.CreatePlane(
                        "picture_" + this._src + "_mesh",
                        {
                            width: pictureFrameMeshWidth - 0.1,
                            height: pictureFrameMeshHeight - 0.1,
                        },
                        this._scene,
                    );
                    this._pictureMesh.material = this._pictureMaterial;

                    // fix picture position and rotation
                    this._pictureMesh.position.x = 0.011;
                    this._pictureMesh.rotation.y = -Math.PI * 0.5;

                    // attach to picture frame
                    this._pictureMesh.parent = this._pictureFrameMesh;

                    this._pictureFrameMesh.receiveShadows = true;
                    this._pictureMesh.receiveShadows = true;

                    // position picture frame
                    this._pictureFrameMesh.position = new Vector3(
                        -this._atom.dimensions.width * 2,
                        this._atom.dimensions.height,
                        this._atom.dimensions.depth * 1.15,
                    );
                    break;
            }

            this._atom.addMeshesToReflectionList([
                this._pictureFrameMesh,
                this._pictureMesh,
            ]);

            const pictureSideMap = {
                front: "Front",
                leftFront: "Left Front",
                rightFront: "Right Front",
                leftBack: "Left Back",
                rightBack: "Right Back",
            };

            // on hover event for picture
            const actionManager = new ActionManager(this._scene);
            actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
                    // change cursor to pointer on hover
                    if (!SCENE_SETTINGS.isEditingPictureMode) return;
                    this._scene.hoverCursor = "pointer";
                    this._pictureFrameMaterial.diffuseColor = Color3.Yellow();
                    this._pictureFrameMaterial.emissiveColor = Color3.Yellow();
                }),
            );
            actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
                    // change cursor to default on hover out
                    if (!SCENE_SETTINGS.isEditingPictureMode) return;
                    this._scene.hoverCursor = "default";
                    this._pictureFrameMaterial.diffuseColor = new Color3(
                        0.25,
                        0.25,
                        0.25,
                    );
                    this._pictureFrameMaterial.emissiveColor = Color3.Black();
                }),
            );
            this._pictureMesh.actionManager = actionManager;

            // on click event for picture in editing mode
            this._scene.onPointerObservable.add((pointerInfo: PointerInfo) => {
                switch (pointerInfo.type) {
                    case PointerEventTypes.POINTERPICK:
                        if (!SCENE_SETTINGS.isEditingPictureMode) return;
                        if (!pointerInfo?.pickInfo?.hit) return;

                        if (
                            pointerInfo?.pickInfo.pickedMesh?.name === this._pictureMesh.name
                        ) {
                            SCENE_SETTINGS.editingImage = this._side;
                            SCENE_SETTINGS.imageUploadInputField.click();

                            const editingImageSide =
                                document.getElementById("editingImageSide")!;
                            editingImageSide.innerHTML = `Editing image: ${pictureSideMap[SCENE_SETTINGS.editingImage] ?? "None"
                                }`;
                            return;
                        }
                        break;
                }
            });
        };
    }

    public dispose(): void {
        this._scene.removeMesh(this._pictureFrameMesh);
        this._scene.removeMesh(this._pictureMesh);
        this._scene.removeTexture(this._texture);
        this._scene.removeMaterial(this._pictureFrameMaterial);
        this._scene.removeMaterial(this._pictureMaterial);

        this._pictureFrameMesh.dispose();
        this._pictureMesh.dispose();
        this._texture.dispose();
        this._pictureFrameMaterial.dispose();
        this._pictureMaterial.dispose();
    }
}

export default Picture;
