// `Validator` Constructor
function Validator (options) {
    /*
        options {
            form: string,
            rules: [],
            onSubmit: function (data) {},
        }
    */
    const selectorRules = {} // rule of input selectors as function ( functions test )

    const formElement = document.querySelector(options.form); // Getting element of the validation form
    // Handle validation error and submit action
    if (formElement) {
        formElement.onsubmit = function(e) {
            e.preventDefault();

            let isValidForm = true;

            // Filter each rule and validate
            options.rules.forEach(function (rule) {
                const inputElement = formElement.querySelector(rule.selector); // input element that has rule
                const isValid = validate(inputElement, rule);
                if (!isValid) {
                    isValidForm = false;
                }
            })
            
            if (isValidForm) {
                //  to return user inputs in Submit form
                if (typeof options.onSubmit === 'function') {
                    const enableInputs = formElement.querySelectorAll('[name]');
                    // User values
                    const formValues = Array.from(enableInputs).reduce(function(values, input) { //Array.from() => convert NodeList to array
                        console.log(input.type)
                        switch (input.type) {
                            case 'radio':
                                const val = formElement.querySelector('input[name="' + input.name + '"]:checked');
                                if (val === null) {
                                    values[input.name] = ''
                                } else {
                                    values[input.name] = val.value
                                }
                                break;
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values;
                                }
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }
                        
                        return values
                    }, {})
                    options.onSubmit(formValues)
                }
                // Trường hợp submit với hành vi mặc định
                else {
                    formElement.submit();
                }
            }
        }

        // Handle validation errors
        options.rules.forEach(function (rule) {
            
            // Add rules of each input element
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test)
            } else {
                selectorRules[rule.selector] = [rule.test];
            }
            
            const inputElements = formElement.querySelectorAll(rule.selector); // input element that has rule
            
            Array.from(inputElements).forEach(function (inputElement) {
                // Blur
                inputElement.onblur = function () {
                    validate(inputElement, rule);
                }
                // Inputing
                inputElement.oninput = function () {
                    const errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                    errorElement.innerText = '';
                    getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
                }
            })
        })
    }
    
    // Add/remove 'invalid' class
    function validate(inputElement, rule) {
        const errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
        let errorMessage;

        // Lấy ra rules
        const rules = selectorRules[rule.selector] // rules is a function

        // Lặp qua từng rule & check
        // Error => stop processing
        for (let i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    ) // value of an input element
                    break;
                default:
                    errorMessage = rules[i](inputElement.value) // value of an input element
            }
            
            if (errorMessage) break; // => error message là error đầu tiên
        }

        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid');
        } else {
            errorElement.innerText = '';
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
        }

        return !errorMessage;
    }

    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }
}

// Define the RULES
/*
1. Has Error => Return Error
2. Is Valid => Return undefined
*/

Validator.isRequired = function (selector) {
    return {
        selector: selector,
        test: function (value) {
            return value ? undefined : 'Vui lòng nhập trường này'
        }
    }
}

Validator.isEmail = function (selector){
    return {
        selector: selector,
        test: function (value) {
            const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            return regex.test(value) ? undefined : 'Trường này phải là Email'
        }
    }
}

Validator.minLength = function (selector, min){
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} kí tự`
        }
    }
}

Validator.isConfirmed = function (selector, getConfirmedValue, message) {
    return {
        selector: selector,
        test: function (value) {
            return value === getConfirmedValue() ? undefined : message || 'Giá trị nhập vào không chính xác'
        }
    }
}