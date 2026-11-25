
const display = document.getElementById("display");

let currentInput = "0";
let justCalculated = false;

function updateDisplay() {
    display.value = currentInput;
}


// ==============================
// CALCULATOR BUTTONS
// ==============================

document.querySelector(".buttons").addEventListener("click", function(event) {

    const button = event.target.closest("button");
    console.log("Button clicked:",button.dataset);

    if (!button) return;


    // NUMBER BUTTONS
    if (button.dataset.number !== undefined) {

        if (justCalculated || currentInput === "Error") {
            currentInput = button.dataset.number;
            justCalculated = false;
        }
        else if (currentInput === "0") {
            currentInput = button.dataset.number;
        }
        else {
            currentInput += button.dataset.number;
        }
    }


    // OPERATORS
    else if (button.dataset.operator !== undefined) {

        const operator = button.dataset.operator;
        const lastChar = currentInput.slice(-1);

        if (currentInput === "Error") {
            return;
        }

        if (justCalculated) {
            justCalculated = false;
        }

        // Allow starting with a negative number
        if (currentInput === "0" && operator === "-") {
            currentInput = "-";
        }

        // Prevent operators at the beginning
        else if (currentInput === "0") {
            return;
        }

        // Replace the previous operator
        else if ("+-*/".includes(lastChar)) {
            currentInput = currentInput.slice(0, -1) + operator;
        }

        // Add operator
        else {
            currentInput += operator;
        }
    }


    // CLEAR BUTTON
    else if (button.dataset.action === "clear") {

        currentInput = "0";
        justCalculated = false;
    }


    // DELETE BUTTON
    else if (button.dataset.action === "delete") {

        if (justCalculated || currentInput === "Error") {
            currentInput = "0";
            justCalculated = false;
        }
        else {
            currentInput = currentInput.slice(0, -1) || "0";
        }
    }


    // DECIMAL BUTTON
    else if (button.dataset.action === "decimal") {

        if (justCalculated || currentInput === "Error") {
            currentInput = "0";
            justCalculated = false;
        }

        const parts = currentInput.split(/[+\-*/]/);
        const lastNumber = parts[parts.length - 1];

        if (!lastNumber.includes(".")) {
            currentInput += ".";
        }
    }


    // EQUALS BUTTON
    else if (button.dataset.action === "equals") {

        // Prevent repeated saving after the result is displayed
        if (justCalculated) {
            return;
        }

        try {

            // Validate the expression
            if (!/^[0-9+\-*/. ]+$/.test(currentInput)) {
                throw new Error("Invalid expression");
            }

            // Prevent incomplete expressions
            if ("+-*/".includes(currentInput.slice(-1))) {
                throw new Error("Incomplete expression");
            }

            // Calculate the result
            const answer = Function(
                '"use strict"; return (' + currentInput + ')'
            )();

            // Check for invalid results
            if (!Number.isFinite(answer)) {
                throw new Error("Invalid calculation");
            }

            const expression = currentInput;

            currentInput = String(answer);
            justCalculated = true;

            updateDisplay();


            // SAVE CALCULATION TO DJANGO / MYSQL
            fetch('/save-calculation/', {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector(
                        '[name=csrfmiddlewaretoken]'
                    ).value
                },

                body: JSON.stringify({
                    expression: expression,
                    result: String(answer)
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to save calculation");
                }

                return response.json();
            })
            .then(data => {
                console.log("Calculation saved:", data);
                loadHistory();
            })
            .catch(error => {
                console.error("Error saving calculation:", error);
            });

        }

        catch (error) {
            currentInput = "Error";
            justCalculated = false;
        }
    }

    updateDisplay();
});


// ==============================
// CALCULATION HISTORY
// ==============================

function loadHistory() {

    fetch('/history/')
        .then(response => response.json())
        .then(data => {

            const historyList = document.getElementById("history-list");

            historyList.innerHTML = "";


            // If history is empty
            if (data.history.length === 0) {

                const li = document.createElement("li");

                li.textContent = "No calculations yet";

                historyList.appendChild(li);

                return;
            }


            // Display history
            data.history.forEach(item => {

                const li = document.createElement("li");

                li.textContent = `${item.expression} = ${item.result}`;

                historyList.appendChild(li);
            });
        })

        .catch(error => {
            console.error("Error loading history:", error);
        });
}


// HISTORY BUTTON
document.getElementById("history-btn")
    .addEventListener("click", function() {

        const historyPanel = document.getElementById("history-panel");

        historyPanel.classList.toggle("show");

        loadHistory();
    });


// Load history when webpage opens
loadHistory();


// ==============================
// CLEAR HISTORY
// ==============================

document.getElementById("clear-history-btn")
    .addEventListener("click", function() {

        if (!confirm("Are you sure you want to delete all history?")) {
            return;
        }

        const csrfToken = document.querySelector(
            '[name=csrfmiddlewaretoken]'
        ).value;

        fetch('/clear-history/', {

            method: 'POST',

            headers: {
                'X-CSRFToken': csrfToken
            }
        })

        .then(response => {

            if (!response.ok) {
                throw new Error("Could not clear history");
            }

            return response.json();
        })

        .then(data => {

            alert(data.message);

            loadHistory();
        })

        .catch(error => {

            console.error(error);

            alert("Error clearing history");
        });
    });


// ==============================
// KEYBOARD SUPPORT
// ==============================

document.addEventListener("keydown", function(event) {

    const key = event.key;


    // Numbers
    if (key >= "0" && key <= "9") {

        document.querySelector(`[data-number="${key}"]`).click();
    }


    // Operators
    else if (["+", "-", "*", "/"].includes(key)) {

        document.querySelector(`[data-operator="${key}"]`).click();
    }


    // Enter = Equals
    else if (key === "Enter") {

        event.preventDefault();

        document.querySelector('[data-action="equals"]').click();
    }


    // Backspace = Delete
    else if (key === "Backspace" || key === "Delete") {

        event.preventDefault();

        document.querySelector('[data-action="delete"]').click();
    }


    // C = Clear
    else if (key.toLowerCase() === "c") {

        document.querySelector('[data-action="clear"]').click();
    }


    // Escape = Clear
    else if (key === "Escape") {

        document.querySelector('[data-action="clear"]').click();
    }


    // Decimal
    else if (key === ".") {

        document.querySelector('[data-action="decimal"]').click();
    }

});
