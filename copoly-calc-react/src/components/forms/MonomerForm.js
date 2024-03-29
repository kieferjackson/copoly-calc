import React from 'react';
import { useFuncGroups, useFuncDispatch } from '../../contexts/FuncContext';
import { UPDATE_FUNC, UPDATE_MONOMERS } from '../../contexts/actions';
import { FUNC_FORM, MONOMER_FORM, FINAL_RESULTS } from '../../contexts/page_names';

// Import FuncGroup Class for defining input data
import Monomer from '../../utils/Monomer';
// Functions for determining calculation routes and performing calculations
import { startDataSorting } from '../../utils/data_sorting';
import { doReferenceCalculations, doComplimentaryCalculations } from '../../utils/func_calculations';
// Import validator functions and error message generation
import { checkDataTypes, compareFloatValues } from '../../utils/validators';
import { invalidErrorMessage } from '../../utils/helpers';
// Import ornamental functions for improving displayed data
import { capitalizeFirstLetter } from '../../utils/ornaments';
import { ERROR_TOLERANCE } from '../../utils/standards';

export default function FuncGroupForm()
{
    const { formData, funcGroups } = useFuncGroups();
    const { setFormData, setFuncGroup, setPage } = useFuncDispatch();
    
    const handleFormChange = (event) => {
        const { name, value } = event.target;
        
        // Update form field to new value
        setFormData({ formType: MONOMER_FORM, formField: name, value });
    }

    const handleFormSubmission = () => {
        // Contains the monomers for both functional groups as two separate arrays
        const parsedMonomers = funcGroups.map(({ name, num, percent_type }, funcGroupIndex) => {
            // Lists the monomers for this particular functional group
            let funcGroupMonomers = [];
            const funcName = capitalizeFirstLetter(name);

            // Track the number of unknowns per functional group !THERE CAN ONLY BE UP TO 1 UNKNOWN PER FUNCTIONAL GROUP
            let unknownCount = [0, 0];
            // Track that all given inputs are acceptable
            let inputsAcceptable = true;
            // Track the Percent Sum (should be less than 100 if not all percents given, should be 100 if all percents given)
            let percentsGiven = 0;
            let percentSum = 0.0;

            for (let i = 0 ; i < num ; i++)
            {
                const monomerName = `${funcName}-${i + 1}`;
                const { monomersForm } = formData;
                
                // Get given monomer form values, accessed with key value, identified by monomer name
                const given_mass = monomersForm[`mass${monomerName}`];
                const given_percent = monomersForm[`percent${monomerName}`];
                const given_molar_mass = monomersForm[`molar_mass${monomerName}`];

                // Set mass, percent, and molar mass values depending on input given
                const mass = given_mass === '' ? 0 : parseFloat(given_mass);
                const percent = given_percent === '' ? 0 : parseFloat(given_percent);
                const molar_mass = given_molar_mass === '' ? 0 : parseFloat(given_molar_mass);

                // Check that input values are acceptable and the correct datatype
                const massAcceptable = checkDataTypes('float', { value: mass, isMonomer: true });
                const percentAcceptable = checkDataTypes('float', { value: percent, isMonomer: true });
                const molar_massAcceptable = checkDataTypes('float', { value: molar_mass, isMonomer: true });

                // Set weight percent value depending on given conditions
                const weight_percent = percentAcceptable && percent_type === 'weight'
                    // Set this monomer to the given percent value
                    ? num === 1 ? 100 : percent   
                    // Set weight percent to 0 to indicate that it is undetermined
                    : num === 1 ? 100 : 0;
                
                // Set mole percent value depending on given conditions
                const mole_percent = percentAcceptable && percent_type === 'mole'
                    // Set this monomer to the given percent value
                    ? num === 1 ? 100 : percent   
                    // Set weight percent to 0 to indicate that it is undetermined
                    : num === 1 ? 100 : 0;  
                    
                // Add the given percent to the percent sum
                percentSum += percent_type === 'weight' ? weight_percent : mole_percent;
                if (weight_percent > 0 || mole_percent > 0) percentsGiven++;
                const allPercentsEntered = percentsGiven === num;
                const percentsSumValid = allPercentsEntered 
                    ? compareFloatValues(100.0, percentSum, ERROR_TOLERANCE)
                    : percentSum < 100.0;

                // Check if mass and percents are unknown
                if (mass === 0 && weight_percent === 0 && mole_percent === 0) 
                {
                    unknownCount[funcGroupIndex] += 1;
                    funcGroups[funcGroupIndex].setUnknown(i);

                    if (unknownCount[funcGroupIndex] > 1)
                    {
                        // There can only be up to 1 unknown in a functional group
                        console.error(invalidErrorMessage('less than or equal to 1', 'Unknowns'));
                        inputsAcceptable = false;
                    }
                }

                // Check if molar mass is unknown (for molar mass to be given, it must be greater than 0)
                if (!molar_mass > 0)
                {
                    console.error(invalidErrorMessage('greater than 0', 'Molar Mass'));
                    inputsAcceptable = false;
                }

                if (massAcceptable && percentAcceptable && percentsSumValid && molar_massAcceptable)
                {
                    const monomer = new Monomer(
                        mass,
                        weight_percent,
                        mole_percent,
                        molar_mass,
                        // The last property (moles) defaults to 0 because it will be calculated at its calculation route
                        0
                    );
                    
                    funcGroupMonomers.push({ data: monomer, isOK: inputsAcceptable });
                } else
                {
                    const ERROR_MESSAGE = `One or multiple of the values given for the ${monomerName} monomer is missing or invalid.`;
                    console.error(ERROR_MESSAGE);
                    inputsAcceptable = false;
                    funcGroupMonomers.push({ message: ERROR_MESSAGE, isOK: inputsAcceptable });
                }
            }

            // Add this functional group's monomers to the parseMonomers array
            return funcGroupMonomers;
        });
        
        console.log('Parsed funcGroups: ', parsedMonomers);
        console.log('Reducer State: ', funcGroups);

        const validateMonomers = (monomers) => {
            return monomers.reduce((validatedMonomers, monomer) => {
                if (monomer.isOK)
                    validatedMonomers.push(monomer.data);
                
                return validatedMonomers;
            }, []);
        }

        // Check that all monomers are valid by filtering out any which are not acceptable
        const [ monomersFuncA, monomersFuncB ] = parsedMonomers;
        const validMonomersFuncA = validateMonomers(monomersFuncA);
        const validMonomersFuncB = validateMonomers(monomersFuncB);
        const validMonomers = [validMonomersFuncA, validMonomersFuncB];
        
        // Evaluate if the monomers for each functional group are valid
        const [ funcA, funcB ] = funcGroups;
        const funcA_monomersOK = validMonomersFuncA.length === funcA.getNum();
        const funcB_monomersOK = validMonomersFuncB.length === funcB.getNum();
        
        if (funcA_monomersOK && funcB_monomersOK)
        {
            // Update the Functional Group Context with the validated monomer data
            setFuncGroup({ type: UPDATE_MONOMERS, 'funcGroups': { monomers: validMonomers } });
        }
        // Only the monomers for functional group A were invalid
        else if (funcA_monomersOK)
            console.error(Error('One of the monomers for Functional Group A was given invalid input. Please try again.'));
        // Only the monomers for functional group B were invalid
        else if (funcB_monomersOK)
            console.error(Error('One of the monomers for Functional Group B was given invalid input. Please try again.'));
        else
            console.error(Error('One of the monomers was given invalid input. Please try again.'));

    }

    React.useEffect(() => {
        if (funcGroups.length > 0)
        {
            const [ funcA, funcB ] = funcGroups;
            const monomersDefined = funcA.monomers.length > 0 && funcB.monomers.length > 0;
            
            // All necessary information has been given, so display final results
            if (monomersDefined) {
                // Start Data Sorting: returns updated functional groups with monomer stat counts in addition to calculation routes for functional groups
                const routes = startDataSorting(funcGroups);

                if (!routes) {
                    console.error(Error(`There was a problem finding one of the calculation routes`));
                }
                else {
                    const [ funcA_route, funcB_route ] = routes;

                    if (funcA.isReference) {
                        // Func Group A is reference, Func Group B is complimentary
                        const refCalculationsSuccessful = doReferenceCalculations(funcA, funcA_route);
                        if (refCalculationsSuccessful) {
                            const compCalculationsSuccessful = doComplimentaryCalculations(funcA, funcB, funcB_route);

                            if (compCalculationsSuccessful) {
                                // Display Final Results
                                setPage({ page: FINAL_RESULTS });
                            }
                        }
                    }
                    else if (funcB.isReference) {
                        // Func Group B is reference, Func Group A is complimentary
                        const refCalculationsSuccessful = doReferenceCalculations(funcB, funcB_route);
                        if (refCalculationsSuccessful) {
                            const compCalculationsSuccessful = doComplimentaryCalculations(funcB, funcA, funcA_route);

                            if (compCalculationsSuccessful) {
                                // Display Final Results
                                setPage({ page: FINAL_RESULTS });
                            }
                        }
                    }
                    else {
                        // No reference group for either functional group
                        console.error(Error(`No valid reference group`));
                    }
                }
            } 
        }
        else
        {
            // Func Groups were reset, so return to Func Group Form
            setPage({ page: FUNC_FORM });
        }
    }, [funcGroups, setPage]);

    const backToFuncForm = () => {
        setFuncGroup({ type: UPDATE_FUNC, funcGroups: [] });
    }
    
    return (
        <div className="form_container">
            <div id="monomer_data_entry" className="dynamic_form">
                {funcGroups.map(({ name, num, percent_type }) => {
                    const funcName = capitalizeFirstLetter(name);

                    return (
                    <form key={`${name}_entry`} name={`${name}_entry`} id={`${name}_entry`}>
                        <h2 className='dyn_heading'>{funcName} Group</h2>
                        <section className="ag_box">
                            <h3 className='ag_box_dyn_heading'>{funcName} Group</h3>
                            {Array.from({ length: num }, (monomer, index) =>
                                <div key={`${name}-${index + 1}`}>
                                    {/* Mass Input Field */}
                                    <label htmlFor={`mass${funcName}-${index + 1}`}>Mass (g)</label>
                                    <input 
                                        type="text" 
                                        name={`mass${funcName}-${index + 1}`} 
                                        value={formData.monomersForm[`mass${funcName}-${index + 1}`]}
                                        onChange={handleFormChange}
                                        className="dyn_input_field"
                                    />

                                    {/* Percent Input Field */}
                                    <label htmlFor={`percent${funcName}-${index + 1}`}>{`${capitalizeFirstLetter(percent_type)} Percent (%)`}</label>
                                    <input 
                                        type="text" 
                                        name={`percent${funcName}-${index + 1}`} 
                                        // Disable percent input and display 100 if there is only one monomer
                                        disabled={num === 1}
                                        placeholder={ num === 1 ? '100' : '' }
                                        value={num === 1 ? '100' : formData.monomersForm[`percent${funcName}-${index + 1}`]}
                                        onChange={handleFormChange}
                                        className="dyn_input_field"
                                    />

                                    {/* Molar Mass Input Field */}
                                    <label htmlFor={`molar_mass${funcName}-${index + 1}`}>Molar Mass (g/mol)</label>
                                    <input 
                                        type="text" 
                                        name={`molar_mass${funcName}-${index + 1}`} 
                                        value={formData.monomersForm[`molar_mass${funcName}-${index + 1}`]}
                                        onChange={handleFormChange}
                                        className="dyn_input_field" 
                                    />

                                    <br />
                                </div>
                            )}
                        </section>
                    </form>
                    )
                })}
                <div id='monomer_submit_container' className='submit_container'>
                    <button type='button' onClick={() => backToFuncForm()} className='back_button'>Back</button>
                    <button type='button' onClick={() => handleFormSubmission()} className='submit_button'>Next</button>
                </div>
            </div>
        </div>
    );
}