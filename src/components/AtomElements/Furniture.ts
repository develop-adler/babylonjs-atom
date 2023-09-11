import {
    AbstractMesh,
    Mesh,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsShapeType,
    Scene,
    SceneLoader,
    ShadowGenerator,
    Vector3,
} from "@babylonjs/core";
import Atom from "../Atoms/Atom";

interface FurnitureOptions {
    position?: Vector3;
    rotation?: Vector3;
    type?: "box" | "cylinder";
}

class Furniture {
    private _fileName: string;
    private _scene: Scene;
    private _atom: Atom;
    private _shadowGenerators: ShadowGenerator[] = [];
    private _options: FurnitureOptions;
    private _root!: AbstractMesh;
    private _mesh!: AbstractMesh;
    private _physicsAggregate!: PhysicsAggregate;

    constructor(
        fileName: string,
        scene: Scene,
        atom: Atom,
        shadowGenerators?: ShadowGenerator[],
        options: FurnitureOptions = {
            position: Vector3.Zero(),
            rotation: Vector3.Zero(),
            type: "box",
        },
    ) {
        this._fileName = fileName;
        this._scene = scene;
        this._atom = atom;
        this._shadowGenerators = shadowGenerators ?? [];
        this._options = options;
        this.generateMesh();
    }

    private async generateMesh(): Promise<void> {
        const { meshes } = await SceneLoader.ImportMeshAsync(
            "",
            "/models/furnitures/",
            this._fileName,
            this._scene,
        );
        this._root = meshes[0];
        this._mesh = meshes[1];

        if (this._shadowGenerators.length) {
            this._shadowGenerators?.forEach(generator => {
                this._mesh.receiveShadows = true;
                generator.addShadowCaster(this._mesh);
            });
        }

        this.generateCollisions();
    }

    private generateCollisions(): void {
        const meshBB = this._mesh.getBoundingInfo().boundingBox;

        let physicsMesh;
        if (this._options.type === "cylinder") {
            physicsMesh = MeshBuilder.CreateCylinder(
                this._fileName + "CylinderMesh",
                {
                    height: meshBB.extendSize.y * 2,
                    diameter: meshBB.extendSize.x * 2,
                },
                this._scene,
            );
            physicsMesh.position = this._options.position ?? Vector3.Zero();
            physicsMesh.rotation = this._options.rotation ?? Vector3.Zero();
            physicsMesh.position.y +=
                physicsMesh.getBoundingInfo().boundingBox.extendSize.y;

            this._physicsAggregate = new PhysicsAggregate(
                physicsMesh,
                PhysicsShapeType.CYLINDER,
                { mass: 0, startAsleep: true },
                this._scene,
            );
        } else {
            physicsMesh = MeshBuilder.CreateBox(
                this._fileName + "BoxMesh",
                {
                    width: meshBB.extendSize.x * 2,
                    height: meshBB.extendSize.y * 2,
                    depth: meshBB.extendSize.z * 2,
                },
                this._scene,
            );
            physicsMesh.position = this._options.position ?? Vector3.Zero();
            physicsMesh.rotation = this._options.rotation ?? Vector3.Zero();
            physicsMesh.position.y +=
                physicsMesh.getBoundingInfo().boundingBox.extendSize.y;

            this._physicsAggregate = new PhysicsAggregate(
                physicsMesh,
                PhysicsShapeType.BOX,
                { mass: 0, startAsleep: true },
                this._scene,
            );
        }

        physicsMesh.isVisible = false;
        physicsMesh.checkCollisions = true;
        this._physicsAggregate.body.setMotionType(0); // static

        this._root.position.copyFrom(physicsMesh.position);
        this._root.position.y -= meshBB.extendSize.y;
        this._root.rotationQuaternion?.copyFrom(physicsMesh.rotationQuaternion!);

        this._atom.addMeshToReflectionList(this._mesh as Mesh);
    }

    public get root(): AbstractMesh {
        return this._root;
    }
    public get mesh(): AbstractMesh {
        return this._mesh;
    }
    public get physicsAggregate(): PhysicsAggregate {
        return this._physicsAggregate;
    }

    dispose(): void {
        if (this._root) {
            this._scene.removeMesh(this._root);
            this._root.dispose(false, true);
        }
        if (this._mesh) {
            this._scene.removeMesh(this._mesh);
            this._mesh.dispose(false, true);
        }

        this._physicsAggregate.dispose();
    }
}

export default Furniture;
