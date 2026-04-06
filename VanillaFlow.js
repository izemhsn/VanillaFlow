export default class VanillaFlow {
    constructor(data = {}) {
        this.data = data;
        
        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'function') {
                data[key] = data[key].bind(data);
            }
        });
    }

    init() {
        this.directives = {
            'x-model': this.processModel.bind(this),
            'x-text': this.processText.bind(this),
            'x-html': this.processHtml.bind(this),
            'x-show': this.processShow.bind(this),
            'x-if': this.processIf.bind(this),
            'x-bind': this.processBind.bind(this),
            'x-for': this.processFor.bind(this),
        };
        
        for (const [attr, handler] of Object.entries(this.directives)) {
            document.querySelectorAll(`[${attr}]`).forEach(el => {
                handler(el, el.getAttribute(attr));
            });
        }
        
        document.querySelectorAll('*').forEach(el => {
            this.processBindAttrs(el);
            this.processOnAttrs(el);
        });
        return this;
    }

    processModel(el, expression) {
        el.value = this.evaluate(expression);
        
        el.addEventListener('input', () => {
            this.data[expression] = el.value;
            document.querySelectorAll('[x-text]').forEach(el => {
                el.textContent = this.evaluate(el.getAttribute('x-text'));
            });
        });
    }

    processText(el, expression) {
        el.textContent = this.evaluate(expression);
    }

    processHtml(el, expression) {
        el.innerHTML = this.evaluate(expression);
    }

    processShow(el, expression) {
        el.style.display = this.evaluate(expression) ? '' : 'none';
    }

    processIf(el, expression) {
        if (!this.evaluate(expression)) {
            el.remove();
        }
    }

    processBind(el, expression) {
        el.value = this.evaluate(expression);
    }

    processBindAttrs(el) {
        const attrs = Array.from(el.attributes).filter(a => a.name.startsWith('x-bind:'));
        for (const attr of attrs) {
            const attrName = attr.name.slice(7);
            const value = this.evaluate(attr.value);
            el.removeAttribute(attr.name);
            if (value === true) {
                el.setAttribute(attrName, '');
            } else if (value === false || value === null || value === undefined) {
                el.removeAttribute(attrName);
            } else {
                el.setAttribute(attrName, value);
            }
        }
    }

    processOnAttrs(el) {
        for (const a of Array.from(el.attributes)) {
            if (a.name.startsWith('x-on:')) {
                const eventConfig = a.name.slice(5);
                const [event, ...modifiers] = eventConfig.split('.');
                const handler = a.value;
                el.removeAttribute(a.name);
                
                el.addEventListener(event, (e) => {
                    for (const mod of modifiers) {
                        if (mod === 'prevent') e.preventDefault();
                        if (mod === 'stop') e.stopPropagation();
                    }
                    this.evaluate(handler);
                    document.querySelectorAll('[x-text]').forEach(el => {
                        el.textContent = this.evaluate(el.getAttribute('x-text'));
                    });
                });
            }
        }
    }

    processFor(el, expression) {
        const match = expression.match(/^(?:\(([^)]+)\)|(\S+))\s+in\s+(.+)$/);
        if (!match) return;
        
        const [, destructured, simpleVar, arrayExpr] = match;
        const array = this.evaluate(arrayExpr);
        
        if (!Array.isArray(array)) return;
        
        const fragment = document.createDocumentFragment();
        const parent = el.parentNode;
        const savedData = this.data;
        
        array.forEach((item, index) => {
            const clone = el.cloneNode(true);
            clone.removeAttribute('x-for');
            
            this.data = { ...savedData };
            if (destructured) {
                const parts = destructured.split(',').map(p => p.trim());
                this.data[parts[0]] = item;
                if (parts[1]) this.data[parts[1]] = index;
            } else {
                this.data[simpleVar] = item;
            }
            
            const els = [clone, ...clone.querySelectorAll('*')];
            for (const child of els) {
                for (const [attr, handler] of Object.entries(this.directives)) {
                    if (attr !== 'x-for' && child.hasAttribute(attr)) {
                        handler(child, child.getAttribute(attr));
                        child.removeAttribute(attr);
                    }
                }
                this.processBindAttrs(child);
                this.processOnAttrs(child);
            }
            
            fragment.appendChild(clone);
        });
        
        this.data = savedData;
        parent.replaceChild(fragment, el);
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