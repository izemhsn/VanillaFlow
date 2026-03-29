export default class VanillaFlow {
    constructor(data = {}) {
        this.data = data;
    }

    init() {
        this.directives = {
            'x-if': this.processIf.bind(this),
            'x-show': this.processShow.bind(this),
            'x-text': this.processText.bind(this),
            'x-html': this.processHtml.bind(this),
        };
        
        for (const [attr, handler] of Object.entries(this.directives)) {
            document.querySelectorAll(`[${attr}]`).forEach(el => {
                handler(el, el.getAttribute(attr));
            });
        }
        return this;
    }

    processIf(el, expression) {
        if (!this.evaluate(expression)) {
            el.remove();
        }
    }

    processShow(el, expression) {
        el.style.display = this.evaluate(expression) ? '' : 'none';
    }

    processText(el, expression) {
        el.textContent = this.evaluate(expression);
    }

    processHtml(el, expression) {
        el.innerHTML = this.evaluate(expression);
    }

    evaluate(path) {
        let value = this.data;
        for (const key of path.split('.')) {
            value = value?.[key];
        }
        return value;
    }
}

if (typeof window !== 'undefined') {
    window.VanillaFlow = VanillaFlow;
}