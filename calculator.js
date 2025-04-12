import { inject } from "@vercel/analytics"
inject();

document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('display');
    const buttonsContainer = document.querySelector('.buttons'); 
    const settingsBtn = document.getElementById('settings-btn');
    const settingsMenu = document.getElementById('settings-menu');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    const fontRadios = document.querySelectorAll('input[name="font"]');
    const customThemeOptions = document.getElementById('custom-theme-options');
    const customColorPickers = customThemeOptions.querySelectorAll('input[type="color"]');
    const root = document.documentElement;
    
    const imageUploadInput = document.getElementById('theme-image-upload');
    const applyImageThemeBtn = document.getElementById('apply-image-theme');
    const resetImageThemeBtn = document.getElementById('reset-image-theme');
    const useImageAsBackgroundCheckbox = document.getElementById('use-image-as-background');
    const useImageAsBodyBackgroundCheckbox = document.getElementById('use-image-as-body-background');
    const extractColorsCheckbox = document.getElementById('extract-colors-from-image');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    
    let uploadedImage = null;

    let currentInput = '0';
    let previousInput = '';
    let operator = null;
    let shouldResetDisplay = false;

    function applyTheme(themeName) {
        root.classList.remove('theme-light', 'theme-blue', 'theme-forest', 'theme-custom', 'theme-image');
        if (themeName !== 'default' && themeName !== 'custom' && themeName !== 'image') {
            root.classList.add(`theme-${themeName}`);
        } else if (themeName === 'custom') {
             root.classList.add('theme-custom');
             applyCustomColors();
        } else if (themeName === 'image') {
            root.classList.add('theme-image');
            applyImageTheme();
        }
        
        customThemeOptions.classList.toggle('visible', themeName === 'custom');
        imagePreviewContainer.classList.toggle('hidden', themeName !== 'image');
        
        localStorage.setItem('calculatorTheme', themeName);
        updateSettingsButtonColor();
    }

    function applyFont(fontName) {
        root.style.setProperty('--main-font', fontName);
        localStorage.setItem('calculatorFont', fontName);
    }

    function applyCustomColors() {
        customColorPickers.forEach(picker => {
            const variableName = picker.dataset.var;
            const savedColor = localStorage.getItem(`customColor_${variableName}`);
            const colorValue = savedColor || picker.value;
            root.style.setProperty(variableName, colorValue);
            picker.value = colorValue;
        });
         updateSettingsButtonColor();
    }

     function saveCustomColor(variableName, colorValue) {
         localStorage.setItem(`customColor_${variableName}`, colorValue);
         if (document.querySelector('input[name="theme"][value="custom"]:checked')) {
             root.style.setProperty(variableName, colorValue);
             updateSettingsButtonColor();
         }
    }

    function updateSettingsButtonColor() {
        setTimeout(() => {
            const calcBgColor = getComputedStyle(root).getPropertyValue('--calc-bg').trim();            // Simple approach: use the calculator background color. Adjust if contrast is bad.
            settingsBtn.style.color = calcBgColor;
        }, 0);
    }

    function loadSettings() {
        const savedTheme = localStorage.getItem('calculatorTheme') || 'default';
        const savedFont = localStorage.getItem('calculatorFont') || 'sans-serif';

        const savedImageData = localStorage.getItem('calculatorImageTheme');
        if (savedImageData) {
            uploadedImage = savedImageData;
            imagePreview.src = savedImageData;
            applyImageThemeBtn.disabled = false;
            imagePreviewContainer.classList.toggle('hidden', savedTheme !== 'image');
        }

        // Load image theme settings
        useImageAsBackgroundCheckbox.checked = localStorage.getItem('useImageAsBackground') !== 'false';
        useImageAsBodyBackgroundCheckbox.checked = localStorage.getItem('useImageAsBodyBackground') === 'true';
        extractColorsCheckbox.checked = localStorage.getItem('extractColorsFromImage') !== 'false';

        applyTheme(savedTheme);
        applyFont(savedFont);   

        const themeRadio = document.querySelector(`input[name="theme"][value="${savedTheme}"]`);
        if(themeRadio) themeRadio.checked = true;
        const fontRadio = document.querySelector(`input[name="font"][value="${savedFont}"]`);
        if(fontRadio) fontRadio.checked = true;

        if (savedTheme === 'custom') {
            customThemeOptions.classList.add('visible');
            applyCustomColors(); // Apply custom colors if custom theme is loaded
        } else {
            customThemeOptions.classList.remove('visible');
        }
        updateSettingsButtonColor();
    }


    function updateDisplay() {
        if (currentInput === 'Infinity' || currentInput === '-Infinity' || isNaN(currentInput) && currentInput !== 'Error') {
            currentInput = 'Error';
        }
        display.value = currentInput;

    }
    function clearCalculator() {
        currentInput = '0';
        previousInput = '';
        operator = null;
        shouldResetDisplay = false;
        updateDisplay();
    }

    function inputDigit(digit) {
        if (currentInput === 'Error') return; // Don't add digits after an error

        if (shouldResetDisplay) {
            currentInput = digit;
            shouldResetDisplay = false;
        } else {
            // Prevent multiple leading zeros
            currentInput = currentInput === '0' ? digit : currentInput + digit;
        }
        updateDisplay();
    }

    function inputDecimal() {
        if (currentInput === 'Error') return;
        if (shouldResetDisplay) {
            currentInput = '0.';
            shouldResetDisplay = false;
            updateDisplay();
            return;
        }
        // Add decimal only if one doesn't already exist
        if (!currentInput.includes('.')) {
            currentInput += '.';
            updateDisplay();
        }
    }

    function handleOperator(nextOperator) {
        if (currentInput === 'Error') return;

        const inputValue = parseFloat(currentInput);

        if (operator && !shouldResetDisplay) {
            if (previousInput === '') { // Handle case like "5 * ="
                 previousInput = currentInput; // Use current input as previous if none exists
            }
             const result = performCalculation();
             if (result === 'Error') {
                 currentInput = 'Error';
                 updateDisplay();
                 operator = null; // Reset operator after error
                 previousInput = '';
                 return; // Stop further processing on error
             }
             currentInput = String(result);
             previousInput = currentInput; // Result becomes the new previous input
             updateDisplay();
        } else {
             previousInput = currentInput;
        }


        operator = nextOperator;
        shouldResetDisplay = true; // Expecting the next number
    }

    function performCalculation() {
        const prev = parseFloat(previousInput);
        const current = parseFloat(currentInput);

        if (isNaN(prev) || isNaN(current)) {
             // If operator exists but one number is invalid, maybe keep the valid number?
             // Or return error? Let's return error for simplicity.
             if (operator) return 'Error';
             // If no operator, just return the current valid number or 0
             return isNaN(current) ? (isNaN(prev) ? 0 : prev) : current;
        }

        let result;
        switch (operator) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                if (current === 0) {
                    return 'Error'; // Division by zero
                }
                result = prev / current;
                break;
            default:
                // If no operator was pressed, just return the current number
                return current;
        }
        // Limit precision to avoid long decimals
        return parseFloat(result.toPrecision(12));
    }

    function handleEquals() {
         if (currentInput === 'Error') return;
         // Only calculate if an operator is set and we haven't just calculated
         if (operator && !shouldResetDisplay) {
             const result = performCalculation();
             if (result === 'Error') {
                 currentInput = 'Error';
             } else {
                 currentInput = String(result);
                 // After equals, the operation is complete. Reset operator and previousInput.
                 // The result stays in currentInput for potential chaining (e.g., result + 5 =)
                 previousInput = ''; // Clear previous input after equals
                 operator = null;    // Clear operator after equals
             }
             updateDisplay();
             shouldResetDisplay = true; // Ready for a new calculation sequence
         } else if (!operator && previousInput !== '') {
             // Handle pressing equals repeatedly after an operation (e.g., 5 + 3 = = =)
             // This requires storing the last operation and operand, which adds complexity.
             // For simplicity, this basic version doesn't repeat the last operation on equals.
             // console.log("Repeated equals - basic version does nothing here.");
         }
    }


    // --- Event Listeners ---

    // Image Theme Functions
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            uploadedImage = event.target.result;
            imagePreview.src = uploadedImage;
            imagePreviewContainer.classList.remove('hidden');
            applyImageThemeBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }
    
    function applyImageTheme() {
        if (!uploadedImage) return;
        
        // Save image data and settings
        localStorage.setItem('calculatorImageTheme', uploadedImage);
        localStorage.setItem('useImageAsBackground', useImageAsBackgroundCheckbox.checked);
        localStorage.setItem('useImageAsBodyBackground', useImageAsBodyBackgroundCheckbox.checked);
        localStorage.setItem('extractColorsFromImage', extractColorsCheckbox.checked);
        
        // Apply image as calculator background if checkbox is checked
        if (useImageAsBackgroundCheckbox.checked) {
            document.getElementById('calculator').style.backgroundImage = `url(${uploadedImage})`;
            document.getElementById('calculator').style.backgroundSize = 'cover';
            document.getElementById('calculator').style.backgroundPosition = 'center';
        } else {
            document.getElementById('calculator').style.backgroundImage = 'none';
        }
        
        // Apply image as body background if checkbox is checked
        if (useImageAsBodyBackgroundCheckbox.checked) {
            document.body.style.backgroundImage = `url(${uploadedImage})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
        } else {
            document.body.style.backgroundImage = 'none';
        }
        
        // Extract and apply colors if checkbox is checked
        if (extractColorsCheckbox.checked) {
            extractColorsFromImage(uploadedImage);
        }
    }
    
    function extractColorsFromImage(imageData) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);
            
            // Get image data for color analysis
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Simple color extraction - collect all pixels and find dominant colors
            const colorMap = {};
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Skip transparent pixels
                if (data[i + 3] < 128) continue;
                
                // Group similar colors by rounding
                const key = `${Math.round(r/10)*10},${Math.round(g/10)*10},${Math.round(b/10)*10}`;
                if (!colorMap[key]) {
                    colorMap[key] = { count: 0, r, g, b };
                }
                colorMap[key].count++;
            }
            
            // Convert to array and sort by frequency
            const colors = Object.values(colorMap).sort((a, b) => b.count - a.count);
            
            // Extract top colors for different elements
            if (colors.length > 0) {
                // Main calculator background - use the most dominant color
                const mainColor = colors[0];
                const mainColorHex = rgbToHex(mainColor.r, mainColor.g, mainColor.b);
                root.style.setProperty('--calc-bg', mainColorHex);
                
                // Find a contrasting color for display background
                const displayColor = findContrastingColor(colors, mainColor);
                const displayColorHex = rgbToHex(displayColor.r, displayColor.g, displayColor.b);
                root.style.setProperty('--display-bg', displayColorHex);
                
                // Determine if we need light or dark text based on background brightness
                const displayTextColor = getBrightness(displayColor) > 128 ? '#000000' : '#ffffff';
                root.style.setProperty('--display-text', displayTextColor);
                
                // Button background - use a color that stands out but isn't too dominant
                const buttonColor = colors.length > 2 ? colors[2] : colors[0];
                const buttonColorHex = rgbToHex(buttonColor.r, buttonColor.g, buttonColor.b);
                root.style.setProperty('--button-bg', buttonColorHex);
                
                // Button text color based on button background brightness
                const buttonTextColor = getBrightness(buttonColor) > 128 ? '#000000' : '#ffffff';
                root.style.setProperty('--button-text', buttonTextColor);
                
                // Operator buttons - use a distinct color
                const operatorColor = findDistinctColor(colors, [mainColor, displayColor, buttonColor]);
                const operatorColorHex = rgbToHex(operatorColor.r, operatorColor.g, operatorColor.b);
                root.style.setProperty('--operator-bg', operatorColorHex);
                
                // Generate hover and active states
                root.style.setProperty('--button-hover-bg', adjustBrightness(buttonColorHex, 20));
                root.style.setProperty('--button-active-bg', adjustBrightness(buttonColorHex, -20));
                root.style.setProperty('--operator-hover-bg', adjustBrightness(operatorColorHex, 20));
                root.style.setProperty('--operator-active-bg', adjustBrightness(operatorColorHex, -20));
                
                // Set clear and equals button colors
                root.style.setProperty('--clear-bg', '#d9534f'); // Keep standard red for clear
                root.style.setProperty('--clear-hover-bg', '#c9302c');
                root.style.setProperty('--clear-active-bg', '#ac2925');
                root.style.setProperty('--equals-bg', '#5cb85c'); // Keep standard green for equals
                root.style.setProperty('--equals-hover-bg', '#4cae4c');
                root.style.setProperty('--equals-active-bg', '#449d44');
            }
            
            updateSettingsButtonColor();
        };
        img.src = imageData;
    }
    
    // Helper functions for color manipulation
    function rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    function getBrightness(color) {
        return (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
    }
    
    function findContrastingColor(colors, baseColor) {
        // Find a color that has good contrast with the base color
        for (let i = 0; i < colors.length; i++) {
            const color = colors[i];
            const contrast = Math.abs(getBrightness(baseColor) - getBrightness(color));
            if (contrast > 50) return color; // Return first color with decent contrast
        }
        // If no good contrast found, return a modified version of the base color
        return {
            r: 255 - baseColor.r,
            g: 255 - baseColor.g,
            b: 255 - baseColor.b
        };
    }
    
    function findDistinctColor(colors, usedColors) {
        // Find a color that's distinct from already used colors
        for (let i = 0; i < colors.length; i++) {
            const color = colors[i];
            let isDistinct = true;
            
            for (const usedColor of usedColors) {
                const difference = Math.abs(color.r - usedColor.r) + 
                                  Math.abs(color.g - usedColor.g) + 
                                  Math.abs(color.b - usedColor.b);
                if (difference < 150) { // If colors are too similar
                    isDistinct = false;
                    break;
                }
            }
            
            if (isDistinct) return color;
        }
        
        // If no distinct color found, return a default
        return { r: 255, g: 204, b: 0 }; // Default to yellow
    }
    
    function adjustBrightness(hex, percent) {
        // Convert hex to RGB
        let r = parseInt(hex.substring(1, 3), 16);
        let g = parseInt(hex.substring(3, 5), 16);
        let b = parseInt(hex.substring(5, 7), 16);
        
        // Adjust brightness
        r = Math.max(0, Math.min(255, r + percent));
        g = Math.max(0, Math.min(255, g + percent));
        b = Math.max(0, Math.min(255, b + percent));
        
        // Convert back to hex
        return rgbToHex(Math.round(r), Math.round(g), Math.round(b));
    }
    
    function resetImageTheme() {
        // Clear image theme data
        localStorage.removeItem('calculatorImageTheme');
        localStorage.removeItem('useImageAsBackground');
        localStorage.removeItem('useImageAsBodyBackground');
        localStorage.removeItem('extractColorsFromImage');
        
        // Reset UI
        uploadedImage = null;
        imagePreview.src = '';
        imagePreviewContainer.classList.add('hidden');
        applyImageThemeBtn.disabled = true;
        document.getElementById('calculator').style.backgroundImage = 'none';
        document.body.style.backgroundImage = 'none';
        
        // Switch to default theme if currently using image theme
        if (document.querySelector('input[name="theme"]:checked').value === 'image') {
            document.querySelector('input[name="theme"][value="default"]').checked = true;
            applyTheme('default');
        }
    }
    
    // Settings Menu Listeners
    settingsBtn.addEventListener('click', () => settingsMenu.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsMenu.classList.add('hidden'));
    themeRadios.forEach(radio => radio.addEventListener('change', (e) => applyTheme(e.target.value)));
    fontRadios.forEach(radio => radio.addEventListener('change', (e) => applyFont(e.target.value)));
    customColorPickers.forEach(picker => {
        picker.addEventListener('input', (e) => saveCustomColor(e.target.dataset.var, e.target.value));
        picker.addEventListener('change', (e) => saveCustomColor(e.target.dataset.var, e.target.value)); // Ensure saving on close
    });
    
    // Image Theme Listeners
    imageUploadInput.addEventListener('change', handleImageUpload);
    applyImageThemeBtn.addEventListener('click', () => {
        applyImageTheme();
        // Set radio button to image theme
        const imageThemeRadio = document.createElement('input');
        imageThemeRadio.type = 'radio';
        imageThemeRadio.name = 'theme';
        imageThemeRadio.value = 'image';
        imageThemeRadio.id = 'theme-image';
        imageThemeRadio.checked = true;
        
        // Check if the radio button already exists
        if (!document.getElementById('theme-image')) {
            const label = document.createElement('label');
            label.htmlFor = 'theme-image';
            label.textContent = 'Image';
            
            const container = document.createElement('div');
            container.appendChild(imageThemeRadio);
            container.appendChild(label);
            
            // Insert after the last theme option
            const customThemeOption = document.getElementById('theme-custom').parentNode;
            customThemeOption.parentNode.insertBefore(container, customThemeOption.nextSibling);
            
            // Add event listener to the new radio button
            imageThemeRadio.addEventListener('change', () => applyTheme('image'));
        } else {
            document.getElementById('theme-image').checked = true;
        }
        
        applyTheme('image');
    });
    resetImageThemeBtn.addEventListener('click', resetImageTheme);

    // Calculator Buttons Listener (Event Delegation)
    buttonsContainer.addEventListener('click', (event) => {
        const { target } = event;

        // Ensure the click was directly on a button
        if (!target.matches('button')) {
            return;
        }

        const action = target.dataset.action;
        const value = target.value;

        // console.log(`Button Clicked: Action=${action}, Value=${value}`); // Debugging

        switch (action) {
            case 'number':
                inputDigit(value);
                break;
            case 'operator':
                handleOperator(value);
                break;
            case 'decimal':
                inputDecimal();
                break;
            case 'calculate':
                handleEquals();
                break;
            case 'clear':
                clearCalculator();
                break;
            default:
                console.warn('Unknown button action:', action);
        }
    });

    // --- Initialization ---
    loadSettings(); // Load saved theme/font/colors first
    updateDisplay(); // Initialize display with '0'

}); // End DOMContentLoaded

// --- Regarding otherfunctions.js ---
// If you have code in otherfunctions.js, you would typically:
// 1. Ensure it's included in your HTML:
//    <script src="calculator.js"></script>
//    <script src="otherfunctions.js"></script>  <!-- Make sure it's linked -->
// 2. Call functions from otherfunctions.js within calculator.js where needed,
//    or have otherfunctions.js add its own event listeners if appropriate.
//
// Example: If otherfunctions.js defines a function `calculateSquareRoot(num)`:
// Inside calculator.js, you might add a button with data-action="sqrt"
// and in the switch statement:
// case 'sqrt':
//    if (typeof calculateSquareRoot === 'function') { // Check if function exists
//        currentInput = String(calculateSquareRoot(parseFloat(currentInput)));
//        updateDisplay();
//        shouldResetDisplay = true;
//    } else {
//        console.error("calculateSquareRoot function not found in otherfunctions.js");
//    }
//    break;
