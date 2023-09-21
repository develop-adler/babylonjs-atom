import {
    ActionManager,
    ArcRotateCamera,
    ExecuteCodeAction,
    Mesh,
    PhysicsBody,
    PhysicsRaycastResult,
    Quaternion,
    Ray,
    Scene,
    Vector3,
} from "@babylonjs/core";
import Joystick from "../OverlayElements/Joystick";
import { EventData, JoystickOutputData } from "nipplejs";
import { SCENE_SETTINGS } from "../../utils/global";
import Avatar from "./Avatar";

interface KeyStatus {
    " ": boolean; // space
    Shift: boolean;
    w: boolean;
    arrowup: boolean;
    a: boolean;
    arrowleft: boolean;
    s: boolean;
    arrowright: boolean;
    d: boolean;
    arrowdown: boolean;
}

class AvatarController {
    private _scene: Scene;
    private _camera: ArcRotateCamera;
    private _avatar: Avatar;
    private _avatarRoot: Mesh;
    private _meshBody: PhysicsBody;
    private _joystick?: Joystick;
    private _raycaster: Ray;
    private _raycastResult: PhysicsRaycastResult;

    private _isActive: boolean = false;
    private _isDancing: boolean = false;
    private _isCrouching: boolean = false;
    private _isMoving: boolean = false;
    private _isRunning: boolean = false;

    private keyStatus: KeyStatus = {
        " ": false, // space
        Shift: false,
        w: false,
        arrowup: false,
        a: false,
        arrowleft: false,
        s: false,
        arrowright: false,
        d: false,
        arrowdown: false,
    };

    private oldMove: { x: number; y: number; z: number };
    private moveDirection: Vector3 = Vector3.Zero();
    private frontVector: Vector3 = Vector3.Zero();
    private sideVector: Vector3 = Vector3.Zero();

    private static readonly AVATAR_HEAD_HEIGHT: number = 1.6;
    private static readonly CROUCH_SPEED: number = 0.015;
    private static readonly WALK_SPEED: number = 0.03;
    private static readonly RUN_SPEED: number = 0.06;
    private static readonly DISTANCE_FROM_WALL: number = 0.8;

    private animSpeed: number = 1.0;
    private moveSpeed: number = AvatarController.WALK_SPEED;

    constructor(
        avatar: Avatar,
        camera: ArcRotateCamera,
        scene: Scene,
        joystick?: Joystick,
    ) {
        this._avatar = avatar;
        this._avatarRoot = avatar.root;
        this._meshBody = avatar.physicsBody;
        this._camera = camera;
        this._scene = scene;
        this._joystick = joystick;

        this._raycaster = new Ray(new Vector3(0, 0, 0), new Vector3(0, 1, 0));
        this._raycastResult = new PhysicsRaycastResult();

        if (this._joystick !== undefined) {
            const handleJoystickMove = (
                e: EventData,
                data: JoystickOutputData,
            ): void => {
                this._joystick!.setEvent(e);
                this._joystick!.setData(data);
            };

            this._joystick.getManager().on("start", handleJoystickMove);
            this._joystick.getManager().on("move", handleJoystickMove);
            this._joystick.getManager().on("end", handleJoystickMove);
        }

        this.oldMove = { x: 0, y: 0, z: 0 };

        this._init();

        if (this._avatarRoot === undefined) {
            console.error("Mesh is undefined");
        }
        if (this._meshBody === undefined) {
            console.error("Mesh phyics body is undefined");
        }
        if (this._camera === undefined) {
            console.error("Camera is undefined");
        }
        if (
            this._avatarRoot !== undefined &&
            this._meshBody !== undefined &&
            this._camera !== undefined
        ) {
            this.start();
        }
    }

