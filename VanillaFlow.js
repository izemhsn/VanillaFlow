window.addEventListener('load', init);

function init() {
    processDirective('x-if', (el, condition) => {
        el.style.display = condition ? '' : 'none';
    });

    processDirective('x-show', (el, condition) => {
        el.style.visibility = condition ? 'visible' : 'hidden';
    });
}

function processDirective(attr, apply) {
    document.querySelectorAll(`[${attr}]`).forEach(el => {
        const expression = el.getAttribute(attr);
        apply(el, evaluateExpression(expression));
    });
}

function evaluateExpression(expression) {
    expression = expression.trim();
    
    if (expression === 'true') return true;
    if (expression === 'false') return false;
    
    try {
        return new Function(`return ${expression};`)();
    } catch {
        return false;
    }
}


