let mode = "starter";
let products = [];
let correctTotal = 0;
let givenNotes = [];
let score = { correct: 0, wrong: 0 };
let countdownTimer = null;
let timerStopped = true;
let timerSeconds = 5;

const denominations = [500, 200, 100, 50, 20, 10, 5, 2, 1];
const productData = [
    { name: "Chocolate", price: 35, icon: "🍫", unit: "piece" },
    { name: "Toy", price: 50, icon: "🧸", unit: "piece" },
    { name: "Apple", price: 20, icon: "🍎", unit: "piece" },
    { name: "Juice", price: 30, icon: "🧃", unit: "bottle" },
    { name: "Notebook", price: 40, icon: "📒", unit: "piece" },
    { name: "Milk", price: 42, icon: "🥛", unit: "litre" },
    { name: "Rice", price: 60, icon: "🍚", unit: "kg" },
    { name: "Cooking Oil", price: 110, icon: "🛢️", unit: "litre" }, // Added
    { name: "Wheat Flour", price: 44, icon: "🌾", unit: "kg" }      // Added
];

let returnNotes = [];
let customerGiven = [];

function isRandomTrue() {
    return Math.random() < 0.65;
}

function startGame() {
    const selected = document.querySelector('input[name="mode"]:checked');
    mode = selected.value;
    document.getElementById("home-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    loadQuestion();
}

function showHelp() {
    document.getElementById("help-popup").style.display = "flex";
}
function closeHelp() {
    document.getElementById("help-popup").style.display = "none";
}

function generateWalletForCustomer(total, needsReturn = true) {
    const maxNotes = 5;
    let attempts = 0;
    const maxAttempts = 50;
    let walletArr = [];

    if(total> 500 || (!needsReturn && isRandomTrue())) {
        walletArr.push(500);
        total = total % 500;
    }
    if(total > 100 && isRandomTrue()) {
        walletArr.push(200);
    } else walletArr.push(100);

    total = total % 100;

    if(total > 50) {
        walletArr.push(50);
        total = total % 50;
    }
    if(!needsReturn || isRandomTrue()) {
        if (total > 10 && isRandomTrue()) {
            walletArr.push(20);
        } else {
            walletArr.push(10);
        }
        total = total % 10;
    }

    if(!needsReturn) {
        walletArr.push(5);
        walletArr.push(2);
        walletArr.push(1);
    } else if (total > 0) {
        if(total % 5!=0) {
            walletArr.push(5);
        }
        if(total % 2!=0) {
            walletArr.push(2);
        }
    }

    if (walletArr.length === 0) {
        walletArr.push(100);
    }

    return walletArr;
}

function generateWalletForShopkeeper(total) {
  return generateWalletForCustomer(total, false);
}

function loadQuestion() {
  clearTimeout(countdownTimer);
  timerStopped = true;
  document.getElementById("next-timer").style.display = "none";
  document.getElementById("pause-button").innerText = "Stop Timer";
  document.getElementById("feedback").innerText = "";
  document.getElementById("total-input").value = "";
  document.getElementById("change-input").value = "";
  document.getElementById("change-question").style.display = "none";
  document.getElementById("shopkeeper-given").innerText = "";
  document.getElementById("return-selection").innerHTML = "";
  givenNotes = [];
  returnNotes = [];
  customerGiven = [];
  updateGivenDisplay();

  setupInstructions();
  setupProducts();
  setupWalletAndCustomer();
}

function setupInstructions() {
  const instructionMap = {
    starter: "🔵 One item only. Give exact or calculate return.",
    explorer: "🟢 Give exact amount using shown notes/coins.",
    master: "🟡 Pay using big notes and calculate return.",
    shopkeeper: "🔴 You're the shopkeeper! Return correct denominations."
  };
  document.getElementById("instructions").innerText = instructionMap[mode];
}

function setupProducts() {
  products = [];
  correctTotal = 0;
  const itemCount = mode === "starter" ? 1 : 3;

  while (products.length < itemCount) {
    let item = productData[Math.floor(Math.random() * productData.length)];
    if (!products.find(p => p.name === item.name)) {
        let quantity = 1;
        if (mode === "master" || mode === "shopkeeper") {
            if (item.unit === "litre") {
                // Multiples of 0.5 litre
                quantity = (Math.floor(Math.random() * 4) + 1) * 0.5; // 0.5, 1, 1.5, 2
            } else if (item.unit === "kg") {
                // Multiples of 0.25 kg
                quantity = (Math.floor(Math.random() * 8) + 1) * 0.25; // 0.25, 0.5, ..., 2
            } else {
                quantity = Math.floor(Math.random() * 3) + 1;
            }
        }
        products.push({ ...item, quantity });
        correctTotal += item.price * quantity;
    }
  }

  const list = document.getElementById("product-list");
  list.innerHTML = "<h3>Items:</h3>";
  products.forEach(p => {
    list.innerHTML += `${p.icon} ${p.name} – ₹${p.price} per ${p.unit} × ${p.quantity} ${p.unit}<br/>`;
  });

  document.getElementById("total-input").disabled = mode === "starter";
  if (mode === "starter") {
    document.getElementById("total-input").value = correctTotal;
  }
}

function setupWalletAndCustomer() {
    const walletDiv = document.getElementById("wallet");
    walletDiv.innerHTML = "";
    let filtered = [];

    // UI elements
    const paySection = document.getElementById("pay-section");
    const totalQuestion = document.getElementById("total-question");
    const changeLabel = document.getElementById("change-label");
    const changeInput = document.getElementById("change-input");
    const returnDiv = document.getElementById("return-selection");
    const shopkeeperGivenDiv = document.getElementById("shopkeeper-given");
    const selectedDiv = document.getElementById("selected-return-notes");

    // Reset selected notes display and visibility
    if (selectedDiv) {
        if (mode === "shopkeeper") {
            selectedDiv.style.display = "block";
            selectedDiv.innerText = "Select notes to return";
        } else {
            selectedDiv.style.display = "none";
        }
    }

    if (mode === "shopkeeper") {
        // Hide payment UI
        paySection.style.display = "none";
        totalQuestion.style.display = "none";

        // Generate customer payment and shopkeeper wallet
        customerGiven = generateCustomerNotes(correctTotal);
        const customerPaid = customerGiven.reduce((a, b) => a + b, 0);
        filtered = generateWalletForShopkeeper(customerPaid - correctTotal);
        window.correctReturn = getMinimalNotes(customerPaid - correctTotal, filtered);

        // Show customer notes
        if (shopkeeperGivenDiv) {
            const count = {};
            customerGiven.forEach(n => count[n] = (count[n] || 0) + 1);
            shopkeeperGivenDiv.innerText = "Customer gave: " +
                Object.entries(count)
                    .map(([denom, qty]) => `${qty} × ₹${denom}`)
                    .join(", ");
        }

        // Show return selection, hide label and textbox
        document.getElementById("change-question").style.display = "block";
        changeLabel.style.display = "none";
        changeInput.style.display = "none";
        returnDiv.style.display = "block";
        returnDiv.innerHTML = ""; // Clear previous buttons

        // Show only one set of return-selection buttons
        filtered.forEach(val => {
            const btn = document.createElement("button");
            btn.innerText = `₹${val}`;
            btn.onclick = () => {
                returnNotes.push(val);
                updateReturnDisplay();
            };
            returnDiv.appendChild(btn);
        });

        // Reset selected notes display
        updateReturnDisplay();

    } else {
      paySection.style.display = "block";
      totalQuestion.style.display = "block";
      // Determine if return is needed (e.g., wallet can't make exact payment)
      const needsReturn = isRandomTrue();
      if (needsReturn) {
          document.getElementById("change-question").style.display = "block";
          changeLabel.style.display = "inline";
          changeInput.style.display = "inline";
          returnDiv.style.display = "none";
      } else {
          document.getElementById("change-question").style.display = "none";
          changeLabel.style.display = "inline";
          changeInput.style.display = "inline";
          returnDiv.style.display = "none";
      }
      filtered = generateWalletForCustomer(correctTotal, needsReturn);
      window.correctPayment = getMinimalNotes(correctTotal, filtered);

      // Show wallet buttons
      filtered.forEach(val => {
          const btn = document.createElement("button");
          btn.innerText = `₹${val}`;
          btn.onclick = () => addNote(val);
          walletDiv.appendChild(btn);
      });
  }
}

function addNote(value) {
    givenNotes.push(value);
    updateGivenDisplay();
}

function updateGivenDisplay() {
    const div = document.getElementById("given-notes");
    const total = givenNotes.reduce((a, b) => a + b, 0);
    document.getElementById("given-amount").innerText = total;
    div.innerText = givenNotes.map(n => `₹${n}`).join(" + ");
}

function updateReturnDisplay() {
    const display = returnNotes.length
        ? returnNotes.map(n => `₹${n}`).join(" + ")
        : "Select notes to return";
    document.getElementById("change-input").value =
        returnNotes.reduce((a, b) => a + b, 0);

    const selectedDiv = document.getElementById("selected-return-notes");
    if (mode === "shopkeeper") {
        document.getElementById("change-label").innerText =
            "You are returning: " + display;
        if (selectedDiv) {
            selectedDiv.innerText = returnNotes.length
                ? `Selected notes: ${returnNotes.map(n => `₹${n}`).join(" + ")}`
                : "Select notes to return";
        }
    } else {
        document.getElementById("change-label").innerText =
            "How much should the shopkeeper return?";
        if (selectedDiv) selectedDiv.innerText = "";
    }
}

// Refactored: split large `submitAnswer` function into smaller handlers by mode

function submitAnswer() {
  const totalInput = parseFloat(document.getElementById("total-input").value);
  const givenTotal = givenNotes.reduce((a, b) => a + b, 0);
  const feedback = document.getElementById("feedback");

  if (mode === "shopkeeper") {
    handleShopkeeperMode();
  } else {
    if (isNaN(totalInput)) {
      feedback.innerHTML = "❗ <strong>Enter the total amount.</strong>";
      return;
    }
    if (Math.round(totalInput) !== Math.round(correctTotal)) {
      feedback.innerHTML = `❌ <strong>Total is incorrect.</strong><br/>✅ <strong>Correct total:</strong> ₹${correctTotal.toFixed(2)}`;
      score.wrong++;
      updateScore();
      showNextTimer();
      return;
    }
    handlePlayerMode();
  }

  updateScore();
  showNextTimer();
}

function handleShopkeeperMode() {
  const feedback = document.getElementById("feedback");
  const returnTotal = returnNotes.reduce((a, b) => a + b, 0);
  // Calculate the correct return amount (customerGiven total - correctTotal)
  const expectedTotal = customerGiven.reduce((a, b) => a + b, 0) - correctTotal;

  if (returnTotal === expectedTotal) {
    feedback.innerHTML = "✅ <strong>Correct amount returned!</strong>";
    score.correct++;
  } else {
    feedback.innerHTML = `❌ <strong>You returned:</strong> ₹${returnTotal}, <strong>should have returned:</strong> ₹${expectedTotal}`;
    score.wrong++;
  }
}

function handlePlayerMode() {
  const feedback = document.getElementById("feedback");
  const givenTotal = givenNotes.reduce((a, b) => a + b, 0);
  const needsChange = document.getElementById("change-question").style.display !== "none";

  if (needsChange) {
    const userChange = parseInt(document.getElementById("change-input").value);
    if (isNaN(userChange)) {
      feedback.innerHTML = "❗ <strong>Enter the return amount.</strong>";
      return;
    }

    // Accept if givenTotal - userChange === correctTotal
    if (givenTotal - userChange === correctTotal) {
      feedback.innerHTML = "✅ <strong>Correct! Your payment and return are Correct.</strong>";
      score.correct++;
    } else {
      const expected = window.correctReturn.reduce((a, b) => a + b, 0);
      feedback.innerHTML = `💰 <strong>Correct payment:</strong> ${window.correctPayment.map(n => `₹${n}`).join(" + ")}<br/>❌ <strong>You returned:</strong> ₹${userChange}, <strong>should have returned:</strong> ₹${expected}`;
      score.wrong++;
    }
  } else {
    if (givenTotal === correctTotal) {
      feedback.innerHTML = "✅ <strong>Exact change given!</strong>";
      score.correct++;
    } else {
      feedback.innerHTML = `💰 <strong>Correct payment:</strong> ${window.correctPayment.map(n => `₹${n}`).join(" + ")}<br/>❌ <strong>You gave:</strong> ₹${givenTotal}, <strong>should have given:</strong> ₹${correctTotal}`;
      score.wrong++;
    }
  }
}

function updateScore() {
    document.getElementById("score-correct").innerText = score.correct;
    document.getElementById("score-wrong").innerText = score.wrong;
}

function resetRound() {
    givenNotes = [];
    returnNotes = [];
    updateGivenDisplay();
    updateReturnDisplay();
    document.getElementById("feedback").innerText = "";
    document.getElementById("total-input").value = "";
    document.getElementById("change-input").value = "";

    // Clear selected return notes display
    const selectedDiv = document.getElementById("selected-return-notes");
    if (selectedDiv) selectedDiv.innerText = "";

    // Add this line for Change Starter total repopulation
    if (mode === "starter") {
        document.getElementById("total-input").value = correctTotal;
    }
}

function getMinimalNotes(amount, walletArray) {
    if (amount === 0) return [];

    // BFS for exact match first
    let queue = [{
        remaining: amount,
        notesLeft: walletArray.slice(),
        notesUsed: []
    }];
    let visited = new Set();

    while (queue.length) {
        let { remaining, notesLeft, notesUsed } = queue.shift();
        if (remaining === 0) return notesUsed;
        const key = remaining + '|' + notesLeft.sort().join(',');
        if (visited.has(key)) continue;
        visited.add(key);

        for (let i = 0; i < notesLeft.length; i++) {
            let note = notesLeft[i];
            if (note > remaining) continue;
            let nextNotesLeft = notesLeft.slice();
            nextNotesLeft.splice(i, 1);
            queue.push({
                remaining: remaining - note,
                notesLeft: nextNotesLeft,
                notesUsed: notesUsed.concat(note)
            });
        }
    }

    // If no exact match, find minimal overpay
    let minOverpay = Infinity;
    let minNotes = null;
    const n = walletArray.length;
    for (let mask = 1; mask < (1 << n); mask++) {
        let sum = 0;
        let notes = [];
        for (let i = 0; i < n; i++) {
            if (mask & (1 << i)) {
                sum += walletArray[i];
                notes.push(walletArray[i]);
            }
        }
        if (sum >= amount) {
            let overpay = sum - amount;
            if (
                overpay < minOverpay ||
                (overpay === minOverpay && (!minNotes || notes.length < minNotes.length))
            ) {
                minOverpay = overpay;
                minNotes = notes.slice();
            }
        }
    }
    return minNotes || [];
}

function showNextTimer() {
    timerSeconds = 5;
    timerStopped = false;
    document.getElementById("next-timer").style.display = "block";
    document.getElementById("timer-count").innerText = timerSeconds;
    countdownTimer = setInterval(() => {
        if (!timerStopped) {
            timerSeconds--;
            document.getElementById("timer-count").innerText = timerSeconds;
            if (timerSeconds <= 0) {
                clearInterval(countdownTimer);
                loadQuestion();
            }
        }
    }, 1000);
}

function skipTimer() {
    clearInterval(countdownTimer);
    document.getElementById("next-timer").style.display = "none";
    loadQuestion();
}

function stopTimer() {
    timerStopped = true;
    clearInterval(countdownTimer);
    document.getElementById("next-timer").style.display = "none";
}

function generateCustomerNotes(total) {
    // Only use large denominations
    const bigDenoms = [500, 200, 100, 50];
    let paid = 0;
    let notes = [];
    // Always overpay by at least 1 note
    while (paid < total) {
        // Pick the largest denomination that doesn't exceed (total - paid), or just pick the smallest if overpay is needed
        let denom = bigDenoms.find(d => d <= (total - paid)) || bigDenoms[bigDenoms.length - 1];
        notes.push(denom);
        paid += denom;
        // If we already overpaid, break
        if (paid > total) break;
    }
    return notes;
}

