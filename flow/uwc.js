
/** Helpers */
const resolveProperty = (value, context) => {
    let binding = context;
    for (const property of value.split(".")) {
        if (binding === undefined) break;
        binding = binding[property];
    }
    return binding;
};

/**
 * @param {HTMLElement} element
 * @param {string} value
 */
const setup = (element, value) => {
    element.closestCtx ??= element.closest("[ctx]");
    element.closestClone ??= element.closest("[data-for-child]");
    let resolvedValue = resolveProperty(
        element.getAttribute(value),
        element.closestCtx,
    );

    if (element.closestClone) {
        const subContext = XFor.contexts.get(element.closestClone);
        resolvedValue = resolveProperty(
            element.getAttribute(value),
            subContext,
        );
    }

    return resolvedValue;
};

/**
 * Reactivity engine adapter. We need to pass the Utility Component, the value 
 * and the arguments needed for each `main` function.
 * To use it with your desired reactivity engine, just replace the checking and the
 * cleanup method. 
 * @param {HTMLElement} element target custom element
 * @param {any} resolvedValue value resolved in the component
 * @param {Object} args additional arguments needed for each main function
 */
const reactiveBinding = (element, resolvedValue, args) => {
    if (resolvedValue.listen) {
            const listener = resolvedValue.listen((val) => {
                element.main(val, args);
            });
            listener.until(() => {
                !element.closestCtx.isConnected || !element.closestClone?.isConnected;
            });
        } else {
            element.main(resolvedValue, args);
        }
};
/******************/

export class XText extends HTMLElement {
    static pipes = new Map();

    main(value, { textNode }) {
        if (this.pipe) {
            value = this.pipe.replaceAll(" ", ",").split(",").reduce(
                (prev, current) => {
                    return prev = XText.pipes.get(current)?.(prev) ?? prev;
                },
                value,
            );
        }
        textNode.textContent = value;
        if (this.isConnected) this.replaceWith(textNode);
    }

    connectedCallback() {
        let resolvedValue = setup(this, "val");
        this.pipe = this.getAttribute("pipe");

        if (resolvedValue === undefined) return;

        const textNode = document.createTextNode("");
        reactiveBinding(this, resolvedValue, { textNode })
    }
}

export class XShow extends HTMLElement {
    main(value, { fragment, commentPlaceholder }) {
        if (this.isConnected) {
            this.replaceWith(value ? fragment : commentPlaceholder);
            return;
        }

        if (commentPlaceholder.isConnected && value) {
            for (const child of this.renderedNodes) {
                fragment.append(child);
            }
            commentPlaceholder.replaceWith(fragment);
        }
        if (this.renderedNodes.some((node) => node.isConnected) && !value) {
            this.renderedNodes.forEach((node, index) => {
                index === 0
                    ? node.replaceWith(commentPlaceholder)
                    : node.remove();
            });
        }

        this.replaceWith(fragment);
    }

    connectedCallback() {
        const resolvedValue = setup(this, "if");
        this.renderedNodes = [...this.children];

        const fragment = new DocumentFragment();
        const commentPlaceholder = new Comment("x-show");
        reactiveBinding(this, resolvedValue, {
            fragment,
            commentPlaceholder
        })
    }
}

export class XFor extends HTMLElement {
    static contexts = new WeakMap();

    main(value, { template, alias }) {
        if (!value) {
            this.remove();
            return;
        }
        this.parent.replaceChildren();
        for (const el of value) {
            const clone = template.cloneNode(true);
            clone.setAttribute("data-for-child", "");
            XFor.contexts.set(clone, { [alias]: el });
            this.parent.appendChild(clone);
        }
        if (this.isConnected) this.remove()
    }

    connectedCallback() {
        const resolvedValue = setup(this, "of");
        const alias = this.getAttribute("const");
        const template = this.firstElementChild;
        this.parent = this.parentElement;

        reactiveBinding(this, resolvedValue, { template, alias })
    }
}

export class XBind extends HTMLElement {
    connectedCallback() {
        this.target = this.hasAttribute("target")
            ? document.querySelector(this.getAttribute("target"))
            : this.parentElement;

        for (const [index, attr] of this.getAttributeNames().entries()) {
            if (!attr.includes(":")) continue;
            const resolvedValue = setup(this, [attr]);

            if (resolvedValue === undefined) {
                continue;
            }
            if (attr.startsWith("on:")) {
                this.target.addEventListener(
                    attr.slice(3),
                    (e) => resolvedValue(e),
                );
            }
            if (attr.startsWith("attr:")) {
                this.target.setAttribute(
                    attr.replace("attr:", ""),
                    resolvedValue,
                );
            }
            if (attr.startsWith("class:")) {

            }
            if (index === this.getAttributeNames().length - 1) this.remove();
        }
    }
}

