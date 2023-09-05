import {
    AbstractMesh,
    AnimationRange,
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
    private animations: {
        [key: string]: AnimationRange;
    } = {};
    public sphereMesh!: Mesh;
    public physicsBody!: PhysicsBody;

    constructor(scene: Scene) {
        this.scene = scene;
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

        const sphereSize = 1.5;
        this.sphereMesh = MeshBuilder.CreateSphere(
            "sphereMesh",
            { diameter: sphereSize },
            this.scene,
        );
        // this.sphereMesh.isVisible = false;
        this.sphereMesh.visibility = 0.6;
        this.sphereMesh.position = new Vector3(0, sphereSize * 0.5, -2);
        this.root.position = this.sphereMesh.position;
        this.sphereMesh.position.y = sphereSize * 0.5;

        const sphereAggregate = new PhysicsAggregate(
            this.sphereMesh,
            PhysicsShapeType.SPHERE,
            { mass: 20, restitution: 0.01 },
            this.scene,
        );

        this.physicsBody = sphereAggregate.body;
        this.physicsBody.setMotionType(PhysicsMotionType.DYNAMIC);

        // lock rotation by disabling intertia
        this.physicsBody.setMassProperties({
            inertia: new Vector3(0, 0, 0),
        });
        // prevent sliding around
        this.physicsBody.setLinearDamping(50);
    }

    public getAnimations(): { [key: string]: AnimationRange } {
        return this.animations;
    }

    public dispose(): void {
        // remove all meshes' animations
        Object.entries(this.animations).forEach(([_, animation]) => {
            this.scene.stopAnimation(animation);
        });

        if (!this.meshes) return;

        this.meshes.forEach(mesh => {
            this.scene.removeMesh(mesh);
            mesh.dispose();
        });
    }
}

export default Character;
