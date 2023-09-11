import { AbstractMesh, Mesh, Scene, SceneLoader, ShadowGenerator } from "@babylonjs/core";
import Atom from "./Atom";

class ModernRoom extends Atom {
    private _root: AbstractMesh = null!;
    private _meshes: AbstractMesh[] = [];
    private _shadowGenerators: ShadowGenerator[] = [];

    constructor(scene: Scene, reflectionList?: Mesh[], shadowGenerators?: ShadowGenerator[]) {
        super(
            scene,
            {
                width: 2.5 * 1.5,
                height: 2.5 * 1.5,
                depth: 2.5 * 1.5,
            },
            reflectionList,
        );
        this._shadowGenerators = shadowGenerators ?? [];

        SceneLoader.ImportMesh(
            "",
            "/models/atoms/",
            "modern-room.glb",
            scene,
            result => {
                this._root = result[0];
                this._meshes = result.slice(1);

                this._root.scaling.scaleInPlace(1.5);

                this.addMeshesToReflectionList(this._meshes as Mesh[]);

                this._meshes.forEach(mesh => {
                    mesh.receiveShadows = true;
                });
                // if (this._shadowGenerators.length) {
                //     this._shadowGenerators?.forEach(generator => {
                //         this._meshes.forEach(mesh => {
                //             mesh.receiveShadows = true;
                //             generator.addShadowCaster(mesh);
                //         });
                //     });
                // }
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

export default ModernRoom;
