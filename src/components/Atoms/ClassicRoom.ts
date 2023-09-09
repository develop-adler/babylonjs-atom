import {
    AbstractMesh,
    Mesh,
    Scene,
    SceneLoader,
} from "@babylonjs/core";
import Atom from "./Atom";
import Picture from "../AtomElements/Picture";

class ClassicRoom extends Atom {
    private _root: AbstractMesh = null!;
    private _meshes: AbstractMesh[] = [];

    constructor(scene: Scene, reflectionList?: Mesh[]) {
        super(scene, {
            width: 2.5 * 1.5,
            height: 2.5 * 1.5,
            depth: 2.5 * 1.5,
        }, reflectionList);

        SceneLoader.ImportMesh(
            "",
            "/models/atoms/",
            "classic-room.glb",
            scene,
            result => {
                this._root = result[0];
                this._root.scaling.scaleInPlace(1.5);
                this._meshes = result.slice(1);

                new Picture("/textures/baby-sonic-2.png", scene, this, "front");
                new Picture("/textures/bonk-shiba.jpg", scene, this, "leftFront");
                new Picture("/textures/angry-frog.jpg", scene, this, "rightFront");
                new Picture("/textures/1234.png", scene, this, "leftBack");
                new Picture("/textures/hyundai.png", scene, this, "rightBack");
            },
        );
    }
    public get root(): AbstractMesh {
        return this._root;
    }
    public get meshes(): AbstractMesh[] {
        return this._meshes;
    }
}

export default ClassicRoom;
