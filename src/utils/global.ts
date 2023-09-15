export const SCENE_SETTINGS: {
    isThirdperson: boolean;
    isEditingPictureMode: boolean;
    isEditingModelMode: boolean;
    hasModelSelected: boolean;
    editingImage: PictureSide | null;
    imageUploadInputField: HTMLInputElement;
} = {
    isThirdperson: false,
    isEditingPictureMode: false,
    isEditingModelMode: false,
    hasModelSelected: false,
    editingImage: null,
    imageUploadInputField: null!,
};
