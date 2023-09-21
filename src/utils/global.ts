import type { AbstractMesh, TransformNode } from "@babylonjs/core";

export const SCENE_SETTINGS: {
    isThirdperson: boolean;
    isEditingPictureMode: boolean;
    isEditingModelMode: boolean;
    isEditingAvatarMode: boolean;
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
    isEditingAvatarMode: false,
    editingImage: null,
    imageUploadInputField: null!,
    hasModelSelected: false,
    selectedMeshParentName: "",
    hoveredMeshParentName: "",
    importedMeshesMap: new Map<number, AbstractMesh>(),
    importedMeshGroups: new Map<string, TransformNode>(),
};

// all male parts' file name
export const MALE_PARTS: GenderParts = {
    body: ["m_body_1"],
    eyeL: ["m_eyeL_1"],
    eyeR: ["m_eyeR_1"],
    bottom: ["m_bottom_1", "m_bottom_2"],
    hair: ["m_hair_1", "m_hair_2", "m_hair_3"],
    head: ["m_head_1", "m_head_2"],
    shoes: ["m_shoes_1", "m_shoes_2"],
    top: ["m_top_1", "m_top_2"],
};

// all male parts' file name
export const FEMALE_PARTS: GenderParts = {
    body: ["f_body_1"],
    eyeL: ["f_eyeL_1"],
    eyeR: ["f_eyeR_1"],
    bottom: ["f_bottom_1"],
    hair: ["f_hair_1", "f_hair_2", "f_hair_3"],
    head: ["f_head_1", "f_head_2"],
    shoes: ["f_shoes_1", "f_shoes_2"],
    top: ["f_top_1"],
};


export const DEFAULT_MALE_PARTS: GenderParts = {
    body: ["m_body_1"],
    eyeL: ["m_eyeL_1"],
    eyeR: ["m_eyeR_1"],
    bottom: ["m_bottom_1"],
    hair: ["m_hair_2"],
    head: ["m_head_1"],
    shoes: ["m_shoes_1"],
    top: ["m_top_2"],
};

export const DEFAULT_FEMALE_PARTS: GenderParts = {
    body: ["f_body_1"],
    eyeL: ["f_eyeL_1"],
    eyeR: ["f_eyeR_1"],
    bottom: ["f_bottom_1"],
    hair: ["f_hair_2"],
    head: ["f_head_1"],
    shoes: ["f_shoes_1"],
    top: ["f_top_1"],
};