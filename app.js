let data = JSON.parse(localStorage.getItem("study")) || [];

function save() {
    localStorage.setItem("study", JSON.stringify(data));
}

// Countdown
function updateCountdown() {
    let target = new Date("2026-10-31T23:59:59");
    let now = new Date();
    let diff = target - now;

    if (diff <= 0) {
        document.getElementById("countdown").innerText = "⏰ Time's up!";
        return;
    }

    let days = Math.floor(diff / (1000*60*60*24));
    let hours = Math.floor((diff / (1000*60*60)) % 24);
    let minutes = Math.floor((diff / (1000*60)) % 60);
    let seconds = Math.floor((diff / 1000) % 60);

    document.getElementById("countdown").innerText =
        `⏳ ${days}d ${hours}h ${minutes}m ${seconds}s left`;
}

setInterval(updateCountdown, 1000);
updateCountdown();

function addSubject() {
    let name = document.getElementById("subjectName").value;
    let total = Number(document.getElementById("totalClasses").value);
    let startDate = document.getElementById("startDate").value;
    let endDate = document.getElementById("endDate").value;

    if (!name || !total || !startDate || !endDate) return;

    data.push({ name, total, completed: 0, startDate, endDate });

    save();
    render();

    document.getElementById("subjectName").value = "";
    document.getElementById("totalClasses").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
}

function increase(i) {
    if (data[i].completed < data[i].total) data[i].completed++;
    save(); render();
}

function decrease(i) {
    if (data[i].completed > 0) data[i].completed--;
    save(); render();
}

function deleteSubject(i) {
    if (confirm("Delete this subject?")) {
        data.splice(i, 1);
        save(); render();
    }
}

function editField(i, field, span) {
    let input = document.createElement("input");
    input.type = "number";
    input.value = data[i][field];

    input.onblur = () => {
        let val = Number(input.value);
        if (val >= 0) data[i][field] = val;
        save(); render();
    };

    input.onkeypress = e => { if (e.key === "Enter") input.blur(); };

    span.replaceWith(input);
    input.focus();
}

function editDate(i, field, span) {
    let input = document.createElement("input");
    input.type = "date";
    input.value = data[i][field];

    input.onchange = () => input.blur();
    input.onblur = () => {
        if (input.value) data[i][field] = input.value;
        save(); render();
    };

    span.replaceWith(input);
    input.focus();
}

function render() {
    let list = document.getElementById("list");
    list.innerHTML = "";

    let totalPending = 0;

    data.forEach((sub, i) => {
        let pending = sub.total - sub.completed;
        totalPending += pending;

        let today = new Date();
        let end = new Date(sub.endDate);

        let daysLeft = Math.max(0, Math.ceil((end - today) / (1000*60*60*24)));
        let required = daysLeft > 0 ? (pending / daysLeft).toFixed(2) : pending;

        let warning = "";
        if (daysLeft === 0 && pending > 0) {
            warning = `<div class="warning">⚠ Deadline crossed!</div>`;
        } else if (required > 3) {
            warning = `<div class="warning">⚠ High daily load!</div>`;
        }

        let div = document.createElement("div");
        div.className = "card";

        div.innerHTML = `
            <b>${sub.name}</b><br>

            Start: 
            <span class="editable" onclick="editDate(${i}, 'startDate', this)">
                ${sub.startDate}
            </span><br>

            End: 
            <span class="editable" onclick="editDate(${i}, 'endDate', this)">
                ${sub.endDate}
            </span><br><br>

            Total: 
            <span class="editable" onclick="editField(${i}, 'total', this)">
                ${sub.total}
            </span><br>

            Completed: 
            <span class="editable" onclick="editField(${i}, 'completed', this)">
                ${sub.completed}
            </span><br>

            Pending: ${pending}<br>
            Days Left: ${daysLeft}<br>
            Required/Day: ${required}<br>

            ${warning}

            <br>
            <button class="add" onclick="increase(${i})">+ Done</button>
            <button class="sub" onclick="decrease(${i})">Undo</button>
            <button class="del" onclick="deleteSubject(${i})">Delete</button>
        `;

        list.appendChild(div);
    });

    document.getElementById("pendingTotal").innerText =
        `📊 Total Pending Classes: ${totalPending}`;
}

render();

function goToMCQ() {
    window.location.href = "mcq.html";
}
