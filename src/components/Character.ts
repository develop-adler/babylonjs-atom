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
    Vector3,
} from "@babylonjs/core";

class Character {
    public scene: Scene;
    public root!: AbstractMesh;
    public meshes!: AbstractMesh[];
    private _animations: {
        [key: string]: AnimationGroup;
    } = {};
    private _capsuleMesh: Mesh;
    private _physicsBody: PhysicsBody;

    constructor(scene: Scene) {
        this.scene = scene;

        // create capsule physics body for character
        const capsuleHeight = 2.5;
        this._capsuleMesh = MeshBuilder.CreateCapsule(
            "sphereMesh",
            {
                radius: 0.55,
                height: capsuleHeight,
                tessellation: 2,
                subdivisions: 1,
            },
            this.scene,
        );
        this._capsuleMesh.isVisible = false;
        this._capsuleMesh.position = new Vector3(0, capsuleHeight * 0.5, 0);

        const physicsAggregate = new PhysicsAggregate(
            this._capsuleMesh,
            PhysicsShapeType.CAPSULE,
            { mass: 20, restitution: 0.01 },
            this.scene,
        );

        this._physicsBody = physicsAggregate.body;
        this._physicsBody.setMotionType(PhysicsMotionType.DYNAMIC);

        // lock rotation by disabling intertia
        this._physicsBody.setMassProperties({
            inertia: new Vector3(0, 0, 0),
        });
        // prevent sliding around
        this._physicsBody.setLinearDamping(50);
    }

    public async init(): Promise<void> {
        const { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
            "",
            "/models/",
            "character.glb",
            this.scene,
        );
        this.meshes = meshes;
        this.root = meshes[0];

        // play Idle animation
        // 0: Crouch
        // 1: Idle
        // 2: RumbaDance
        // 3: Run
        // 4: SneakWalk
        // 5: Walk
        animationGroups[1].start(
            true,
            1.0,
            animationGroups[1].from,
            animationGroups[1].to,
            false,
        );

        this.root.scaling.scaleInPlace(1.5);

        // re-center character's pivot point for physics body
        let characterHeight = 0;
        this.root.getChildMeshes().forEach(mesh => {
            if (mesh.name === "Beta_Joints.001") {
                characterHeight = mesh.getBoundingInfo().boundingBox.maximumWorld.y;
                return;
            }
        });
        this.root.setPivotPoint(new Vector3(0, characterHeight * 1.6, 0));

        this.scene.registerBeforeRender(() => {
            this.root.position.copyFrom(this._capsuleMesh.position);
        });
    }

    public get animations(): { [key: string]: AnimationGroup } {
        return this._animations;
    }
    public get sphereMesh(): Mesh {
        return this._capsuleMesh;
    }
    public get physicsBody(): PhysicsBody {
        return this._physicsBody;
    }

    public dispose(): void {
        // remove all meshes' animations
        Object.entries(this._animations).forEach(([_, animation]) => {
            animation.dispose();
        });

        if (!this.meshes) return;

        this.meshes.forEach(mesh => {
            this.scene.removeMesh(mesh);
            mesh.dispose(false, true);
        });

        this.scene.removeMesh(this._capsuleMesh);
        this._capsuleMesh.dispose();
    }
}

export default Character;