    private _init(): void {
        // Keyboard input
        this._scene.actionManager = new ActionManager(this._scene);

        // on key down
        this._scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, e => {
                const key = e.sourceEvent.key.toLowerCase();

                switch (key) {
                    case "shift":
                        // Slow down if shift is held
                        this.moveSpeed = AvatarController.CROUCH_SPEED;
                        this._isCrouching = true;
                        // Stop dancing animation
                        this._isDancing = false;
                        break;
                    case "control":
                        this._toggleRun();
                        break;
                    case "g":
                        this._isDancing = !this._isDancing;
                        break;
                    default:
                        if (key in this.keyStatus) {
                            this.keyStatus[key as keyof KeyStatus] = true;
                        }
                }
            }),
        );

        // on key up
        this._scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, e => {
                const key = e.sourceEvent.key.toLowerCase();

                if (key === "shift") {
                    this._isCrouching = false;

                    if (!this._isRunning) {
                        this.moveSpeed = AvatarController.WALK_SPEED;
                    } else {
                        this.moveSpeed = AvatarController.RUN_SPEED;
                    }
                }
                if (key in this.keyStatus) {
                    this.keyStatus[key as keyof KeyStatus] = false;
                }
            }),
        );
    }

    public start(): void {
        this._isActive = true;
        this._scene.onBeforeRenderObservable.add(this._updateController);
    }

    public stop(): void {
        this._isActive = false;
        this._scene.onBeforeRenderObservable.removeCallback(this._updateController);
    }

    private _updateController = () => {
        this._updateCharacter();
        this._updateCamera();
        this._updateCharacterAnimation();
    };

    private _updateCharacterAnimation(): void {
        if (this._isMoving) {
            if (this._isCrouching) {
                this._playAnimation("CrouchWalk");
            } else {
                if (this._isRunning) {
                    this._playAnimation("Run");
                } else {
                    this._playAnimation("Walk");
                }
            }
        } else {
            switch (true) {
                // play dance animation if g is pressed
                case this._isDancing:
                    this._playAnimation("Dance");
                    break;
                // play crouch animation if shift is held
                case this._isCrouching:
                    this._playAnimation("Crouch");
                    break;
                // play idle animation if no movement keys are pressed
                default:
                    this._playAnimation("Idle");
                    break;
            }
        }
    }

    private _updateCamera(): void {
        if (!this._isActive) return;

        const translation = this._avatarRoot.position;

        const tmpX = translation.x;
        const tempY = translation.y;
        const tmpZ = translation.z;
        const deltaX = tmpX - this.oldMove.x;
        const deltaY = tempY - this.oldMove.y;
        const deltaZ = tmpZ - this.oldMove.z;
        this.oldMove.x = tmpX;
        this.oldMove.y = tempY;
        this.oldMove.z = tmpZ;

        this._camera.position.x += deltaX;
        this._camera.position.y += deltaY;
        this._camera.position.z += deltaZ;

        this._camera.setTarget(
            new Vector3(
                translation.x,
                translation.y +
                AvatarController.AVATAR_HEAD_HEIGHT -
                (this._avatar.gender === "male" ? 0 : 0.2),
                translation.z,
            ),
        );

        this._updateRaycaster();
    }

    private _updateCharacter(): void {
        if (!this._isActive) return;

        // keyboard controls
        const forward = !!this.keyStatus["w"] || !!this.keyStatus["arrowup"];
        const backward = !!this.keyStatus["s"] || !!this.keyStatus["arrowdown"];
        const left = !!this.keyStatus["a"] || !!this.keyStatus["arrowleft"];
        const right = !!this.keyStatus["d"] || !!this.keyStatus["arrowright"];

        if (
            this._joystick?.getEvent()?.type === "move" &&
            this._joystick?.getData()?.angle?.radian
        ) {
            this._isMoving = true;
            this._isDancing = false;

            // calculate direction from joystick
            // add additional 270 degree to the right
            const directionOffset: number =
                -this._joystick.getData().angle?.radian + Math.PI * 0.5 + Math.PI;

            // calculate towards camera direction
            const angleYCameraDirection: number = Math.atan2(
                this._camera.position.x - this._avatarRoot.position.x,
                this._camera.position.z - this._avatarRoot.position.z,
            );

            // rotate mesh with respect to camera direction with lerp
            this._avatarRoot.rotationQuaternion = Quaternion.Slerp(
                this._avatarRoot.rotationQuaternion!,
                Quaternion.RotationAxis(
                    Vector3.Up(),
                    angleYCameraDirection + directionOffset,
                ),
                0.2,
            );

            // ========================================================
            // move physics body

            // get joystick x and y vectors
            const joystickVector = this._joystick.getData().vector;
            this.moveDirection.set(joystickVector.x, 0, joystickVector.y);
            this.moveDirection.scaleInPlace(this.moveSpeed * 100);

            // move according to camera's rotation
            this.moveDirection.rotateByQuaternionToRef(
                this._camera.absoluteRotation,
                this.moveDirection,
            );

            // get y velocity to make it behave properly
            const vel = this._meshBody.getLinearVelocity();
            this.moveDirection.y = vel.y;

            // move
            this._meshBody.setLinearVelocity(this.moveDirection);
        } else if (forward || backward || left || right) {
            this._isMoving = true;
            this._isDancing = false;

            this.frontVector.set(0, 0, Number(forward) - Number(backward));
            this.sideVector.set(Number(left) - Number(right), 0, 0);

            this.moveDirection.set(
                this.frontVector.x - this.sideVector.x,
                0,
                this.frontVector.z - this.sideVector.z,
            );
            this.moveDirection.normalize();
            this.moveDirection.scaleInPlace(this.moveSpeed * 100);

            // move according to camera's rotation
            this.moveDirection.rotateByQuaternionToRef(
                this._camera.absoluteRotation,
                this.moveDirection,
            );

            // calculate towards camera direction
            const angleYCameraDirection = Math.atan2(
                this._camera.position.x - this._avatarRoot.position.x,
                this._camera.position.z - this._avatarRoot.position.z,
            );

            // get direction offset
            const directionOffset = this._calculateDirectionOffset();

            // rotate mesh with respect to camera direction with lerp
            this._avatarRoot.rotationQuaternion = Quaternion.Slerp(
                this._avatarRoot.rotationQuaternion!,
                Quaternion.RotationAxis(
                    Vector3.Up(),
                    angleYCameraDirection + directionOffset,
                ),
                0.2,
            );

            // move the mesh by moving the physics body
            const vel = this._meshBody.getLinearVelocity();
            this.moveDirection.y = vel.y;
            this._meshBody.setLinearVelocity(this.moveDirection);
        } else {
            // prevent sliding around
            const vel = this._meshBody.getLinearVelocity();
            this._meshBody.setLinearVelocity(new Vector3(0, vel.y, 0));
            this._isMoving = false;
        }
    }

    // this prevents camera from clipping through walls
    private _updateRaycaster() {
        if (!this._scene.getPhysicsEngine()) return;

        const from = new Vector3(
            this._avatarRoot.position.x,
            this._avatarRoot.position.y + 1.15,
            this._avatarRoot.position.z,
        );
        const to = new Vector3(
            this.camera.position.x,
            this.camera.position.y,
            this.camera.position.z,
        );

        const target = new Vector3(
            this._avatarRoot.position.x,
            this._avatarRoot.position.y + 1.15,
            this._avatarRoot.position.z,
        );

        this._scene.createPickingRayToRef(
            this._scene.pointerX,
            this._scene.pointerY,
            null,
            this._raycaster,
            this._camera,
        );

        (this._scene.getPhysicsEngine() as any)!.raycastToRef(
            from,
            to,
            this._raycastResult,
        );

        if (this._raycastResult.hasHit) {
            const hitPoint = this._raycastResult.hitPointWorld;

            const direction = hitPoint
                .clone()
                .subtractInPlace(this._camera.position)
                .normalize();

            // Computes the distance from hitPoint to this._camera.position
            const distance = Vector3.Distance(hitPoint, this._camera.position);

            // Computes the new position of the camera
            const newPosition = hitPoint.subtract(
                direction.scale(AvatarController.DISTANCE_FROM_WALL * distance),
            );

            // update the max distance of camera
            this._camera.upperRadiusLimit = Vector3.Distance(hitPoint, target);

            // Lerp camera position
            const lerpFactor = 0.8; // Adjust this value for different speeds
            this._camera.position = Vector3.Lerp(
                this._camera.position,
                newPosition,
                lerpFactor,
            );

            this._raycastResult.reset();

            return;
        }

        // reset max distance of camera
        if (SCENE_SETTINGS.isThirdperson) {
            this._camera.upperRadiusLimit = 5;
        } else {
            this._camera.upperRadiusLimit = 0;
        }
    }

    private _toggleRun(): void {
        this._isRunning = !this._isRunning;
        this.moveSpeed = this._isRunning
            ? AvatarController.RUN_SPEED *
            (this._avatar.gender === "female" ? 0.7 : 1)
            : AvatarController.WALK_SPEED *
            (this._avatar.gender === "female" ? 0.7 : 1);
    }

    private _calculateDirectionOffset(): number {
        let directionOffset = 0;

        switch (true) {
            case this.keyStatus["w"] || this.keyStatus["arrowup"]:
                switch (true) {
                    case this.keyStatus["d"] || this.keyStatus["arrowright"]:
                        directionOffset = -Math.PI * 0.25 - Math.PI * 0.5;
                        break;
                    case this.keyStatus["a"] || this.keyStatus["arrowleft"]:
                        directionOffset = Math.PI * 0.25 + Math.PI * 0.5;
                        break;
                    default:
                        directionOffset = Math.PI;
                        break;
                }
                break;
            case this.keyStatus["s"] || this.keyStatus["arrowdown"]:
                switch (true) {
                    case this.keyStatus["d"] || this.keyStatus["arrowright"]:
                        directionOffset = -Math.PI * 0.25;
                        break;
                    case this.keyStatus["a"] || this.keyStatus["arrowleft"]:
                        directionOffset = Math.PI * 0.25;
                        break;
                }
                break;
            case this.keyStatus["d"] || this.keyStatus["arrowright"]:
                directionOffset = -Math.PI * 0.5;
                break;
            case this.keyStatus["a"] || this.keyStatus["arrowleft"]:
                directionOffset = Math.PI * 0.5;
                break;
        }

        return directionOffset;
    }

    private _playAnimation(name: string) {
        if (!(name in this._avatar.animations)) return;

        Object.entries(this._avatar.animations).forEach(
            ([animName, animationGroup]) => {
                if (animName === name) {
                    this._avatar.animations[name].start(
                        true,
                        this.animSpeed,
                        this._avatar.animations[name].from,
                        this._avatar.animations[name].to,
                        false,
                    );
                } else {
                    animationGroup.stop();
                }
            },
        );
    }

    public get scene(): Scene {
        return this._scene;
    }
    public get camera(): ArcRotateCamera {
        return this._camera;
    }
    public get mesh(): Mesh {
        return this._avatarRoot;
    }
    public get meshBody(): PhysicsBody {
        return this._meshBody;
    }
    public get joystick(): Joystick | undefined {
        return this._joystick;
    }

    public dispose(): void {
        this.stop();
    }
}

export default AvatarController;
