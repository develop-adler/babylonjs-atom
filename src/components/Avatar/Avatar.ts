import {
    AbstractMesh,
    AnimationGroup,
    Mesh,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsBody,
    PhysicsMotionType,
    PhysicsShapeType,
    Scene,
    SceneLoader,
    ShadowGenerator,
    Skeleton,
    Vector3,
} from "@babylonjs/core";
import Atom from "../Atoms/Atom";

// all male parts' file name
const MALE_PARTS: GenderParts = {
    body: ["m_body_1"],
    eyeL: ["m_eyeL_1"],
    eyeR: ["m_eyeR_1"],
    bottom: ["m_pants_1", "m_pants_2"],
    hair: ["m_hair_1", "m_hair_2", "m_hair_3"],
    head: ["m_head_1", "m_head_2"],
    shoes: ["m_shoes_1", "m_shoes_2"],
    top: ["m_top_1", "m_top_2"],
};

// all male parts' file name
const FEMALE_PARTS: GenderParts = {
    body: ["f_body_1"],
    eyeL: ["f_eyeL_1"],
    eyeR: ["f_eyeR_1"],
    bottom: ["f_bottom_1"],
    hair: ["f_hair_1", "f_hair_2", "f_hair_3"],
    head: ["f_head_1", "f_head_2"],
    shoes: ["f_shoes_1", "f_shoes_2"],
    top: ["f_top_1"],
};

class Avatar {
    private _scene: Scene;
    private _atom: Atom;
    private _gender: "male" | "female" = "female";
    private _root!: Mesh;
    private _meshes!: AbstractMesh[];
    private _skeleton!: Skeleton;
    private _animations: Record<string, AnimationGroup> = {};
    private _capsuleMesh!: Mesh;
    private _physicsAggregate!: PhysicsAggregate;
    private _shadowGenerators: ShadowGenerator[] = [];
    private _parts: GenderParts;

    private static readonly CAPSULE_HEIGHT = 1.75;
    private static readonly CAPSULE_RADIUS = 0.3;

    constructor(scene: Scene, atom: Atom, shadowGenerators?: ShadowGenerator[]) {
        this._scene = scene;
        this._atom = atom;
        this._shadowGenerators = shadowGenerators ?? [];
        this._root = new Mesh("root", this._scene);

        this._parts = JSON.parse(localStorage.getItem("avatarParts") ?? "{}");
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
    public get gender(): "male" | "female" {
        return this._gender;
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
        const { meshes, animationGroups, skeletons } =
            await SceneLoader.ImportMeshAsync(
                "",
                `/models/avatar/${this._gender}/`,
                `${this._gender === "male" ? "m" : "f"}_default.glb`,
                this._scene,
            );
        this._skeleton = skeletons[0];

        this._root.scaling.scaleInPlace(0.01);
        this._root.position.copyFrom(meshes[0].position);
        this._root.rotationQuaternion = meshes[0].rotationQuaternion;

        this._meshes = meshes;

        // add animation groups
        animationGroups.forEach(animation => {
            this._animations[animation.name] = animation;
        });

        this._meshes.forEach(mesh => {
            // assign root as parent
            mesh.parent = this._root;

            // add meshes to reflection list
            this._atom.addMeshToReflectionList(mesh as Mesh);
        });

        // generate shadows for all meshes
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

        localStorage.setItem("avatarGender", this._gender);

        // dispose default model
        this._meshes.forEach(mesh => {
            this._scene.removeMesh(mesh);
            mesh.dispose();
        });

        let parts;
        if (this._gender === "male") {
            parts = Object.keys(this._parts).length
                ? JSON.parse(localStorage.getItem("avatarParts")!)
                : {
                    body: ["m_body_1"],
                    eyeL: ["m_eyeL_1"],
                    eyeR: ["m_eyeR_1"],
                    bottom: ["m_pants_1"],
                    hair: ["m_hair_2"],
                    head: ["m_head_1"],
                    shoes: ["m_shoes_1"],
                    top: ["m_top_2"],
                };
        } else {
            parts = Object.keys(this._parts).length
                ? JSON.parse(localStorage.getItem("avatarParts")!)
                : {
                    body: ["f_body_1"],
                    eyeL: ["f_eyeL_1"],
                    eyeR: ["f_eyeR_1"],
                    bottom: ["f_bottom_1"],
                    hair: ["f_hair_2"],
                    head: ["f_head_1"],
                    shoes: ["f_shoes_1"],
                    top: ["f_top_1"],
                };
        }

        console.log(parts);

        // load parts
        Object.values<[string]>(parts).forEach(partList => {
            this.loadPart(partList[0]);
        });

        // localStorage.setItem("avatarParts", JSON.stringify(this._parts));
    }

    public async loadPart(partName: string): Promise<void> {
        // check if part exists
        if (
            gender === "male" &&
            !Object.values(MALE_PARTS).flat().includes(partName)
        ) {
            console.error(`Part ${partName} does not exist`);
            return;
        }
        if (
            gender === "female" &&
            !Object.values(FEMALE_PARTS).flat().includes(partName)
        ) {
            console.error(`Part ${partName} does not exist`);
            return;
        }
        // if (partName.includes("body")) {
        //     console.error(`Cannot change body`);
        //     return;
        // }
        // if (partName.includes("eyeL")) {
        //     console.error(`Cannot change eyeL`);
        //     return;
        // }
        // if (partName.includes("eyeR")) {
        //     console.error(`Cannot change eyeR`);
        //     return;
        // }

        SceneLoader.ImportMesh(
            "",
            `/models/avatar/${this._gender}/`,
            `${partName}.glb`,
            this._scene,
            (meshes, particleSystems, skeletons, animationGroups) => {
                // dispose unused resources
                particleSystems.forEach(particleSystem => {
                    this._scene.removeParticleSystem(particleSystem);
                    particleSystem.dispose();
                });
                skeletons.forEach(skeleton => {
                    this._scene.removeSkeleton(skeleton);
                    skeleton.dispose();
                });
                animationGroups.forEach(animation => {
                    this._scene.removeAnimationGroup(animation);
                    animation.dispose();
                });

                meshes.forEach((mesh, index) => {
                    // assign root as parent
                    mesh.parent = this._root;

                    if (index === 0) return;

                    // assign skeleton to default model skeleton
                    // to use the same animations
                    mesh.skeleton = this._skeleton;

                    // add meshes to reflection list
                    this._atom.addMeshToReflectionList(mesh as Mesh);
                });
            },
        );
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
        this._meshes.forEach(mesh => {
            if (mesh.name.includes("_2")) return;
            mesh.isVisible = true;
        });
    }

    public hide(): void {
        this._meshes.forEach(mesh => {
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
