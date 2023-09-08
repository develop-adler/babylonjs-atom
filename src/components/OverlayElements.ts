class OverlayElements {
    private _appElement: HTMLElement;
    private _overlayContainerElement!: HTMLElement;
    private _controlSwitchElement!: HTMLElement;

    constructor() {
        this._appElement = document.getElementById("app")!;
        this.createOverlayContainer();
        this.createControlSwitchElement();
    }

    private createOverlayContainer(): void {
        this._overlayContainerElement = document.createElement("div");
        this._overlayContainerElement.id = "overlayContainer";
        const css = document.createElement("style");
        css.innerHTML = `
            #overlayContainer {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 5;
            }
        `;
        document.getElementsByTagName("head")[0].appendChild(css);
        this._appElement.appendChild(this._overlayContainerElement);
    }

    private createControlSwitchElement(): void {
        this._controlSwitchElement = document.createElement("div");
        this._controlSwitchElement.id = "controlSwitch";
        const css = document.createElement("style");
        css.innerHTML = `
            #controlSwitch {
                pointer-events: none;
                position: absolute;
                right: 2rem;
                bottom: 2.5rem;
                // background-color: rgba(102, 102, 102, 0.50);
                // backdrop-filter: blur(0.3125rem);
                // border-radius: 1.5rem;
                border: none;
                padding: 0;
            
                @media (max-width: 600px) {
                    left: auto;
                    right: 3rem;
                    bottom: 3rem;
                }
            }

            input[type=checkbox]{
                height: 0;
                width: 0;
                visibility: hidden;
            }
        
            #toggle {
                pointer-events: all;
                cursor: pointer;
                text-indent: -9999px;
                width: 200px;
                height: 100px;
                background: #FC4F91;
                display: block;
                border-radius: 100px;
                position: relative;
                // transition: background-color 0.2s ease-in-out;
                scale: 0.7;
            }
        
            #toggle:after {
                content: '';
                position: absolute;
                top: 5px;
                left: 5px;
                width: 90px;
                height: 90px;
                background: #fff;
                border-radius: 90px;
                transition: 0.3s;
            }
        
            // input:checked + #toggle {
            //     background: #bada55;
            // }
        
            input:checked + #toggle:after {
                left: calc(100% - 5px);
                transform: translateX(-100%);
            }
        
            #toggle:active:after {
                width: 130px;
            }
        `;
        document.getElementsByTagName("head")[0].appendChild(css);

        const toggleInput = document.createElement("input");
        toggleInput.type = "checkbox";
        toggleInput.id = "toggleInput";

        const toggleLabel = document.createElement("label");
        toggleLabel.id = "toggle";
        toggleLabel.htmlFor = "toggleInput";

        this._controlSwitchElement.appendChild(toggleInput);
        this._controlSwitchElement.appendChild(toggleLabel);

        toggleLabel.addEventListener("click", (e: MouseEvent) => {
            e.stopPropagation();
            this.switchControlMode();
        });

        this._overlayContainerElement.appendChild(this._controlSwitchElement);
    }

    private switchControlMode(): void {
        console.log('called switch');
    }
}

export default OverlayElements;