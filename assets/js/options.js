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

    const serializeForm = () => {
        const values = {};
        $inputs.forEach($input => {
            values[$input.id] = getInputValue($input);
        });

        return values;
    };

    const deserializeForm = values => {
        Object.keys(values).forEach(key => {
            const value = values[key];
            const $input = getInputById(key);
            if(!$input){
                return;
            }
            setInputValue($input, value);
        });
    };

    const restoreValues = () => chrome.storage.sync.get(deserializeForm);
    const saveValues = () => chrome.storage.sync.set(serializeForm());

    $form.addEventListener('submit', e => {
        e.preventDefault();
        saveValues();
    });
    restoreValues();
});
