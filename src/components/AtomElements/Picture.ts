import {
    Color3,
    Mesh,
    MeshBuilder,
    Scene,
    StandardMaterial,
    Texture,
    Vector3,
} from "@babylonjs/core";
import Atom from "../Atoms/Atom";

class Picture {
    private _scene: Scene;
    private _atom: Atom;
    private _src: string;
    private _pictureFrameMesh!: Mesh;
    private _pictureMesh!: Mesh;
    private _side:
        | "front"
        | "leftFront"
        | "rightFront"
        | "leftBack"
        | "rightBack";

    constructor(
        src: string,
        scene: Scene,
        atom: Atom,
        side?: "front" | "leftFront" | "rightFront" | "leftBack" | "rightBack",
    ) {
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
        const pictureFrameMaterial = new StandardMaterial(
            `pictureFrame_${this._src}_material`,
            this._scene,
        );
        pictureFrameMaterial.diffuseColor = new Color3(0.25, 0.25, 0.25);

        const pictureMaterial = new StandardMaterial(
            `picture_${this._src}_material`,
            this._scene,
        );
        const pictureTexture = new Texture(this._src, this._scene);
        pictureMaterial.diffuseTexture = pictureTexture;
        pictureMaterial.emissiveColor = new Color3(0.5, 0.5, 0.5); // brighten image

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
                    this._pictureFrameMesh.material = pictureFrameMaterial;

                    this._pictureMesh = MeshBuilder.CreatePlane(
                        "picture_" + this._src + "_mesh",
                        {
                            width: pictureFrameMeshWidth - 0.1,
                            height: pictureFrameMeshHeight - 0.1,
                        },
                        this._scene,
                    );
                    this._pictureMesh.material = pictureMaterial;

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
                    this._pictureFrameMesh.material = pictureFrameMaterial;

                    this._pictureMesh = MeshBuilder.CreatePlane(
                        "picture_" + this._src + "_mesh",
                        {
                            width: pictureFrameMeshWidth - 0.1,
                            height: pictureFrameMeshHeight - 0.1,
                        },
                        this._scene,
                    );
                    this._pictureMesh.material = pictureMaterial;

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
                    this._pictureFrameMesh.material = pictureFrameMaterial;

                    this._pictureMesh = MeshBuilder.CreatePlane(
                        "picture_" + this._src + "_mesh",
                        {
                            width: pictureFrameMeshWidth - 0.1,
                            height: pictureFrameMeshHeight - 0.1,
                        },
                        this._scene,
                    );
                    this._pictureMesh.material = pictureMaterial;

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
                    this._pictureFrameMesh.material = pictureFrameMaterial;

                    this._pictureMesh = MeshBuilder.CreatePlane(
                        "picture_" + this._src + "_mesh",
                        {
                            width: pictureFrameMeshWidth - 0.1,
                            height: pictureFrameMeshHeight - 0.1,
                        },
                        this._scene,
                    );
                    this._pictureMesh.material = pictureMaterial;

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
                    this._pictureFrameMesh.material = pictureFrameMaterial;

                    this._pictureMesh = MeshBuilder.CreatePlane(
                        "picture_" + this._src + "_mesh",
                        {
                            width: pictureFrameMeshWidth - 0.1,
                            height: pictureFrameMeshHeight - 0.1,
                        },
                        this._scene,
                    );
                    this._pictureMesh.material = pictureMaterial;

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
        };
    }
}

export default Picture;
