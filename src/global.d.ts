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
}