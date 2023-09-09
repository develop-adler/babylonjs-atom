import {
    Color3,
    FresnelParameters,
    Matrix,
    Mesh,
    MeshBuilder,
    MirrorTexture,
    PhysicsAggregate,
    PhysicsShapeType,
    Plane,
    ReflectionProbe,
    Scene,
    StandardMaterial,
    Vector3,
} from "@babylonjs/core";

interface AtomDimensions {
    width: number;
    height: number;
    depth: number;
}

abstract class Atom {
    private _scene: Scene;
    private _dimensions: AtomDimensions;
    private _ground!: Mesh;
    private _reflectionList: Mesh[];

    constructor(scene: Scene, dimensions: AtomDimensions, reflections?: Mesh[]) {
        this._scene = scene;
        this._dimensions = dimensions;
        this._reflectionList = reflections || [];

        const generateSatelliteMaterial = (
            mesh: Mesh,
            color: Color3,
            reflectionList: Mesh[],
        ) => {
            const material = new StandardMaterial("satelliteMat" + mesh.name, scene);
            material.diffuseColor = color;

            const probe = new ReflectionProbe(
                "satelliteProbe" + mesh.name,
                512,
                scene,
            );
            for (let index = 0; index < reflectionList.length; index++) {
                probe.renderList?.push(reflectionList[index]);
            }

            material.reflectionTexture = probe.cubeTexture;

            material.reflectionFresnelParameters = new FresnelParameters();
            material.reflectionFresnelParameters.bias = 0.02;

            mesh.material = material;
            probe.attachToMesh(mesh);
        };

        const blueSphere = MeshBuilder.CreateSphere(
            "blueSphere",
            {
                diameter: 0.5,
            },
            scene,
        );
        blueSphere.setPivotMatrix(Matrix.Translation(-1, 2, 0), false);

        const redSphere = MeshBuilder.CreateSphere(
            "redSphere",
            {
                diameter: 0.5,
            },
            scene,
        );
        redSphere.setPivotMatrix(Matrix.Translation(1, 1, 0), false);

        const greenBox = MeshBuilder.CreateBox(
            "greenBox",
            {
                width: 0.5,
                height: 0.5,
                depth: 0.5,
            },
            scene,
        );
        greenBox.setPivotMatrix(Matrix.Translation(0, 1.5, 1), false);

        generateSatelliteMaterial(blueSphere, Color3.Blue(), [
            redSphere,
            greenBox,
            this._ground,
        ]);
        generateSatelliteMaterial(redSphere, Color3.Red(), [
            blueSphere,
            greenBox,
            this._ground,
        ]);
        generateSatelliteMaterial(greenBox, Color3.Green(), [
            blueSphere,
            redSphere,
            this._ground,
        ]);

        // Animations
        scene.registerBeforeRender(() => {
            blueSphere.rotation.y += 0.01;
            greenBox.rotation.y -= 0.01;
            redSphere.rotation.y += 0.01;
        });

        this.generateCollisions([
            ...this._reflectionList,
            blueSphere,
            redSphere,
            greenBox,
        ]);
    }
    public get dimensions(): AtomDimensions {
        return this._dimensions;
    }
    public set dimensions(dimensions: AtomDimensions) {
        this._dimensions = dimensions;
    }
    public get scene(): Scene {
        return this._scene;
    }

    private generateCollisions(reflectionList: Mesh[]): void {
        // Create, position, and rotate a flat mesh surface.
        this._ground = MeshBuilder.CreateBox(
            "groundMesh",
            {
                width: this.dimensions.width * 4,
                depth: this.dimensions.height * 4,
                height: 0.01,
            },
            this._scene,
        );
        this._ground.checkCollisions = true;
        this._ground.visibility = 0.3;
        // this._ground.receiveShadows = true;

        // Create the reflective material for the ground.
        const groundMaterial = new StandardMaterial("mirrorMaterial", this._scene);
        groundMaterial.diffuseColor = Color3.Black();
        groundMaterial.reflectionTexture = new MirrorTexture(
            "mirrorMaterial",
            1024,
            this._scene,
            true,
        );
        (groundMaterial.reflectionTexture as MirrorTexture).mirrorPlane = new Plane(
            0,
            -1.0,
            0,
            0.0,
        );
        (groundMaterial.reflectionTexture as MirrorTexture).renderList =
            reflectionList;
        groundMaterial.reflectionTexture.level = 0.5;
        this._ground.material = groundMaterial;

        const frontWallMesh = MeshBuilder.CreateBox(
            "frontWallMesh",
            {
                width: this.dimensions.width * 4,
                depth: 0.01,
                height: this.dimensions.height * 4,
            },
            this._scene,
        );
        frontWallMesh.position = new Vector3(
            0,
            this.dimensions.height * 2,
            -this.dimensions.depth * 2,
        );
        frontWallMesh.checkCollisions = true;
        frontWallMesh.isVisible = false;

        const wallLMesh = MeshBuilder.CreateBox(
            "wallLMesh",
            {
                width: 0.01,
                depth: this.dimensions.depth * 4,
                height: this.dimensions.height * 4,
            },
            this._scene,
        );
        wallLMesh.position = new Vector3(
            this.dimensions.width * 2,
            this.dimensions.height * 2,
            0,
        );
        wallLMesh.checkCollisions = true;
        wallLMesh.isVisible = false;

        const wallRMesh = MeshBuilder.CreateBox(
            "wallRMesh",
            {
                width: 0.01,
                depth: this.dimensions.depth * 4,
                height: this.dimensions.height * 4,
            },
            this._scene,
        );
        wallRMesh.position = new Vector3(
            -this.dimensions.width * 2,
            this.dimensions.height * 2,
            0,
        );
        wallRMesh.checkCollisions = true;
        wallRMesh.isVisible = false;

        new PhysicsAggregate(
            this._ground,
            PhysicsShapeType.BOX,
            { mass: 0, restitution: 0.01 },
            this._scene,
        );
        new PhysicsAggregate(
            frontWallMesh,
            PhysicsShapeType.BOX,
            { mass: 0, restitution: 0.01 },
            this._scene,
        );
        new PhysicsAggregate(
            wallLMesh,
            PhysicsShapeType.BOX,
            { mass: 0, restitution: 0.01 },
            this._scene,
        );
        new PhysicsAggregate(
            wallRMesh,
            PhysicsShapeType.BOX,
            { mass: 0, restitution: 0.01 },
            this._scene,
        );
    }

    public addMeshToReflectionList(mesh: Mesh): void {
        this._reflectionList.push(mesh);
        const currentReflectionList = (
            (this._ground.material as StandardMaterial)
                .reflectionTexture as MirrorTexture
        ).renderList as Mesh[];

        (
            (this._ground.material as StandardMaterial)
                .reflectionTexture as MirrorTexture
        ).renderList = [...currentReflectionList, mesh];
    }

    public addMeshesToReflectionList(meshes: Mesh[]): void {
        this._reflectionList.push(...meshes);
        const currentReflectionList = (
            (this._ground.material as StandardMaterial)
                .reflectionTexture as MirrorTexture
        ).renderList as Mesh[];

        (
            (this._ground.material as StandardMaterial)
                .reflectionTexture as MirrorTexture
        ).renderList = [...currentReflectionList, ...meshes];
    }
}

export default Atom;
