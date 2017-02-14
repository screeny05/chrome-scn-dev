chrome.runtime.onInstalled.addListener(() => {
    const contexts = ['all'];

    [{
        title: 'Reload CSS',
        id: 'domReloadCss'
    }, {
        title: 'Un[require] Inputs',
        id: 'htmlRemoveRequired'
    }, {
        title: 'Force Scrollbars',
        id: 'cssForceScrollbars',
        type: 'checkbox',
        checked: false
    }, {
        title: 'Lint ITCSS',
        id: 'itcssLint'
    }, {
        title: 'Log $.publish events',
        id: 'jsLogJqueryEvents',
        type: 'checkbox',
        checked: false
    }, {
        title: 'Filter Bitbucket PR',
        id: 'bitbucketToggleFilter',
        type: 'checkbox',
        checked: false
    }].forEach(menu => chrome.contextMenus.create(Object.assign(menu, { contexts })));
});

chrome.contextMenus.onClicked.addListener((e, tab) => {
    const id = e.menuItemId;
    chrome.storage.sync.get(config => {
        chrome.tabs.sendMessage(tab.id, {
            action: id,
            active: e.checked,
            config
        });
    });
});

const commandHandlers = {};

commandHandlers.tabReorderRight = () => {
    chrome.tabs.getSelected(undefined, tab => chrome.tabs.move(tab.id, { index: tab.index + 1 }));
};

commandHandlers.tabReorderLeft = () => {
    chrome.tabs.getSelected(undefined, tab => chrome.tabs.move(tab.id, { index: tab.index - 1 }));
};

chrome.commands.onCommand.addListener(command => commandHandlers[command] && commandHandlers[command](command));
