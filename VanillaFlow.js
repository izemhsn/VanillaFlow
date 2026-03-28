export default class VanillaFlow {
    init() {
        this.directives = {
            'x-if': this.processIf.bind(this),
            'x-show': this.processShow.bind(this),
        };
        
        for (const [attr, handler] of Object.entries(this.directives)) {
            document.querySelectorAll(`[${attr}]`).forEach(el => {
                handler(el, el.getAttribute(attr));
            });
        }
        return this;
    }

    processIf(el, condition) {
        if (!this.evaluate(condition)) {
            el.remove();
        }
    }

    processShow(el, condition) {
        el.style.display = this.evaluate(condition) ? '' : 'none';
    }

    evaluate(expression) {
        try {
            return new Function(`return ${expression};`)();
        } catch {
            return undefined;
        }
    }
}

if (typeof window !== 'undefined') {
    window.VanillaFlow = VanillaFlow;
}