const canvas = document.getElementById("clock");
const ctx = canvas.getContext("2d");
let currentTime = {};
let questionIndex = 0;
let score = 0;
let totalQuestions = 0;
let questions = [];
let timer;
let timeLeft = 15;

document.getElementById("config").style.display = "block";

function toggleCustomNumbers() {
  const style = document.getElementById("numberStyle").value;
  document.getElementById("customNumbers").style.display = style === "custom" ? "inline-block" : "none";
}

function generateQuestions() {
  const q = [];
  function addTime(hour, minute, label) {
    q.push({ hour, minute, label });
  }
  for (let i = 0; i < 5; i++) addTime(rand(1, 12), rand(0, 59), 'exact');

  if (document.getElementById("includeTo").checked) {
    for (let i = 0; i < 4; i++) {
      let min = rand(1, 29);
      let h = rand(1, 12);
      let m = 60 - min;
      addTime((h === 1 ? 12 : h - 1), m, 'to');
    }
  }
  if (document.getElementById("includeQto").checked) {
    for (let i = 0; i < 4; i++) addTime((rand(1, 12) - 1) || 12, 45, 'qto');
  }
  if (document.getElementById("includeQpast").checked) {
    for (let i = 0; i < 4; i++) addTime(rand(1, 12), 15, 'qpast');
  }
  if (document.getElementById("includeHalf").checked) {
    for (let i = 0; i < 3; i++) addTime(rand(1, 12), 30, 'half');
  }
  for (let i = 0; i < 15; i++) addTime(rand(1, 12), rand(0, 11) * 5, 'round');
  return shuffle(q);
}

