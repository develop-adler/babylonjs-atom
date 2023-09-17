import type { AbstractMesh, TransformNode } from "@babylonjs/core";

export const SCENE_SETTINGS: {
    isThirdperson: boolean;
    isEditingPictureMode: boolean;
    isEditingModelMode: boolean;
    editingImage: PictureSide | null;
    imageUploadInputField: HTMLInputElement;
    hasModelSelected: boolean;
    selectedMeshParentName: string;
    hoveredMeshParentName: string;
    importedMeshesMap: Map<number, AbstractMesh>,
    importedMeshGroups: Map<string, TransformNode>
} = {
    isThirdperson: false,
    isEditingPictureMode: false,
    isEditingModelMode: false,
    editingImage: null,
    imageUploadInputField: null!,
    hasModelSelected: false,
    selectedMeshParentName: "",
    hoveredMeshParentName: "",
    importedMeshesMap: new Map<number, AbstractMesh>(),
    importedMeshGroups: new Map<string, TransformNode>(),
};
