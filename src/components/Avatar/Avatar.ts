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
import Atom from "../Atoms/Atom";

// all male parts' file name
const MALE_PARTS: GenderParts = {
    eyeL: ['m_eyeL_1'],
    eyeR: ['m_eyeR_1'],
    bottom: ['m_pants_1', 'm_pants_2'],
    body: ['m_body_1'],
    hair: ['m_hair_1', 'm_hair_2', 'm_hair_3'],
    head: ['m_head_1', 'm_head_2'],
    shoes: ['m_shoes_1', 'm_shoes_2'],
    top: ['m_top_1', 'm_top_2'],
};

class Avatar {
    private _scene: Scene;
    private _atom: Atom;
    private _gender: "male" | "female" = "male";
    private _root!: Mesh;
    private _meshes!: AbstractMesh[];
    private _animations: Record<string, AnimationGroup> = {};
    private _capsuleMesh!: Mesh;
    private _physicsAggregate!: PhysicsAggregate;
    private _shadowGenerators: ShadowGenerator[] = [];
    private _parts: GenderParts = MALE_PARTS;

    private static readonly CAPSULE_HEIGHT = 1.75;
    private static readonly CAPSULE_RADIUS = 0.3;

    constructor(scene: Scene, atom: Atom, shadowGenerators?: ShadowGenerator[]) {
        this._scene = scene;
        this._atom = atom;
        this._shadowGenerators = shadowGenerators ?? [];
        this._root = new Mesh("root", this._scene);
        this.generateCollision();
    }

    public get scene(): Scene {
        return this._scene;
    }
    public get root(): Mesh {
        return this._root;
    }
    public get meshes(): AbstractMesh[] {
        return this._meshes;
    }
    public get animations(): Record<string, AnimationGroup> {
        return this._animations;
    }
    public get parts(): GenderParts {
        return this._parts;
    }
    public get physicsAggregate(): PhysicsAggregate {
        return this._physicsAggregate;
    }
    public get physicsBody(): PhysicsBody {
        return this._physicsAggregate.body;
    }

    public async init(): Promise<void> {
        const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
            "",
            "/models/avatar/male/",
            "m_default.glb",
            this._scene,
        );
        this._root.position.copyFrom(meshes[0].position);
        this._root.rotationQuaternion = meshes[0].rotationQuaternion;

        this._meshes = meshes;

        // animation blending
        this._scene.animationPropertiesOverride = new AnimationPropertiesOverride();
        this._scene.animationPropertiesOverride.enableBlending = true;
        this._scene.animationPropertiesOverride.blendingSpeed = 0.07;
        this._scene.animationPropertiesOverride.loopMode = 1;

        // add animation groups
        animationGroups.forEach((animation) => {
            this._animations[animation.name] = animation;
        });

        // add meshes to reflection list
        // and assign root as parent
        this._meshes.forEach((mesh) => {
            mesh.parent = this._root;
            this._atom.addMeshToReflectionList(mesh as Mesh);
        });

        // generate shadows
        if (this._shadowGenerators.length) {
            this._shadowGenerators?.forEach(generator => {
                this._meshes.forEach(mesh => {
                    mesh.receiveShadows = true;
                    generator.addShadowCaster(mesh);
                });
            });
        }

        // copy capsule mesh's position to root
        this._scene.registerBeforeRender(() => {
            this._root.position.copyFrom(this._capsuleMesh.position);
            this._root.position.y -= Avatar.CAPSULE_HEIGHT * 0.5;
        });
    }

    public async loadModel(): Promise<void> {
        const path = this._gender === "male" ? "/models/avatar/male/" : "/models/avatar/female/";
        const { meshes } = await SceneLoader.ImportMeshAsync(
            "",
            path,
            "m_default.glb",
            this._scene,
        );
        this._meshes = meshes;

        // add meshes to reflection list
        this._meshes.forEach((mesh) => {
            mesh.parent = this._root;
            this._atom.addMeshToReflectionList(mesh as Mesh);
        });

        // generate shadows
        if (this._shadowGenerators.length) {
            this._shadowGenerators?.forEach(generator => {
                this._meshes.forEach(mesh => {
                    mesh.receiveShadows = true;
                    generator.addShadowCaster(mesh);
                });
            });
        }
    }

    public async loadParts(partName: string, partIndex: number): Promise<void> {
        console.log(partName);
        console.log(partIndex);
        Object.entries(this._parts).forEach(([name, list]) => {
            console.log(name);
            console.log(list);
        })
    }

    private generateCollision(): void {
        // create capsule physics body for character
        this._capsuleMesh = MeshBuilder.CreateCapsule(
            "capsuleMesh",
            {
                radius: Avatar.CAPSULE_RADIUS,
                height: Avatar.CAPSULE_HEIGHT,
                tessellation: 2,
                subdivisions: 1,
            },
            this._scene,
        );
        this._capsuleMesh.isVisible = false;
        this._capsuleMesh.position = new Vector3(0, Avatar.CAPSULE_HEIGHT * 0.5, 0);

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

export default Avatar;
