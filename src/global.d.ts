export { };

declare global {
    type PictureSide = "front" | "leftFront" | "rightFront" | "leftBack" | "rightBack";

    interface PictureInterface {
        front: Picture | null;
        leftFront: Picture | null;
        rightFront: Picture | null;
        leftBack: Picture | null;
        rightBack: Picture | null;
    }

    type GenderParts = {
        eyeL: Array<string>;
        eyeR: Array<string>;
        bottom: Array<string>;
        body: Array<string>;
        hair: Array<string>;
        head: Array<string>;
        shoes: Array<string>;
        top: Array<string>;
    };
}