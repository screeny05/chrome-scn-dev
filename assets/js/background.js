chrome.runtime.onInstalled.addListener(() => {
    const contexts = ['all'];

    chrome.contextMenus.create({
        title: 'Reload CSS',
        id: 'domReloadCss',
        contexts
    });

    chrome.contextMenus.create({
        title: 'Un[require] Inputs',
        id: 'htmlRemoveRequired',
        contexts
    });

    chrome.contextMenus.create({
        title: 'Force Scrollbars',
        id: 'cssForceScrollbars',
        type: 'checkbox',
        checked: false,
        contexts
    });

    chrome.contextMenus.create({
        title: 'Lint ITCSS',
        id: 'itcssLint',
        contexts
    });
});

chrome.contextMenus.onClicked.addListener((e, tab) => {
    const id = e.menuItemId;
    chrome.tabs.sendMessage(tab.id, {
        action: id,
        active: e.checked
    });
});
