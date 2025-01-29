let startTime, interval;
let elapsedTime = 0;
let isRunning = false;  // Track if the timer is running

const timerElement = document.getElementById("timer");
const logElement = document.getElementById("log");
const startStopButton = document.getElementById("startStopButton");
const logForm = document.getElementById("logForm");
const saveLogButton = document.getElementById("saveLogButton");

function startTimer() {
    startTime = Date.now() - elapsedTime;
    interval = setInterval(updateTimer, 10);  // Update every 10ms for milliseconds
    isRunning = true;
    startStopButton.textContent = "Stop";  // Change to "Stop"
    logForm.style.display = "none";  // Hide the form while the timer is running
}

function stopTimer() {
    clearInterval(interval);
    elapsedTime = Date.now() - startTime;
    isRunning = false;
    startStopButton.textContent = "Start";  // Change back to "Start"
    
    logForm.style.display = "block";  // Show the log form when the timer stops
}

function resetTimer() {
    clearInterval(interval);
    elapsedTime = 0;
    timerElement.textContent = "00:00:00.000";
    isRunning = false;
    startStopButton.textContent = "Start";  // Reset to "Start" after reset
    logForm.style.display = "none";  // Hide the form on reset
}

function updateTimer() {
    elapsedTime = Date.now() - startTime;
    const time = new Date(elapsedTime);
    const minutes = String(time.getMinutes()).padStart(2, "0");
    const seconds = String(time.getSeconds()).padStart(2, "0");
    const hours = String(time.getUTCHours()).padStart(2, "0");
    const milliseconds = String(time.getMilliseconds()).padStart(3, "0");
    timerElement.textContent = `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

function logTime() {
    // Get the selected topic, notes, difficulty, and correct answer
    const selectedTopic = document.querySelector('input[name="topic"]:checked');
    const topic = selectedTopic ? selectedTopic.value : "Untitled";

    const notes = document.getElementById("sessionNotes").value;
    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked');
    const difficulty = selectedDifficulty ? selectedDifficulty.value : "Unrated";

    // Capture whether the session was solved correctly
    const selectedCorrect = document.querySelector('input[name="correct"]:checked');
    const correct = selectedCorrect ? selectedCorrect.value : "No";  // Default to "No" if not selected

    const logEntry = {
        topic: topic,
        time: timerElement.textContent,
        elapsedTime: elapsedTime, // Store the actual time spent
        difficulty: difficulty,
        notes: notes || "None",
        correct: correct // Add the 'correct' field here
    };
    
    // Save to localStorage
    let logs = JSON.parse(localStorage.getItem("studyLogs")) || [];
    logs.push(logEntry);
    localStorage.setItem("studyLogs", JSON.stringify(logs));
    
    // Display log
    displayLogs();
}


function calculateAverages(logs) {
    const last3Logs = logs.slice(-3); // Get last 3 logs
    const last5Logs = logs.slice(-5); // Get last 5 logs

    const avgTime3 = last3Logs.reduce((acc, log) => acc + log.elapsedTime, 0) / last3Logs.length;
    const avgTime5 = last5Logs.reduce((acc, log) => acc + log.elapsedTime, 0) / last5Logs.length;

    return {
        avgTime3: formatTime(avgTime3),
        avgTime5: formatTime(avgTime5)
    };
}

function formatTime(milliseconds) {
    const date = new Date(milliseconds);
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const millisecondsStr = String(date.getMilliseconds()).padStart(3, "0");
    return `${hours}:${minutes}:${seconds}.${millisecondsStr}`;
}

function displayLogs() {
    const logs = JSON.parse(localStorage.getItem("studyLogs")) || [];

    // Calculate the averages
    const { avgTime3, avgTime5 } = calculateAverages(logs);

    // Display the averages
    const averagesElement = document.getElementById("averages");
    averagesElement.innerHTML = `
        <p>Average Time for Last 3 Sessions: ${avgTime3}</p>
        <p>Average Time for Last 5 Sessions: ${avgTime5}</p>
    `;

    const logTable = document.getElementById("log");
    logTable.innerHTML = logs.map((log, index) => {
        return `
            <tr>
                <td>${log.topic}</td>
                <td>${log.time}</td>
                <td>${log.difficulty}</td>
                <td>${log.notes}</td>
                <td>${log.correct}</td> <!-- Display "Yes" or "No" here -->
                <td><button class="delete-button" data-index="${index}">Delete</button></td> <!-- Correct position for the delete button -->
            </tr>
        `;
    }).join("");

    // Add event listeners for delete buttons
    document.querySelectorAll(".delete-button").forEach(button => {
        button.addEventListener("click", deleteLog);
    });
}


function deleteLog(event) {
    const index = event.target.getAttribute("data-index");
    let logs = JSON.parse(localStorage.getItem("studyLogs")) || [];
    logs.splice(index, 1);  // Remove the log at the clicked index
    localStorage.setItem("studyLogs", JSON.stringify(logs));
    displayLogs();
}

// Save log when the save button is pressed
saveLogButton.addEventListener("click", function() {
    logTime();
    resetTimer();  // Reset the timer after saving the log
});

// Toggle between start and stop
startStopButton.addEventListener("click", function() {
    if (isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
});

// Download the raw log as a JSON file
document.getElementById("downloadLogButton").addEventListener("click", function() {
    const logs = JSON.parse(localStorage.getItem("studyLogs")) || [];
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "studyLogs.json";
    link.click();
});

// Handle the "Upload Logs" button click
document.getElementById('uploadLogButton').addEventListener('click', function() {
    document.getElementById('fileInput').click();  // Trigger file input click
});

// Handle the file input change (when a user selects a file)
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];  // Get the selected file
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const fileContent = e.target.result;
        
        try {
            // Assuming the log file is a JSON array
            const newLogs = JSON.parse(fileContent);
            let logs = JSON.parse(localStorage.getItem("studyLogs")) || [];

            // Combine the current logs with the new logs
            logs = logs.concat(newLogs);

            // Save the updated logs back to localStorage
            localStorage.setItem("studyLogs", JSON.stringify(logs));

            // After uploading, display updated logs
            displayLogs();

            alert("Logs uploaded and appended successfully!");
        } catch (error) {
            alert("Error parsing the log file. Please check the file format.");
        }
    };

    reader.readAsText(file);  // Read the file content as text
});

// Function to append the log to the table
function appendLogToTable(log) {
    const logTable = document.getElementById('log');
    const newRow = logTable.insertRow();

    const topicCell = newRow.insertCell(0);
    const timeCell = newRow.insertCell(1);
    const difficultyCell = newRow.insertCell(2);
    const notesCell = newRow.insertCell(3);
    const solvedCell = newRow.insertCell(4);
    const actionCell = newRow.insertCell(5);

    topicCell.textContent = log.topic || "N/A";
    timeCell.textContent = log.time || "N/A";
    difficultyCell.textContent = log.difficulty || "N/A";
    notesCell.textContent = log.notes || "N/A";
    solvedCell.textContent = log.correct || "N/A"; // "correct" field used instead of "solvedCorrectly"

    // Optionally, add action buttons like "Edit" or "Delete" to the action cell
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = () => {
        logTable.deleteRow(newRow.rowIndex);  // Delete the row
    };
    actionCell.appendChild(deleteButton);
}

document.getElementById("resetButton").addEventListener("click", resetTimer);

// Display logs on page load
displayLogs();

// Spacebar event to start/stop timer
document.addEventListener("keydown", function(event) {
    if (event.key === " ") {
        if (isRunning) {
            stopTimer();
        } else {
            startTimer();
        }
    }
});
