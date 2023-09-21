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
import { isMobile } from "../../utils/functions";

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

    private static readonly PICTURE_FRAME_COLOR = new Color3(0.25, 0.25, 0.25);

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

        // create materials
        this._pictureFrameMaterial = new StandardMaterial(
            `pictureFrame_${this._src}_material`,
            this._scene,
        );
        this._pictureFrameMaterial.diffuseColor = Picture.PICTURE_FRAME_COLOR;
        
        // optimize material by freezing shader
        this._pictureFrameMaterial.freeze();

        this._pictureMaterial = new StandardMaterial(
            `picture_${this._src}_material`,
            this._scene,
        );
        this._texture = new Texture(this._src, this._scene);
        this._pictureMaterial.diffuseTexture = this._texture;
        this._pictureMaterial.emissiveColor = new Color3(0.5, 0.5, 0.5); // brighten image
        this._pictureMaterial.useAlphaFromDiffuseTexture = true;

        // optimize material by freezing shader
        this._pictureFrameMaterial.freeze();

        const createPictureFrameMesh = (
            width: number,
            height: number,
            depth: number,
        ) => {
            const pictureFrameMesh = MeshBuilder.CreateBox(
                "pictureFrame_" + this._src + "_mesh",
                {
                    width: width,
                    height: height,
                    depth: depth,
                },
                this._scene,
            );
            pictureFrameMesh.material = this._pictureFrameMaterial;
            pictureFrameMesh.receiveShadows = true;
            return pictureFrameMesh;
        };

        const createPictureMesh = (width: number, height: number) => {
            const pictureMesh = MeshBuilder.CreatePlane(
                "picture_" + this._src + "_mesh",
                {
                    width: width - 0.1,
                    height: height - 0.1,
                },
                this._scene,
            );
            pictureMesh.material = this._pictureMaterial;
            pictureMesh.receiveShadows = true;
            return pictureMesh;
        };

        // get the aspect ratio of the image and apply the ratio to the picture frame mesh
        image.onload = () => {
            const imgWidth = image.width; // Get the width
            const imgHeight = image.height; // Get the height
            const aspectRatio = imgWidth / imgHeight;

            // init picture and frame width and height
            // if the picture is on the front of the atom, then the picture frame is larger
            // otherwise, the picture frame is smaller
            let pictureFrameMeshWidth =
                this._atom.dimensions.width * (this._side === "front" ? 2.25 : 1);
            let pictureFrameMeshHeight =
                this._atom.dimensions.height * (this._side === "front" ? 2.25 : 1);

            if (imgHeight > imgWidth) {
                // if the height is greater than the width, then the image is portrait
                pictureFrameMeshWidth *= aspectRatio;
            } else {
                // if the width is greater than the height, then the image is landscape
                pictureFrameMeshHeight /= aspectRatio;
            }

            this._pictureFrameMesh = createPictureFrameMesh(
                this._side === "front" ? pictureFrameMeshWidth : 0.04,
                pictureFrameMeshHeight,
                this._side === "front" ? 0.04 : pictureFrameMeshWidth,
            );
            this._pictureMesh = createPictureMesh(
                pictureFrameMeshWidth,
                pictureFrameMeshHeight,
            );

            this._pictureFrameMesh.receiveShadows = true;
            this._pictureMesh.receiveShadows = true;

            switch (this._side) {
                case "front":
                    // fix picture position and rotation
                    this._pictureMesh.position.z = 0.022;
                    this._pictureMesh.rotation.y = Math.PI;

                    // attach to picture frame
                    this._pictureMesh.parent = this._pictureFrameMesh;

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
                    // fix picture position and rotation
                    this._pictureMesh.position.x = -0.022;
                    this._pictureMesh.rotation.y = Math.PI * 0.5;

                    // attach to picture frame
                    this._pictureMesh.parent = this._pictureFrameMesh;

                    // position picture frame
                    this._pictureFrameMesh.position = new Vector3(
                        this._atom.dimensions.width * 2,
                        this._atom.dimensions.height,
                        -this._atom.dimensions.depth * 1.15,
                    );
                    break;
                case "rightFront":
                    // fix picture position and rotation
                    this._pictureMesh.position.x = 0.022;
                    this._pictureMesh.rotation.y = -Math.PI * 0.5;

                    // attach to picture frame
                    this._pictureMesh.parent = this._pictureFrameMesh;

                    // position picture frame
                    this._pictureFrameMesh.position = new Vector3(
                        -this._atom.dimensions.width * 2,
                        this._atom.dimensions.height,
                        -this._atom.dimensions.depth * 1.15,
                    );
                    break;
                case "leftBack":
                    // fix picture position and rotation
                    this._pictureMesh.position.x = -0.022;
                    this._pictureMesh.rotation.y = Math.PI * 0.5;

                    // attach to picture frame
                    this._pictureMesh.parent = this._pictureFrameMesh;

                    // position picture frame
                    this._pictureFrameMesh.position = new Vector3(
                        this._atom.dimensions.width * 2,
                        this._atom.dimensions.height,
                        this._atom.dimensions.depth * 1.15,
                    );
                    break;
                case "rightBack":
                    // fix picture position and rotation
                    this._pictureMesh.position.x = 0.022;
                    this._pictureMesh.rotation.y = -Math.PI * 0.5;

                    // attach to picture frame
                    this._pictureMesh.parent = this._pictureFrameMesh;

                    // position picture frame
                    this._pictureFrameMesh.position = new Vector3(
                        -this._atom.dimensions.width * 2,
                        this._atom.dimensions.height,
                        this._atom.dimensions.depth * 1.15,
                    );
                    break;
            }

            // === performance optimization ===
            // static mesh, no need to evaluate every frame
            this._pictureFrameMesh.freezeWorldMatrix();
            this._pictureMesh.freezeWorldMatrix();
            
            // don't update bounding info
            this._pictureFrameMesh.doNotSyncBoundingInfo = true;
            this._pictureMesh.doNotSyncBoundingInfo = true;

            // vertex structure is simple, stop using indices
            this._pictureFrameMesh.convertToUnIndexedMesh();
            this._pictureMesh.convertToUnIndexedMesh();
            // ================================

            this._atom.addMeshesToReflectionList([
                this._pictureFrameMesh,
                this._pictureMesh,
            ]);

            // on hover event for picture
            const actionManager = new ActionManager(this._scene);
            actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => {
                    // don't show hover effect on mobile
                    if (isMobile()) return;

                    // change cursor to pointer on hover
                    if (!SCENE_SETTINGS.isEditingPictureMode) {
                        this._scene.hoverCursor = "default";
                        return;
                    }
                    this._scene.hoverCursor = "pointer";

                    this._pictureFrameMaterial.unfreeze();
                    this._pictureFrameMaterial.diffuseColor = Color3.Yellow();
                    this._pictureFrameMaterial.emissiveColor = Color3.Yellow();

                    this._scene.onAfterRenderObservable.addOnce(() => {
                        this._pictureFrameMaterial.freeze();
                    });
                }),
            );
            actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => {
                    // don't show hover effect on mobile
                    if (isMobile()) return;

                    // change cursor to default on hover out
                    if (!SCENE_SETTINGS.isEditingPictureMode) return;
                    this._scene.hoverCursor = "default";

                    this._pictureFrameMaterial.unfreeze();
                    this._pictureFrameMaterial.diffuseColor = Picture.PICTURE_FRAME_COLOR;
                    this._pictureFrameMaterial.emissiveColor = Color3.Black();

                    this._scene.onAfterRenderObservable.addOnce(() => {
                        this._pictureFrameMaterial.freeze();
                    });
                }),
            );
            this._pictureMesh.actionManager = actionManager;

            // on click event for picture in editing mode
            this._scene.onPointerObservable.add(this._handleClickObject);
        };
    }

    private _handleClickObject = (pointerInfo: PointerInfo): void => {
        if (pointerInfo.type === PointerEventTypes.POINTERPICK) {
            if (!SCENE_SETTINGS.isEditingPictureMode) return;
            if (!pointerInfo?.pickInfo?.hit) return;

            if (pointerInfo?.pickInfo.pickedMesh?.name === this._pictureMesh.name) {
                SCENE_SETTINGS.editingImage = this._side;
                SCENE_SETTINGS.imageUploadInputField.click();
                return;
            }
        }
    };

    public dispose(): void {
        this._scene.onPointerObservable.removeCallback(this._handleClickObject);

        this._scene.removeMesh(this._pictureFrameMesh);
        this._scene.removeMesh(this._pictureMesh);
        this._scene.removeTexture(this._texture);
        this._scene.removeMaterial(this._pictureFrameMaterial);
        this._scene.removeMaterial(this._pictureMaterial);

        this._pictureFrameMesh.dispose(false, true);
        this._pictureMesh.dispose(false, true);
        this._texture.dispose();
        this._pictureFrameMaterial.dispose();
        this._pictureMaterial.dispose();
    }
}

export default Picture;
