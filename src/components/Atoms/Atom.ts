import {
    Color3,
    FresnelParameters,
    Matrix,
    Mesh,
    MeshBuilder,
    MirrorTexture,
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

    constructor(scene: Scene, dimensions: AtomDimensions) {
        this._scene = scene;
        this._dimensions = dimensions;


        const generateSatelliteMaterial = (
            mesh: Mesh,
            color: Color3,
            others: Mesh[],
        ) => {
            const material = new StandardMaterial("satelliteMat" + mesh.name, scene);
            material.diffuseColor = color;

            const probe = new ReflectionProbe(
                "satelliteProbe" + mesh.name,
                512,
                scene,
            );
            for (let index = 0; index < others.length; index++) {
                probe.renderList?.push(others[index]);
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


        // Create, position, and rotate a flat mesh surface.
        const ground = MeshBuilder.CreatePlane(
            "mirrorMesh",
            { width: this.dimensions.width * 4, height: this.dimensions.height * 4 },
            scene,
        );
        ground.position = new Vector3(0, 0.1, 0);
        ground.rotation = new Vector3(Math.PI * 0.5, 0, 0);
        ground.checkCollisions = true;
        ground.visibility = 0.3;

        // Create the reflective material for the ground.
        const groundMaterial = new StandardMaterial("mirrorMaterial", scene);
        groundMaterial.diffuseColor = Color3.Black();
        groundMaterial.reflectionTexture = new MirrorTexture(
            "mirror",
            1024,
            scene,
            true,
        );
        (groundMaterial.reflectionTexture as MirrorTexture).mirrorPlane = new Plane(
            0,
            -1.0,
            0,
            0.0,
        );
        (groundMaterial.reflectionTexture as MirrorTexture).renderList = [
            blueSphere,
            redSphere,
            greenBox,
        ];
        groundMaterial.reflectionTexture.level = 0.5;

        const frontWallBound = MeshBuilder.CreatePlane(
            "frontWallBound",
            { width: this.dimensions.width * 4, height: this.dimensions.height * 4 },
            scene,
        );
        frontWallBound.position = new Vector3(0, this.dimensions.height * 0.5, -this.dimensions.depth * 2);
        frontWallBound.rotation = new Vector3(0, Math.PI, 0);
        frontWallBound.checkCollisions = true;
        frontWallBound.isVisible = false;

        const wallLBound = MeshBuilder.CreatePlane(
            "wallLBound",
            { width: this.dimensions.width * 4, height: this.dimensions.height * 4 },
            scene,
        );
        wallLBound.position = new Vector3(this.dimensions.width * 2, this.dimensions.height * 0.5, 0);
        wallLBound.rotation = new Vector3(0, Math.PI * 0.5, 0);
        wallLBound.checkCollisions = true;
        wallLBound.isVisible = false;

        const wallRBound = MeshBuilder.CreatePlane(
            "wallRBound",
            { width: this.dimensions.width * 4, height: this.dimensions.height * 4 },
            scene,
        );
        wallRBound.position = new Vector3(-this.dimensions.width * 2, this.dimensions.height * 0.5, 0);
        wallRBound.rotation = new Vector3(0, -Math.PI * 0.5, 0);
        wallRBound.checkCollisions = true;
        wallRBound.isVisible = false;

        generateSatelliteMaterial(blueSphere, Color3.Blue(), [
            redSphere,
            greenBox,
            ground,
        ]);
        generateSatelliteMaterial(redSphere, Color3.Red(), [
            blueSphere,
            greenBox,
            ground,
        ]);
        generateSatelliteMaterial(greenBox, Color3.Green(), [
            blueSphere,
            redSphere,
            ground,
        ]);

        ground.material = groundMaterial;

        // Animations
        scene.registerBeforeRender(() => {
            blueSphere.rotation.y += 0.01;
            greenBox.rotation.y -= 0.01;
            redSphere.rotation.y += 0.01;
        });
    }
    get dimensions(): AtomDimensions {
        return this._dimensions;
    }
    set dimensions(dimensions: AtomDimensions) {
        this._dimensions = dimensions;
    }
    get scene(): Scene {
        return this._scene;
    }
}

export default Atom;
