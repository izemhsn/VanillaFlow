export default class VanillaFlow {
    constructor(data = {}, options = {}) {
        const config = options || {};

        this.data = data;
        this.bindings = [];
        this._cache = new Map();
        this.sanitizeHtml = config.sanitizeHtml || VanillaFlow.sanitizeHtml;

        for (const key of Object.keys(data)) {
            if (typeof data[key] === 'function') {
                data[key] = data[key].bind(data);
            }
        }
    }

    init(root) {
        this.root = root || document.body;
        if (!this.root) return this;
        this.processNode(this.root, undefined);
        return this;
    }

    processNode(el, scope) {
        if (el.hasAttribute('x-for')) {
            this.processFor(el, el.getAttribute('x-for'), scope);
            return false;
        }
        if (el.hasAttribute('x-if')) {
            const keep = this.evaluate(el.getAttribute('x-if'), scope);
            el.removeAttribute('x-if');
            if (!keep) {
                el.remove();
                return false;
            }
        }
        if (el.hasAttribute('x-model')) {
            this.processModel(el, el.getAttribute('x-model'), scope);
            el.removeAttribute('x-model');
        }
        if (el.hasAttribute('x-text')) {
            const expr = el.getAttribute('x-text');
            el.textContent = this.evaluate(expr, scope) ?? '';
            this.bindings.push({ type: 'text', el, expr, scope });
            el.removeAttribute('x-text');
        }
        if (el.hasAttribute('x-html')) {
            const expr = el.getAttribute('x-html');
            el.innerHTML = this.sanitizeHtml(this.evaluate(expr, scope)) ?? '';
            this.bindings.push({ type: 'html', el, expr, scope });
            el.removeAttribute('x-html');
        }
        if (el.hasAttribute('x-show')) {
            const expr = el.getAttribute('x-show');
            el.style.display = this.evaluate(expr, scope) ? '' : 'none';
            this.bindings.push({ type: 'show', el, expr, scope });
            el.removeAttribute('x-show');
        }
        this.processBindAttrs(el, scope);
        this.processOnAttrs(el, scope);

        for (const child of Array.from(el.children)) {
            this.processNode(child, scope);
        }
        return true;
    }

    processModel(el, expression, scope) {
        const isCheckbox = el.type === 'checkbox';
        const current = this.evaluate(expression, scope);
        if (isCheckbox) el.checked = !!current;
        else el.value = current ?? '';

        el.addEventListener(isCheckbox ? 'change' : 'input', () => {
            const val = isCheckbox ? el.checked : el.value;
            this.evaluate(`${expression} = __vfval`, { ...(scope || {}), __vfval: val });
            this.refresh();
        });
    }

    processBindAttrs(el, scope) {
        const attrs = Array.from(el.attributes).filter(a => a.name.startsWith('x-bind:'));
        for (const attr of attrs) {
            const attrName = attr.name.slice(7);
            const expr = attr.value;
            el.removeAttribute(attr.name);
            this.applyAttr(el, attrName, this.evaluate(expr, scope));
            this.bindings.push({ type: 'attr', el, expr, scope, attr: attrName });
        }
    }

    applyAttr(el, name, value) {
        if (value === true) el.setAttribute(name, '');
        else if (value === false || value == null) el.removeAttribute(name);
        else el.setAttribute(name, value);
    }

    processOnAttrs(el, scope) {
        for (const a of Array.from(el.attributes)) {
            if (!a.name.startsWith('x-on:')) continue;
            const [event, ...modifiers] = a.name.slice(5).split('.');
            const handler = a.value;
            el.removeAttribute(a.name);
            el.addEventListener(event, ($event) => {
                for (const mod of modifiers) {
                    if (mod === 'prevent') $event.preventDefault();
                    if (mod === 'stop') $event.stopPropagation();
                }
                this.evaluate(handler, { ...(scope || {}), $event });
                this.refresh();
            });
        }
    }

    processFor(el, expression, parentScope) {
        const match = expression.match(/^(?:\(([^)]+)\)|(\S+))\s+in\s+(.+)$/);
        if (!match) return;

        const [, destructured, simpleVar, arrayExpr] = match;
        const array = this.evaluate(arrayExpr, parentScope);
        if (!Array.isArray(array)) return;

        const parent = el.parentNode;
        if (!parent) return;

        const fragment = document.createDocumentFragment();

        array.forEach((item, index) => {
            const clone = el.cloneNode(true);
            clone.removeAttribute('x-for');

            const scope = { ...parentScope };
            if (destructured) {
                const parts = destructured.split(',').map(p => p.trim());
                scope[parts[0]] = item;
                if (parts[1]) scope[parts[1]] = index;
            } else {
                scope[simpleVar] = item;
            }

            if (this.processNode(clone, scope)) fragment.appendChild(clone);
        });

        parent.replaceChild(fragment, el);
    }

    refresh() {
        this.bindings = this.bindings.filter(b => b.el.isConnected);
        for (const b of this.bindings) {
            const v = this.evaluate(b.expr, b.scope);
            if (b.type === 'text') b.el.textContent = v ?? '';
            else if (b.type === 'html') b.el.innerHTML = this.sanitizeHtml(v) ?? '';
            else if (b.type === 'show') b.el.style.display = v ? '' : 'none';
            else if (b.type === 'attr') this.applyAttr(b.el, b.attr, v);
        }
    }

    static sanitizeHtml(value) {
        const html = value == null ? '' : String(value);
        const purifier = typeof globalThis !== 'undefined' ? globalThis.DOMPurify : undefined;

        if (purifier && typeof purifier.sanitize === 'function') {
            return purifier.sanitize(html);
        }

        if (typeof document === 'undefined') return '';

        const template = document.createElement('template');
        template.innerHTML = html;

        const blockedTags = new Set([
            'BASE',
            'EMBED',
            'FORM',
            'IFRAME',
            'LINK',
            'META',
            'OBJECT',
            'SCRIPT',
            'STYLE',
            'TEMPLATE'
        ]);
        const blockedAttrs = new Set(['srcdoc']);
        const urlAttrs = new Set(['action', 'formaction', 'href', 'poster', 'src', 'xlink:href']);

        for (const node of Array.from(template.content.querySelectorAll('*'))) {
            if (blockedTags.has(node.tagName)) {
                node.remove();
                continue;
            }

            for (const attr of Array.from(node.attributes)) {
                const name = attr.name.toLowerCase();
                if (
                    name.startsWith('on') ||
                    blockedAttrs.has(name) ||
                    (urlAttrs.has(name) && VanillaFlow.isUnsafeUrl(attr.value))
                ) {
                    node.removeAttribute(attr.name);
                }
            }
        }

        return template.innerHTML;
    }

    static isUnsafeUrl(value) {
        const normalized = String(value)
            .trim()
            .replace(/[\u0000-\u001F\u007F\s]+/g, '')
            .toLowerCase();

        return (
            normalized.startsWith('javascript:') ||
            normalized.startsWith('vbscript:') ||
            normalized.startsWith('data:')
        );
    }

    evaluate(expression, scope) {
        try {
            let fn = this._cache.get(expression);
            if (!fn) {
                fn = new Function(
                    '$data', '$scope',
                    `with ($data) { with ($scope) { return (${expression}); } }`
                );
                this._cache.set(expression, fn);
            }
            return fn(this.data, scope || {});
        } catch (err) {
            console.warn(`[VanillaFlow] Error evaluating "${expression}":`, err.message);
            return undefined;
        }
    }
}

if (typeof window !== 'undefined') {
    window.VanillaFlow = VanillaFlow;
}
