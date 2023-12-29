import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { faker } from '@faker-js/faker';
import Select from 'react-select';

const options = [
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'full_name', label: 'Full Name' },
  { value: 'email', label: 'Email' },
  { value: 'address', label: 'Address' },
  { value: 'phone_number', label: 'Phone' },
  { value: 'bio', label: 'Bio' },
];

const customStyles = {
  control: (provided) => ({
    ...provided,
    height: '40px', // Adjust the height as needed
    width: '200px',
    backgroundColor: 'black', // Change the background color
    color: 'white', // Change the background color
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'white', // Change the color of the selected option text to red
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: '#333', // Change the background color of options
    color: 'white', // Change the text color of options
    '&:hover': {
      backgroundColor: '#666',
    },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#9d9797', // Change the placeholder color
  }),
  input: (provided) => ({
    ...provided,
    color: 'white', // Adjust the color of the search text here
  }),
  menu: (provided) => ({
    ...provided,
    border: '1px solid #666',
    borderRadius: '4px',
  }),
  // Add more custom styles as needed
};
const App = () => {
  const [inputNames, setInputNames] = useState([]);
  const [currentTabId, setCurrentTabId] = useState(null);
  // App.jsx


  useEffect(() => {
    const updateInputNames = () => {
      chrome.tabs.onActivated.addListener(async (activeInfo) => {
        setCurrentTabId(activeInfo.tabId); // Update current tab ID
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              const inputNames = Array.from(document.querySelectorAll('input, textarea'))
                .filter(input => !input.type || !input.type.toLowerCase().includes('file'))
                .map(input => input.getAttribute('name'))
                .filter(Boolean);

              chrome.runtime.sendMessage({ inputNames });
            }
          });
        }
      });
    };

    chrome.storage.local.get(['inputNames'], (result) => {
      if (result.inputNames) {
        setInputNames(result.inputNames);
      }
    });

    updateInputNames();
  }, []);

  useEffect(() => {
    if (currentTabId) {
      const sessionKey = `session_${currentTabId}`;
      chrome.storage.local.get([sessionKey], (result) => {
        const storedSessions = result[sessionKey] || {};
        setInputNames(storedSessions);
      });
    }
  }, [currentTabId]);


  const onClick = async () => {
    await fillFakeValue();
    let [tab] = await chrome.tabs.query({ active: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {

        const formFields = document.querySelectorAll('input, textarea');
        formFields.forEach(async (field) => {
          const fieldName = field.name.toLowerCase();

          chrome.storage.local.get(['inputNames'], async (result) => {
            if (result.inputNames) {
              const matchingField = result.inputNames.find(inp => inp.name.toLowerCase() === fieldName);
              console.log(matchingField)
              // const matchingField = Object.keys(formData).find(key => key.toLowerCase() === fieldName);
              if (matchingField) {
                field.value = matchingField.fakeValue;
              }
            }
          })
        });

        // for select

        const selectFormFields = document.querySelectorAll('select');

        selectFormFields.forEach(selectField => {
          const options = selectField.querySelectorAll('option');

          if (options.length > 0) {
            // Randomly select an option index
            const randomIndex = Math.floor(Math.random() * (options.length - 1)) + 1; // Ensure randomIndex > 0

            // Set the selected option to the randomly chosen index
            options[randomIndex].selected = true;
          }
        });

        // for multiSelect

        const multiSelectFormFields = document.querySelectorAll('select[multiple]');
        multiSelectFormFields.forEach(selectField => {
          const options = selectField.querySelectorAll('option');
          const totalOptions = options.length;

          if (totalOptions > 5) {
            const numberOfOptionsToChoose = Math.floor(Math.random() * 4) + 2; // Random count from 2 to 5

            const selectedIndexes = new Set();
            while (selectedIndexes.size < numberOfOptionsToChoose) {
              const randomIndex = Math.floor(Math.random() * totalOptions);
              selectedIndexes.add(randomIndex);
            }

            options.forEach(option => option.selected = false);

            selectedIndexes.forEach(index => {
              options[index].selected = true;
            });

            selectField.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });

        // for files
        // const fileInputs = document.querySelectorAll('input[type="file"]');

        // fileInputs.forEach(fileInput => {
        //     // You can inject content near the file input to inform the user about allowed file types
        //     const message = document.createElement('p');
        //     message.textContent = 'Please select a JPG, PNG, or PDF file.';
        //     message.style.color = 'red'; // Style as needed

        //     fileInput.parentNode.insertBefore(message, fileInput.nextSibling);
        // });
      }
    })
  }

  const handleInputValue = (selectedOption, index) => {

    const updatedInputNames = [...inputNames]; // Create a copy of the inputNames array
    updatedInputNames[index].value = selectedOption; // Update the value in the corresponding object

    setInputNames(updatedInputNames); // Update the state with the modified array
    chrome.storage.local.set({ inputNames: updatedInputNames });

    if (currentTabId) {
      const sessionKey = `session_${currentTabId}`;
      const updatedSessions = { ...updatedInputNames };
      updatedSessions[index] = selectedOption;
      chrome.storage.local.set({ [sessionKey]: updatedSessions });
    }
  };

  const fillFakeValue = async () => {
    const updatedInputNames = [...inputNames]; // Create a copy of the inputNames array
    // let selectedOption = updatedInputNames[index];
    updatedInputNames.forEach((selectedOption, index) => {
      if (selectedOption.value.value === 'full_name' || selectedOption.value.value === 'first_name' || selectedOption.value.value === 'last_name') {
        const name = faker.person.fullName();
        if (selectedOption.value.value === 'full_name')
          updatedInputNames[index].fakeValue = name;
        else if (selectedOption.value.value === 'first_name')
          updatedInputNames[index].fakeValue = faker.person.firstName();
        else
          updatedInputNames[index].fakeValue = faker.person.lastName();
      }

      else if (selectedOption.value.value === 'email') {
        updatedInputNames[index].fakeValue = faker.internet.email();
      }
      else if (selectedOption.value.value === 'phone_number') {
        updatedInputNames[index].fakeValue = faker.phone.number();
      }
      else if (selectedOption.value.value === 'address') {
        updatedInputNames[index].fakeValue = faker.location.streetAddress({ useFullAddress: true });
      }
      else if (selectedOption.value.value === 'bio') {
        updatedInputNames[index].fakeValue = faker.person.bio();
      }
    });
    setInputNames(updatedInputNames);
    chrome.storage.local.set({ inputNames: updatedInputNames });

    if (currentTabId) {
      const sessionKey = `session_${currentTabId}`;
      const updatedSessions = { ...updatedInputNames };
      updatedSessions[index] = selectedOption;
      chrome.storage.local.set({ [sessionKey]: updatedSessions });
    }
  }

  return (
    <>
      <div>
        <h3 className='logo'>Form Filler AI</h3>
      </div>
      <form>
        {inputNames.length && inputNames.map((name, index) => (
          <div className='formGroup' key={index}>
            <label className='formLabel'> {name.name} </label>
            <Select
              className="form-control"
              value={name.value}
              onChange={(selectedOption) => handleInputValue(selectedOption, index)}// Pass index and event to the function
              options={options}
              isSearchable={true}
              placeholder="Select an option"
              styles={customStyles}
            />
          </div>
        ))}
      </form>
      <div className="card">
        <button onClick={onClick}>
          Fill Form
        </button>
      </div>
    </>
  )
}

export default App
