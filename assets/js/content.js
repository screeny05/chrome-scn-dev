(function(){
    const state = new Map();
    const contextMenuHandlers = {};

    contextMenuHandlers.domReloadCss = req => {
        Array.from(document.querySelectorAll('link[rel=stylesheet][href]')).forEach(l => {
            const href = l.href.replace(/([?&])scn-reload=[^&?]*([?&]?)/g, (s, p1, p2) => p2 ? p1 : '');
            l.href = href + (href.indexOf('?') === -1 ? '?' : '&') + 'scn-reload=' + Date.now();
        });
    };

    contextMenuHandlers.cssForceScrollbars = req => {
        const STATE_ID = 'cssForceScrollbarsStyle';

        if(!req.active && state.has(STATE_ID)){
            const style = state.get(STATE_ID);
            style.remove();
            state.delete(STATE_ID);
            return;
        }

        if(!req.active){
            return;
        }

        const style = document.createElement('style');

        style.innerHTML = `
            ::-webkit-scrollbar { background: #f7f7f7; }
            ::-webkit-scrollbar-thumb { background: hotpink; border-radius: 5px; }
        `;

        document.querySelector('body').append(style);
        state.set(STATE_ID, style);
    };

    contextMenuHandlers.htmlRemoveRequired = req => {
        const properties = ['required', 'minlength', 'maxlength', 'pattern'];
        properties.forEach(prop => {
            document.querySelectorAll(`[${prop}]`).forEach(el => el[prop] = null);
        });
    };

    contextMenuHandlers.jsLogJqueryEvents = req => {
        const $inject = document.createElement('script');
        $inject.innerHTML = `
            const orgPublish = $.publish;

            $.publish = function(eventName, ...args){
                console.log(eventName, args);
                orgPublish(eventName, ...args);
            };
        `;
        document.head.appendChild($inject);
    };

    contextMenuHandlers.bitbucketToggleFilter = req => {
        let extensions = req.config['bitbucket--filter-extensions'];
        let isBlacklist = req.config['bitbucket--filter-blacklist'];
        extensions = extensions.split(',');
        extensions = extensions.map(extension => extension.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"));
        const extensionRegex = new RegExp(`(${extensions.join('|')})$`, 'i');

        const $inject = document.createElement('script');
        $inject.innerHTML = `
            $('.bb-patch .bb-udiff').each((i, el) => {
                const $el = $(el);
                const $content = $el.find('.refract-content-container');
                const path = $el.data('filename');
                $content.toggle(path.match(${extensionRegex}) !== null !== ${isBlacklist});
            });
        `;
        document.head.appendChild($inject);
    };

    contextMenuHandlers.itcssLint = req => {
        const namespaces = ['o', 'c', 'u', 's', 't', 'is', 'has'];
        const suffixes = ['xs', 's', 'ms', 'sm', 'md', 'lg', 'l', 'xl', 'print'];

        const SEVERITY_ERROR = 'error';
        const SEVERITY_WARNING = 'warn';
        const SEVERITY_INFO = 'info';

        const ERR_TYPE_STRAY_ELEMENT = 'stray-element';
        const ERR_TYPE_MISSING_NAMESPACE = 'missing-namespace';
        const ERR_TYPE_INVALID_SUFFIX = 'invalid-suffix';
        const ERR_TYPE_CAMELCASE = 'camelcase';
        const ERR_TYPE_MISSING_NON_MODIFIED = 'missing-non-modified';

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);

        /** cls has to have a namespace */
        const namespaceChecker = (node, cls) => {
            const regex = new RegExp(`^_?(${namespaces.join('|')})-.`);
            return {
                success: regex.test(cls),
                message: `${cls} needs to start with a namespace. possible namespaces are: ${namespaces.join(', ')}`,
                severity: SEVERITY_ERROR,
                type: ERR_TYPE_MISSING_NAMESPACE
            };
        };

        /** cls either needs no suffix, or a valid one */
        const mediaSuffixChecker = (node, cls) => {
            const regex = /@(.*?)$/;
            const match = cls.match(regex);

            if(!match){
                return { success: true };
            }

            return {
                success: suffixes.indexOf(match[1]) !== -1,
                message: `${cls} has an invalid suffix of '${match[1]}'. possible suffixes are: ${suffixes.join(', ')}`,
                severity: SEVERITY_ERROR,
                type: ERR_TYPE_INVALID_SUFFIX
            }
        };

        /** cls has to be all lowercase */
        const camelcaseChecker = (node, cls) => {
            return {
                success: cls.toLowerCase() === cls,
                message: `${cls} needs to be all-lowercase. no camleCase allowed`,
                severity: SEVERITY_ERROR,
                type: ERR_TYPE_CAMELCASE
            }
        };

        /** modifiers can't stand alone */
        const nonModifiedChecker = (node, cls) => {
            const regex = /^(.*?)--/;
            const match = cls.match(regex);

            if(!match){
                return { success: true };
            }

            return {
                success: node.classList.contains(match[1]),
                message: `the modifier ${cls} doesn't have a matching block or element on the same element ${match[1]}`,
                severity: SEVERITY_ERROR,
                type: ERR_TYPE_MISSING_NON_MODIFIED
            };
        };

        /** element has to be inside a block */
        const strayElementChecker = (node, cls) => {
            const regex = /^(.*?)__/;
            const match = cls.match(regex);

            if(!match){
                return { success: true };
            }

            while(node.parentElement){
                node = node.parentElement;
                if(node.classList.contains(match[1])){
                    return { success: true };
                }
            }

            return {
                success: false,
                message: `the element ${cls} is not contained within the parent-block ${match[1]}`,
                severity: SEVERITY_ERROR,
                type: ERR_TYPE_STRAY_ELEMENT
            };
        };

        const checkers = [namespaceChecker, mediaSuffixChecker, camelcaseChecker, nonModifiedChecker, strayElementChecker];

        const messages = [];

        while(walker.nextNode()){
            const node = walker.currentNode;

            if(node.classList.length === 0){
                continue;
            }

            node.classList.forEach(cls => {
                checkers.forEach(checker => {
                    const message = checker(node, cls);
                    if(message.success){
                        return;
                    }

                    messages.push({
                        node,
                        message: message.message,
                        severity: message.severity,
                        type: message.type
                    });
                });
            });
        }


        let lastType = null;

        messages
            .sort((a, b) => a.type < b.type ? -1 : a.type > b.type ? 1 : 0)
            .forEach(msg => {
                if(msg.type !== lastType){
                    console.groupEnd();
                    console.groupCollapsed(msg.type);
                    lastType = msg.type;
                }
                console[msg.severity](msg.message, msg.node);
            });

        console.groupEnd();
    };


    chrome.extension.onMessage.addListener(req => contextMenuHandlers[req.action] && contextMenuHandlers[req.action](req));
})();