function startTest() {
  document.getElementById("config").style.display = "none";
  document.getElementById("clock").style.display = "block";
  document.getElementById("timer").style.display = "block";
  document.getElementById("feedback").style.display = "block";
  document.getElementById("score").style.display = "block";
  timeLeft = parseInt(document.getElementById("timePerQuestion").value) || 15;
  questions = generateQuestions();
  totalQuestions = questions.length;
  nextQuestion();
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function drawClock(hour, minute) {
  ctx.clearRect(0, 0, 300, 300);
  ctx.beginPath();
  ctx.arc(150, 150, 140, 0, 2 * Math.PI);
  ctx.stroke();

  const numberStyle = document.getElementById("numberStyle").value;
  let custom = [];
  if (numberStyle === "custom") {
    const txt = document.getElementById("customNumbers").value;
    custom = txt.split(/[\s,]+/).map(n => parseInt(n)).filter(n => n >= 1 && n <= 12);
  }

  for (let i = 1; i <= 12; i++) {
    if (
      numberStyle === "all" ||
      (numberStyle === "only12" && i === 12) ||
      (numberStyle === "12-6" && [12, 6].includes(i)) ||
      (numberStyle === "12-3-6-9" && [3, 6, 9, 12].includes(i)) ||
      (numberStyle === "custom" && custom.includes(i))
    ) {
      let angle = (i - 3) * (Math.PI * 2) / 12;
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(i.toString(), 150 + 110 * Math.cos(angle), 150 + 110 * Math.sin(angle));
    }
  }

  for (let i = 0; i < 60; i++) {
    let angle = i * Math.PI / 30;
    let len = (i % 5 === 0) ? 20 : 10;
    ctx.beginPath();
    ctx.moveTo(150 + 130 * Math.cos(angle), 150 + 130 * Math.sin(angle));
    ctx.lineTo(150 + (130 - len) * Math.cos(angle), 150 + (130 - len) * Math.sin(angle));
    ctx.stroke();
  }

  let hourAngle = ((hour % 12) + minute / 60) * Math.PI / 6;
  ctx.beginPath();
  ctx.moveTo(150, 150);
  ctx.lineTo(150 + 60 * Math.cos(hourAngle - Math.PI / 2), 150 + 60 * Math.sin(hourAngle - Math.PI / 2));
  ctx.lineWidth = 5;
  ctx.stroke();

  let minAngle = minute * Math.PI / 30;
  ctx.beginPath();
  ctx.moveTo(150, 150);
  ctx.lineTo(150 + 90 * Math.cos(minAngle - Math.PI / 2), 150 + 90 * Math.sin(minAngle - Math.PI / 2));
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.lineWidth = 1;
}

function formatLabel(h, m) {
  if (currentTime.label === 'qto') return `Quarter to ${(h % 12) + 1}`;
  if (currentTime.label === 'qpast') return `Quarter past ${h}`;
  if (currentTime.label === 'half') return `Half past ${h}`;
  if (currentTime.label === 'to') return `${60 - m} minutes to ${(h % 12) + 1}`;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function submitAnswer() {
  clearInterval(timer);
  const userHour = parseInt(document.getElementById("hourInput").value);
  const userMin = parseInt(document.getElementById("minuteInput").value);
  let correct = false;

  const expectedHour = currentTime.hour;
  const expectedMin = currentTime.minute;

  if (currentTime.label === 'exact') {
    correct = (userHour === expectedHour && Math.abs(userMin - expectedMin) <= 1);
  } else {
    correct = (userHour === expectedHour && userMin === expectedMin);
  }

  if (correct) {
    score++;
    document.getElementById("feedback").textContent = "✅ Correct!";
  } else {
    document.getElementById("feedback").textContent = `❌ Wrong. Correct: ${formatLabel(expectedHour, expectedMin)}`;
  }

  questionIndex++;
  document.getElementById("score").textContent = `Score: ${score}/${questionIndex}`;

  if (questionIndex < totalQuestions) {
    setTimeout(() => nextQuestion(), 1200);
  } else {
    document.getElementById("feedback").textContent += ` Quiz completed! Final Score: ${score}/${totalQuestions}`;
    document.getElementById("timer").style.display = "none";
  }
}


function submitAnswerMCQ(selectedLabel) {
  clearInterval(timer);
  const correctLabel = formatLabel(currentTime.hour, currentTime.minute);
  const correct = selectedLabel === correctLabel;
  if (correct) {
    score++;
    document.getElementById("feedback").textContent = "✅ Correct!";
  } else {
    document.getElementById("feedback").textContent = `❌ Wrong. Correct: ${correctLabel}`;
  }
  questionIndex++;
  document.getElementById("score").textContent = `Score: ${score}/${questionIndex}`;
  if (questionIndex < totalQuestions) {
    setTimeout(() => nextQuestion(), 1200);
  } else {
    document.getElementById("feedback").textContent += ` Quiz completed! Final Score: ${score}/${totalQuestions}`;
    document.getElementById("timer").style.display = "none";
  }
}

function startTimer() {
  timeLeft = parseInt(document.getElementById("timePerQuestion").value) || 15;
  document.getElementById("timeLeft").textContent = timeLeft;
  timer = setInterval(() => {
    timeLeft--;
    document.getElementById("timeLeft").textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (['to', 'qto', 'qpast', 'half'].includes(currentTime.label)) {
        submitAnswerMCQ("timeout");
      } else {
        submitAnswer();
      }
    }
  }, 1000);
}

function nextQuestion() {
  currentTime = questions[questionIndex];
  drawClock(currentTime.hour, currentTime.minute);
  document.getElementById("feedback").textContent = "";
  document.getElementById("inputDiv").style.display = "none";
  document.getElementById("mcqDiv").style.display = "none";
  document.getElementById("mcqDiv").innerHTML = "";

  if (["to", "qto", "qpast", "half"].includes(currentTime.label)) {
    const correct = formatLabel(currentTime.hour, currentTime.minute);
    const options = [correct];
    while (options.length < 4) {
      const h = rand(1, 12);
      const m = [0, 15, 30, 45][rand(0, 3)];
      const label = formatLabel(h, m);
      if (!options.includes(label)) options.push(label);
    }
    shuffle(options);
    options.forEach(opt => {
      const btn = document.createElement("div");
      btn.className = "mcq-option";
      btn.textContent = opt;
      btn.onclick = () => submitAnswerMCQ(opt);
      document.getElementById("mcqDiv").appendChild(btn);
    });
    document.getElementById("mcqDiv").style.display = "block";
  } else {
    document.getElementById("inputDiv").style.display = "block";
    document.getElementById("hourInput").value = "";
    document.getElementById("minuteInput").value = "";
    document.getElementById("hourInput").focus();
  }
  startTimer();
}