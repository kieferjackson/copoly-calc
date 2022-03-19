
class Monomer {
    constructor(mass, wpercent, mpercent, molar_mass, moles) {
        this.mass = mass;
        this.wpercent = wpercent;
        this.mpercent = mpercent;
        this.molar_mass = molar_mass;
        this.moles = moles;
    }
}

funcStats = [];
monomerStats = [];

funcID = ['A', 'B'];

function getInputValues() {
    var inputs = document.getElementsByClassName("input_field");

    let stringAcceptable = checkDataTypes("string", "input_field");
    let intAcceptable = checkDataTypes("int", "input_field");
    let floatAcceptable = checkDataTypes("float", "input_field");

    let inputsAcceptable = stringAcceptable && intAcceptable && floatAcceptable;

    if (inputsAcceptable === false) {
        console.log("inputsAcceptable: " + inputsAcceptable);
    } else {
        console.log("inputsAcceptable: " + inputsAcceptable);

        funcStats = [];
    
        for (var i = 0 ; i < 2 ; i++) {

            var molar_eq_value;

            if (document.getElementById("func" + funcID[i] + "_eq").childElementCount > 1) {
                molar_eq_value = parseFloat(document.getElementById("molar_eq_input_field_" + funcID[i]).value);
            } else {
                molar_eq_value = 1.0;
            }

            funcStats[i] = {
                percent_type: percentTypeChecker(),
                name: inputs[i + 2].value,
                num: parseInt(inputs[i + 4].value),
                molar_eq: molar_eq_value,
                start: 0 + parseInt(inputs[4].value) * i,
                end: parseInt(inputs[4].value) + parseInt(inputs[5].value) * i,
                unknown: null
            }; 
        }
    
        generateForm();
    }

}

function getDynamicFormData() {

    var dynFormData = document.getElementsByClassName("dyn_input_field");

    let inputsAcceptable = checkDataTypes("float", "dyn_input_field");

    var unknownCount = [0, 0];

    if (inputsAcceptable === false) {
        console.log("inputsAcceptable: " + inputsAcceptable);
        monomerStats = [];
    } else {
        for (var i = 0 ; i < 2 ; i++) {
            
            for (var q = funcStats[i].start ; q < funcStats[i].end ; q++) {

                // Initialize monomerStats object to zero
                monomerStats[q] = {
                    mass:       0,
                    wpercent:   0,
                    mpercent:   0,
                    molar_mass: 0,
                    moles:      0
                }
                console.log(monomerStats[q].moles);

                mass_input = dynFormData[0 + q * 3];
                percent_input = dynFormData[1 + q * 3];
                molar_mass_input = dynFormData[2 + q * 3];

                // Check for unknown monomers (missing information for mass and percent)
                if (mass_input.value === '' && percent_input.value === '') {
                    unknownCount[i]++;
                    funcStats[i].unknown = q;

                    if (unknownCount[i] > 1) {
                        console.log("Your unknowns for functional group: " + funcStats[i].name + " has exceeded 1. Please enter more information for your input to be accepted.");
                    }
                }

                if (mass_input.value != '') {
                    monomerStats[q].mass = parseFloat(mass_input.value);
                    console.log("Mass for " + funcStats[i].name + funcStats[i].num + ": " + monomerStats[q].mass);
                }

                if (percent_input.value != '') {
                    switch (funcStats[i].percent_type) {
                        case 'weight':
                            monomerStats[q].wpercent = parseFloat(percent_input.value);
                            console.log("Wt Percent for " + funcStats[i].name + funcStats[i].num + ": " + monomerStats[q].wpercent);
                            break;

                        case 'mole':
                            monomerStats[q].mpercent = parseFloat(percent_input.value);
                            console.log("Ml Percent for " + funcStats[i].name + funcStats[i].num + ": " + monomerStats[q].mpercent);
                            break;
                    }
                }

                if (molar_mass_input.value != '') {
                    monomerStats[q].molar_mass = parseFloat(molar_mass_input.value);
                    console.log("Molar Mass for " + funcStats[i].name + funcStats[i].num + ": " + monomerStats[q].molar_mass);
                }
                
            }
        }
        
        if (unknownCount[0] <= 1 && unknownCount[1] <= 1) {
            startDataSorting();
        } else {
            console.log("There is not enough monomer information given for calculations to be possible.");
        }

    }

}

