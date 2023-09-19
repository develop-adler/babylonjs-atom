import nipplejs, {
    EventData,
    JoystickManager,
    JoystickOutputData,
} from "nipplejs";

class Joystick {
    private manager: JoystickManager;
    private event: EventData;
    private data: JoystickOutputData;
    private _joystickContainer!: HTMLElement;

    constructor() {
        this._joystickContainer = document.createElement("div");
        this._joystickContainer.id = "joystick";
        const joystickCSS = document.createElement("style");
        joystickCSS.innerHTML = `
            #joystick {
                position: absolute;
                bottom: 15%;
                left: 15%;
                z-index: 2;
                scale: 1.5;

                @media screen and (max-width: 768px) {
                    left: 25%;
                    scale: 1.25;
                }
                transition: all 0.4s ease-in-out;
            }
        `;
        document.getElementsByTagName("head")[0].appendChild(joystickCSS);
        document.getElementById("app")!.appendChild(this._joystickContainer);

        this.manager = nipplejs.create({
            zone: document.querySelector("#joystick") as HTMLElement,
            // size: 100 * (window.innerHeight / 720),
            mode: "static",
            position: { top: "50%", left: "50%" },
        });
        this.event = null!;
        this.data = null!;
    }

    public getManager(): JoystickManager {
        return this.manager;
    }
    public getEvent(): EventData {
        return this.event;
    }
    public getData(): JoystickOutputData {
        return this.data;
    }
    public setEvent(e: EventData): void {
        this.event = e;
    }
    public setData(data: JoystickOutputData): void {
        this.data = data;
    }
    public show(): void {
        this._joystickContainer.style.display = "block";
    }
    public hide(): void {
        this._joystickContainer.style.display = "none";
    }

    public dispose(): void {
        this.manager.destroy();
    }
}

export default Joystick;
