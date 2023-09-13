import {
    Color3,
    Mesh,
    MeshBuilder,
    MirrorTexture,
    PhysicsAggregate,
    PhysicsShapeType,
    Plane,
    Scene,
    StandardMaterial,
    Vector3,
} from "@babylonjs/core";
import Picture from "../AtomElements/Picture";

interface AtomDimensions {
    width: number;
    height: number;
    depth: number;
}

abstract class Atom {
    private _scene: Scene;
    private _dimensions: AtomDimensions;
    private _reflectionList: Mesh[];
    private _pictures: PictureInterface;

    private _groundMesh: Mesh;
    private _frontWallMesh: Mesh;
    private _wallLMesh: Mesh;
    private _wallRMesh: Mesh;
    private _groundAggregate: PhysicsAggregate;
    private _frontWallAggregate: PhysicsAggregate;
    private _wallLAggregate: PhysicsAggregate;
    private _wallRAggregate: PhysicsAggregate;

    constructor(scene: Scene, dimensions: AtomDimensions, reflections?: Mesh[]) {
        this._scene = scene;
        this._dimensions = dimensions;
        this._reflectionList = reflections ?? [];
        this._pictures = {
            front: null,
            leftFront: null,
            rightFront: null,
            leftBack: null,
            rightBack: null,
        };

        this._groundMesh = MeshBuilder.CreateBox(
            "groundMesh",
            {
                width: this.dimensions.width * 4,
                depth: this.dimensions.height * 4,
                height: 0.01,
            },
            this._scene,
        );
        this._groundMesh.checkCollisions = true;
        this._groundMesh.visibility = 0.3;
        // this._groundMesh.receiveShadows = true;

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
            this._reflectionList;
        groundMaterial.reflectionTexture.level = 0.5;
        this._groundMesh.material = groundMaterial;

        this._frontWallMesh = MeshBuilder.CreateBox(
            "frontWallMesh",
            {
                width: this.dimensions.width * 4,
                depth: 0.01,
                height: this.dimensions.height * 4,
            },
            this._scene,
        );
        this._frontWallMesh.position = new Vector3(
            0,
            this.dimensions.height * 2,
            -this.dimensions.depth * 2,
        );
        this._frontWallMesh.checkCollisions = true;
        this._frontWallMesh.isVisible = false;

        this._wallLMesh = MeshBuilder.CreateBox(
            "wallLMesh",
            {
                width: 0.01,
                depth: this.dimensions.depth * 4,
                height: this.dimensions.height * 4,
            },
            this._scene,
        );
        this._wallLMesh.position = new Vector3(
            this.dimensions.width * 2,
            this.dimensions.height * 2,
            0,
        );
        this._wallLMesh.checkCollisions = true;
        this._wallLMesh.isVisible = false;

        this._wallRMesh = MeshBuilder.CreateBox(
            "wallRMesh",
            {
                width: 0.01,
                depth: this.dimensions.depth * 4,
                height: this.dimensions.height * 4,
            },
            this._scene,
        );
        this._wallRMesh.position = new Vector3(
            -this.dimensions.width * 2,
            this.dimensions.height * 2,
            0,
        );
        this._wallRMesh.checkCollisions = true;
        this._wallRMesh.isVisible = false;

        this._groundAggregate = new PhysicsAggregate(
            this._groundMesh,
            PhysicsShapeType.BOX,
            { mass: 0, restitution: 0.01 },
            this._scene,
        );
        this._frontWallAggregate = new PhysicsAggregate(
            this._frontWallMesh,
            PhysicsShapeType.BOX,
            { mass: 0, restitution: 0.01 },
            this._scene,
        );
        this._wallLAggregate = new PhysicsAggregate(
            this._wallLMesh,
            PhysicsShapeType.BOX,
            { mass: 0, restitution: 0.01 },
            this._scene,
        );
        this._wallRAggregate = new PhysicsAggregate(
            this._wallRMesh,
            PhysicsShapeType.BOX,
            { mass: 0, restitution: 0.01 },
            this._scene,
        );
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
    public get pictures(): PictureInterface {
        return this._pictures;
    }

    public addMeshToReflectionList(mesh: Mesh): void {
        this._reflectionList.push(mesh);
        const currentReflectionList = (
            (this._groundMesh.material as StandardMaterial)
                .reflectionTexture as MirrorTexture
        ).renderList as Mesh[];

        (
            (this._groundMesh.material as StandardMaterial)
                .reflectionTexture as MirrorTexture
        ).renderList = [...currentReflectionList, mesh];
    }

    public addMeshesToReflectionList(meshes: Mesh[]): void {
        this._reflectionList.push(...meshes);
        const currentReflectionList = (
            (this._groundMesh.material as StandardMaterial)
                .reflectionTexture as MirrorTexture
        ).renderList as Mesh[];

        (
            (this._groundMesh.material as StandardMaterial)
                .reflectionTexture as MirrorTexture
        ).renderList = [...currentReflectionList, ...meshes];
    }

    public addPictureToAtom(src: string, side: PictureSide): void {
        if (side === null) throw new Error("Side cannot be null");
        this._pictures[side] = new Picture(src, this._scene, this, side);
    }
    public updatePictureInAtom(src: string, side: PictureSide): void {
        if (side === null) throw new Error("Side cannot be null");
        this._pictures[side]?.dispose();
        this._pictures[side] = null;
        this._pictures[side] = new Picture(src, this._scene, this, side);
    }
    public removePictureFromAtom(side: PictureSide): void {
        if (side === null) throw new Error("Side cannot be null");
        this._pictures[side]?.dispose();
        this._pictures[side] = null;
    }

    public dispose(): void {
        this._pictures.front?.dispose();
        this._pictures.leftFront?.dispose();
        this._pictures.rightFront?.dispose();
        this._pictures.leftBack?.dispose();
        this._pictures.rightBack?.dispose();

        this._scene.removeMesh(this._groundMesh);
        this._scene.removeMesh(this._frontWallMesh);
        this._scene.removeMesh(this._wallLMesh);
        this._scene.removeMesh(this._wallRMesh);

        this._scene.removeMaterial(this._groundMesh.material as StandardMaterial);
        this._scene.removeMaterial(this._frontWallMesh.material as StandardMaterial);
        this._scene.removeMaterial(this._wallLMesh.material as StandardMaterial);
        this._scene.removeMaterial(this._wallRMesh.material as StandardMaterial);

        this._groundMesh.dispose();
        this._frontWallMesh.dispose();
        this._wallLMesh.dispose();
        this._wallRMesh.dispose();
        this._groundAggregate.dispose();
        this._frontWallAggregate.dispose();
        this._wallLAggregate.dispose();
        this._wallRAggregate.dispose();
    }
}

export default Atom;