function checkDataTypes(data_type, input_class) {

    switch (data_type) {
        case 'int':     // Integer Checker
            console.log("checking integer values...");
            let raw_int_data = document.getElementsByClassName(input_class + " int");

            var i = 0;
            do {

                if (parseInt(raw_int_data[i].value) <= 0) {
                    console.log("Number values must be greater than 0.");
                    var intAcceptable = false;
                } else if (raw_int_data[i].value.match(/\d+/) != null) {
                    var intAcceptable = true;
                } else {
                    var intAcceptable = false;
                    console.log("ERROR - Invalid data at checkDataTypes function (Integer)\nOne of your input fields may be missing a value.");
                }

                i++;

            } while (intAcceptable === true && i < raw_int_data.length);

            return intAcceptable;

        case 'string':  // String Checker
            console.log("checking string values...");
            let raw_string_data = document.getElementsByClassName(input_class + " string");

            if ((raw_string_data[2].value || raw_string_data[3].value) === "") {
                console.log("A valid name must be entered");
                var nameAcceptable = false;
            } else if (checkParity(raw_string_data[2].value, raw_string_data[3].value) === true) {
                console.log("A valid name must be entered (cannot be identical)");
                var nameAcceptable = false;
            } else if (typeof (raw_string_data[2].value && typeof raw_string_data[3].value) === 'string') {
                var nameAcceptable = true;
            } else {
                var nameAcceptable = false;
            }

            return nameAcceptable;

        case 'float':   // Float Checker
            console.log("checking float values...");
            let raw_float_data = document.getElementsByClassName(input_class + " float");
            var floatAcceptable = true;
            debugger;

            var i = 0;
            if (raw_float_data.childElementCount > 0) while (floatAcceptable === true && i < raw_float_data.length) {
                console.log(raw_float_data[i].value);

                if (input_class === "dyn_input_field" && raw_float_data[i].value === '') {
                    debugger;
                    floatAcceptable = true;
                } else if (raw_float_data[i].value <= 0) {
                    debugger;
                    console.log("ERROR - Invalid data at checkDataTypes function (Float)\n\t*Values less than or equal to 0 are not accepted.");
                    floatAcceptable = false;
                } else if (raw_float_data[i].value.match(/\d+/) != null) {
                    debugger;
                    floatAcceptable = true;
                } else {
                    debugger;
                    floatAcceptable = false;
                    console.log("ERROR - Invalid data at checkDataTypes function (Float)\n\t*One of your input fields may be missing a value.");
                }
                
                i++;

            }

            return floatAcceptable;

        default:
            console.log("ERROR - Unknown datatype.");
    }

    return false;
}

function toggleMolarEQ(xs_func_group) {
    console.log(xs_func_group);

    var current_state = document.getElementsByName("molar_eq")[0].id;

    switch (current_state) {
        case 'neutral':
            let eq = document.getElementById("func" + xs_func_group + "_eq");
            let f = createInputField(xs_func_group);
            eq.append(f);

            updated_state = "xs_" + xs_func_group;
            document.getElementsByName("molar_eq")[0].id = updated_state;
            console.log(document.getElementsByName("molar_eq")[0].id);
            break;

        case 'xs_A':
            // Toggle A off
            fieldToRemove = document.getElementById("molar_eq_input_field_A");
            fieldToRemove.remove();

            switch (xs_func_group) {
                case 'A':
                    // Update status
                    document.getElementsByName("molar_eq")[0].id = 'neutral';

                    break;

                case 'B':
                    let eq = document.getElementById("func" + xs_func_group + "_eq");
                    let f = createInputField(xs_func_group);
                    eq.append(f);

                    updated_state = "xs_" + xs_func_group;
                    document.getElementsByName("molar_eq")[0].id = updated_state;
                    console.log(document.getElementsByName("molar_eq")[0].id);
                    break;
            }
            break;

        case 'xs_B':
            // Toggle B off
            fieldToRemove = document.getElementById("molar_eq_input_field_B");
            fieldToRemove.remove();

            switch (xs_func_group) {
                case 'B':
                    // Update status
                    document.getElementsByName("molar_eq")[0].id = 'neutral';

                    break;

                case 'A':
                    let eq = document.getElementById("func" + xs_func_group + "_eq");
                    let f = createInputField(xs_func_group);
                    eq.append(f);

                    updated_state = "xs_" + xs_func_group;
                    document.getElementsByName("molar_eq")[0].id = updated_state;
                    console.log(document.getElementsByName("molar_eq")[0].id);
                    break;
            }
            break;
    }
    
}

function createInputField(xs_func_group) {
    let field = document.createElement("input");
    field.setAttribute("type", "text");
    field.setAttribute("id", "molar_eq_input_field_" + xs_func_group);
    field.setAttribute("class", "input_field float");

    return field;
}

function checkParity(var1, var2) {
    if (var1 === var2) {
        return true;
    } else if (var1 != var2) {
        return false;
    } else {
        console.log("There was a problem checking parity between var1: " + var1 + " and var2: " + var2);
    }
}

function percentTypeChecker() {
    if (document.getElementsByClassName("input_field")[0].checked == true) {
        return "weight";
    } else {
        return "mole";
    }
}

