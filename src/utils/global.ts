export const SCENE_SETTINGS: {
    isThirdperson: boolean;
    isEditingPictureMode: boolean;
    editingImage:
    | "front"
    | "leftFront"
    | "rightFront"
    | "leftBack"
    | "rightBack"
    | null;
    imageUploadInputField: HTMLInputElement;
} = {
    isThirdperson: false,
    isEditingPictureMode: false,
    editingImage: null,
    imageUploadInputField: null!,
};
