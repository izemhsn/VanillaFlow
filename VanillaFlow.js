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
            'x-bind': this.processBind.bind(this),
        };
        
        for (const [attr, handler] of Object.entries(this.directives)) {
            document.querySelectorAll(`[${attr}]`).forEach(el => {
                handler(el, el.getAttribute(attr));
            });
        }
        
        document.querySelectorAll('*').forEach(el => {
            const attrs = Array.from(el.attributes).filter(a => a.name.startsWith('x-bind:'));
            for (const attr of attrs) {
                const attrName = attr.name.slice(7);
                const value = this.evaluate(attr.value);
                el.removeAttribute(attr.name);
                if (value === true) {
                    el.setAttribute(attrName, '');
                } else if (value === false || value === null || value === undefined) {
                } else {
                    el.setAttribute(attrName, value);
                }
            }
        });
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

    processBind(el, expression) {
        el.value = this.evaluate(expression);
    }

    evaluate(expression) {
        try {
            const func = new Function(...Object.keys(this.data), `return ${expression}`);
            return func(...Object.values(this.data));
        } catch {
            let value = this.data;
            for (const key of expression.split('.')) {
                value = value?.[key];
            }
            return value;
        }
    }
}

if (typeof window !== 'undefined') {
    window.VanillaFlow = VanillaFlow;
}