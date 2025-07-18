import { computed, echo } from "http://pkg.alpalmtree.dev/echoes/v0.0.1/mod.js";
import { XBind, XFor, XShow, XText } from "./uwc.js";

// Using web components
class AppRoot extends HTMLElement {
    connectedCallback() {
        this.appendChild(
            document.getElementById("app").content.cloneNode(true),
        );
    }

    name = echo("stranger");
    displayName = computed(() => this.name.value || "stranger", [this.name]);
    count = echo(0);
    showCount = computed(() => this.count.value > 0, [this.count]);
    logs = echo([]);

    increment = () => {
        this.count.next(this.count.value + 1);
    };

    decrement = () => {
        if (this.count.value > 0) this.count.next(this.count.value - 1);
    };

    changeHello = (e) => {
        this.name.next(e.target.value);
    };

    createLog = () => {
        const log = new Date();

        this.logs.next((logs) =>
            logs.push({
                id: Date.now(),
                value: log.toString(),
            })
        );
    };
}

customElements.define("app-root", AppRoot);

XText.pipes.set("upperCase", (val) => val.toUpperCase());
XText.pipes.set("toDashes", (val) => val.split("").join("-"));

customElements.define("x-show", XShow);
customElements.define("x-txt", XText);
customElements.define("x-for", XFor);
customElements.define("x-bind", XBind);
