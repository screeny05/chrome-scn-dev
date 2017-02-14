document.addEventListener('DOMContentLoaded', function(){
    const $form = document.querySelector('[data-save-options="true"]');
    const $inputs = Array.from(document.querySelectorAll('input, textarea', $form));

    const getInputById = id => {
        return $inputs.filter($input => $input.id === id)[0];
    };

    const setInputValue = ($input, value) => {
        const type = $input.type;
        if(type === 'checkbox' || type === 'radio'){
            $input.checked = value;
        } else {
            $input.value = value;
        }
    };

    const getInputValue = $input => {
        const type = $input.type;
        if(type === 'checkbox' || type === 'radio'){
            return $input.checked;
        } else {
            return $input.value;
        }
    };

    const restoreValues = () => {
        chrome.storage.sync.get(values => {
            Object.keys(values).forEach(key => {
                const value = values[key];
                const $input = getInputById(key);
                setInputValue($input, value);
            });
        });
    };

    const saveValues = () => {
        const values = {};
        $inputs.forEach($input => {
            values[$input.id] = getInputValue($input);
        });

        chrome.storage.sync.set(values);
    };

    $form.addEventListener('submit', e => {
        e.preventDefault();
        saveValues();
    });
    restoreValues();
});
