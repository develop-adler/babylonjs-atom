import {
    AbstractMesh,
    AnimationGroup,
    AnimationPropertiesOverride,
    Mesh,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsBody,
    PhysicsMotionType,
    PhysicsShapeType,
    Scene,
    SceneLoader,
    ShadowGenerator,
    Vector3,
} from "@babylonjs/core";
import Atom from "./Atoms/Atom";

class Character {
    private _scene: Scene;
    private _atom: Atom;
    private _root!: AbstractMesh;
    private _meshes!: AbstractMesh[];
    private _animations: {
        [key: string]: AnimationGroup;
    } = {};
    private _capsuleMesh!: Mesh;
    private _physicsAggregate!: PhysicsAggregate;
    private _shadowGenerators: ShadowGenerator[] = [];

    private static readonly CAPSULE_HEIGHT = 1.75;
    private static readonly CAPSULE_RADIUS = 0.3;

    constructor(scene: Scene, atom: Atom, shadowGenerators?: ShadowGenerator[]) {
        this._scene = scene;
        this._atom = atom;
        this._shadowGenerators = shadowGenerators ?? [];
        this.generateCollision();
    }

    public get scene(): Scene {
        return this._scene;
    }
    public get root(): AbstractMesh {
        return this._root;
    }
    public get meshes(): AbstractMesh[] {
        return this._meshes;
    }
    public get animations(): { [key: string]: AnimationGroup } {
        return this._animations;
    }
    public get physicsAggregate(): PhysicsAggregate {
        return this._physicsAggregate;
    }
    public get physicsBody(): PhysicsBody {
        return this._physicsAggregate.body;
    }

    public async loadModel(): Promise<void> {
        const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
            "",
            "/models/",
            "character.glb",
            this._scene,
        );
        this._meshes = meshes;
        this._root = meshes[0];

        this._scene.animationPropertiesOverride = new AnimationPropertiesOverride();
        this._scene.animationPropertiesOverride.enableBlending = true;
        this._scene.animationPropertiesOverride.blendingSpeed = 0.07;
        this._scene.animationPropertiesOverride.loopMode = 1;

        // play Idle animation
        // 0: Crouch
        // 1: Idle
        // 2: RumbaDance
        // 3: Run
        // 4: SneakWalk
        // 5: Walk
        animationGroups[0].stop();
        animationGroups[1].start(
            true,
            1.0,
            animationGroups[1].from,
            animationGroups[1].to,
            false,
        );

        this._meshes.forEach((mesh) => {
            this._atom.addMeshToReflectionList(mesh as Mesh);
        });

        if (this._shadowGenerators.length) {
            this._shadowGenerators?.forEach(generator => {
                this._meshes.forEach(mesh => {
                    mesh.receiveShadows = true;
                    generator.addShadowCaster(mesh);
                });
            });
        }

        this._scene.registerBeforeRender(() => {
            this._root.position.copyFrom(this._capsuleMesh.position);
            this._root.position.y -= Character.CAPSULE_HEIGHT * 0.5;
        });
    }

    private generateCollision(): void {
        // create capsule physics body for character
        this._capsuleMesh = MeshBuilder.CreateCapsule(
            "capsuleMesh",
            {
                radius: Character.CAPSULE_RADIUS,
                height: Character.CAPSULE_HEIGHT,
                tessellation: 2,
                subdivisions: 1,
            },
            this._scene,
        );
        this._capsuleMesh.isVisible = false;
        this._capsuleMesh.position = new Vector3(0, Character.CAPSULE_HEIGHT * 0.5, 0);

        const physicsAggregate = new PhysicsAggregate(
            this._capsuleMesh,
            PhysicsShapeType.CAPSULE,
            { mass: 20, restitution: 0.01 },
            this._scene,
        );

        this._physicsAggregate = physicsAggregate;
        this._physicsAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);

        // lock rotation by disabling intertia
        this._physicsAggregate.body.setMassProperties({
            inertia: Vector3.Zero(),
        });

        // prevent sliding around
        this._physicsAggregate.body.setLinearDamping(50);
    }

    public setPosition(position: Vector3): void {
        this.physicsAggregate.body.disablePreStep = false;
        this._capsuleMesh.position = position;
        this._scene.onAfterPhysicsObservable.addOnce(() => {
            this.physicsAggregate.body.disablePreStep = true;
        });
    }

    public show(): void {
        this._meshes.forEach((mesh) => {
            mesh.isVisible = true;
        });
    }

    public hide(): void {
        this._meshes.forEach((mesh) => {
            mesh.isVisible = false;
        });

        // // reset position
        // this.physicsAggregate.body.disablePreStep = false;
        // this._capsuleMesh.position = new Vector3(0, Character.CAPSULE_HEIGHT * 0.5, 0);
        // this._scene.onAfterPhysicsObservable.addOnce(() => {
        //     this.physicsAggregate.body.disablePreStep = true;
        // });
    }

    public dispose(): void {
        // remove all meshes' animations
        Object.entries(this._animations).forEach(([_, animation]) => {
            this._scene.removeAnimationGroup(animation);
            animation.dispose();
        });

        this._scene.animationPropertiesOverride = null;
        if (this._root) {
            this._scene.removeMesh(this._root);
            this._root.dispose(false, true);
        }

        if (this._meshes) {
            this._meshes.forEach(mesh => {
                this._scene.removeMesh(mesh);
                mesh.dispose(false, true);
            });
        }

        this._physicsAggregate.dispose();

        this._scene.removeMesh(this._capsuleMesh);
        this._capsuleMesh.dispose();
    }
}

export default Character;
