import "./style.css";

import Core from "./components/Core";
import OverlayElements from "./components/OverlayElements";

class App {
    constructor() {
        const core = new Core();
        new OverlayElements(core);
    }
}

new App();
