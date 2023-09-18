import {
    AbstractMesh,
    Color3,
    InstancedMesh,
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
    private _models: { [key: string]: AbstractMesh } = {};

    private _groundMesh: Mesh;
    private _frontWallMesh: Mesh;
    private _wallLMesh: InstancedMesh;
    private _wallRMesh: InstancedMesh;
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

        this._groundMesh = MeshBuilder.CreateGround(
            "ground",
            {
                width: this.dimensions.width * 4,
                height: this.dimensions.height * 4,
            },
            this._scene,
        );

        this._groundMesh.visibility = 0.3;
        this._groundMesh.position.y += 0.01;

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

        this._wallLMesh = this._frontWallMesh.createInstance("wallLMesh");
        this._wallRMesh = this._frontWallMesh.createInstance("wallRMesh");

        this._frontWallMesh.isVisible = false;
        this._wallLMesh.isVisible = false;
        this._wallRMesh.isVisible = false;

        this._frontWallMesh.position = new Vector3(
            0,
            this.dimensions.height * 2,
            -this.dimensions.depth * 2,
        );

        this._wallLMesh.position = new Vector3(
            this.dimensions.width * 2,
            this.dimensions.height * 2,
            0,
        );
        this._wallLMesh.rotation.y = Math.PI / 2;

        this._wallRMesh.position = new Vector3(
            -this.dimensions.width * 2,
            this.dimensions.height * 2,
            0,
        );
        this._wallRMesh.rotation.y = Math.PI / 2;

        // === performance optimization ===
        // static mesh, no need to evaluate every frame
        this._groundMesh.freezeWorldMatrix();
        this._frontWallMesh.freezeWorldMatrix();
        this._wallLMesh.freezeWorldMatrix();
        this._wallRMesh.freezeWorldMatrix();

        // don't update bounding info
        this._groundMesh.doNotSyncBoundingInfo = true;
        this._frontWallMesh.doNotSyncBoundingInfo = true;
        this._wallLMesh.doNotSyncBoundingInfo = true;
        this._wallRMesh.doNotSyncBoundingInfo = true;

        // vertex structure is simple, stop using indices
        this._groundMesh.convertToUnIndexedMesh();
        this._frontWallMesh.convertToUnIndexedMesh();
        // ================================

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
    public get models(): { [key: string]: AbstractMesh } {
        return this._models;
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
