const display = document.getElementById("display");

let currentInput = "0";

function updateDisplay() {
    display.value = currentInput;
}

document.querySelector(".buttons").addEventListener("click", function(event) {
    const button = event.target.closest("button");

    if (!button) return;

    if (button.dataset.number !== undefined) {
        if (currentInput === "0" || currentInput === "Error") {
            currentInput = button.dataset.number;
        } else {
            currentInput += button.dataset.number;
        }
    }

    else if (button.dataset.operator !== undefined) {
        currentInput += button.dataset.operator;
    }

    else if (button.dataset.action === "clear") {
        currentInput = "0";
    }

    else if (button.dataset.action === "delete") {
        currentInput = currentInput.slice(0, -1) || "0";
    }

    else if (button.dataset.action === "decimal") {
        currentInput += ".";
    }

    else if (button.dataset.action === "equals") {
        try {
            if (!/^[0-9+\-*/. ]+$/.test(currentInput)) {
                throw new Error("Invalid");
            }

            const answer = Function(
                '"use strict"; return (' + currentInput + ')'
            )();

            if (!Number.isFinite(answer)) {
                throw new Error("Invalid");
            }

           const expression = currentInput;

currentInput = String(answer);

// Save calculation in Django database
fetch('/save-calculation/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken':document.querySelector('[name=csrfmiddlewaretoken]').value
    },
    body: JSON.stringify({
        expression: expression,
        result: String(answer)
    })
})
.then(response => response.json())
.then(data => {
    console.log(data);
})
.catch(error => {
    console.error('Error saving calculation:', error);
});

        } catch {
            currentInput = "Error";
        }
    }

    updateDisplay();
});

function loadHistory() {
    fetch('/history/')
        .then(response => response.json())
        .then(data => {
            const historyList = document.getElementById('history-list');

            historyList.innerHTML = '';

            if (data.history.length === 0) {
                const li = document.createElement('li');
                li.textContent = 'No calculations yet';
                historyList.appendChild(li);
                return;
            }

            data.history.forEach(item => {
                const li = document.createElement('li');

                li.textContent =
                    `${item.expression} = ${item.result}`;

                historyList.appendChild(li);
            });
        })
        .catch(error => {
            console.error('Error loading history:', error);
        });
}

// Load history when the webpage opens
loadHistory();





document.getElementById("clear-history-btn")
    .addEventListener("click", function () {

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