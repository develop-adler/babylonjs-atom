import {
    AbstractMesh,
    Mesh,
    Scene,
    SceneLoader,
} from "@babylonjs/core";
import Atom from "./Atom";

class ClassicRoom extends Atom {
    private _root: AbstractMesh = null!;
    private _meshes: AbstractMesh[] = [];

    constructor(scene: Scene, reflectionList?: Mesh[]) {
        super(scene, {
            width: 5,
            height: 5,
            depth: 5,
        }, reflectionList);

        SceneLoader.ImportMesh(
            "",
            "/models/atoms/",
            "classic-room.glb",
            scene,
            result => {
                this._root = result[0];
                this._root.scaling.scaleInPlace(2);

                // get result except result [0]
                this._meshes = result.slice(1);
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
