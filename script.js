
"use strict";

const form = document.getElementById("goal-form");
const goalNameInput = document.getElementById("goal-name");
const goalValueInput = document.getElementById("goal-value");
const goalSavedInput = document.getElementById("goal-saved");
const goalMonthsInput = document.getElementById("goal-months");
const monthsValue = document.getElementById("months-value");

const resultPanel = document.getElementById("result-panel");
const monthlyResult = document.getElementById("monthly-result");
const remainingResult = document.getElementById("remaining-result");
const deadlineResult = document.getElementById("deadline-result");
const resultCaption = document.getElementById("result-caption");
const resultNote = document.getElementById("result-note");

const saveGoalButton = document.getElementById("save-goal");
const goalList = document.getElementById("goal-list");
const goalCount = document.getElementById("goal-count");

const STORAGE_KEY = "meuFuturoMetasV1";

let currentCalculation = null;
let goals = loadGoals();

function formatMoney(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function loadGoals() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return [];

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter((goal) =>
      goal &&
      typeof goal.id === "string" &&
      typeof goal.name === "string" &&
      Number.isFinite(goal.target) &&
      Number.isFinite(goal.saved) &&
      Number.isFinite(goal.months) &&
      goal.target > 0 &&
      goal.saved >= 0 &&
      goal.months >= 1
    );
  } catch (error) {
    console.warn("Não foi possível carregar as metas.", error);
    return [];
  }
}

function persistGoals() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    return true;
  } catch (error) {
    console.error("Não foi possível salvar as metas.", error);
    alert(
      "Não foi possível salvar as metas neste navegador. " +
      "Verifique se o armazenamento está disponível."
    );
    return false;
  }
}

function getCalculation() {
  const name = goalNameInput.value.trim();
  const target = Number(goalValueInput.value);
  const saved = Number(goalSavedInput.value);
  const months = Number(goalMonthsInput.value);

  if (!name) {
    alert("Digite o nome do seu objetivo.");
    goalNameInput.focus();
    return null;
  }

  if (
    !Number.isFinite(target) ||
    !Number.isFinite(saved) ||
    !Number.isFinite(months) ||
    target <= 0 ||
    saved < 0 ||
    months < 1
  ) {
    alert("Confira os valores e o prazo informados.");
    return null;
  }

  if (saved > 1000000000000 || target > 1000000000000) {
    alert("Informe um valor menor para realizar o planejamento.");
    return null;
  }

  const remaining = Math.max(0, target - saved);
  const monthly = remaining / months;

  return {
    name,
    target,
    saved,
    remaining,
    months,
    monthly
  };
}

function updateResult(calculation) {
  currentCalculation = calculation;

  monthlyResult.innerHTML = "";

  const amountText = document.createElement("span");
  amountText.textContent = formatMoney(calculation.monthly);

  monthlyResult.appendChild(amountText);

  const periodText = document.createElement("span");
  periodText.textContent = "/mês";

  monthlyResult.appendChild(periodText);

  remainingResult.textContent = formatMoney(calculation.remaining);

  deadlineResult.textContent =
    calculation.months === 1
      ? "1 mês"
      : `${calculation.months} meses`;

  if (calculation.remaining === 0) {
    resultCaption.textContent = "Parabéns! Sua meta financeira já foi alcançada.";
    resultNote.textContent =
      "O valor informado já cobre o objetivo. Você pode criar outra meta ou ajustar seu planejamento.";
  } else {
    resultCaption.textContent =
      "Para alcançar sua meta, você precisa guardar:";

    resultNote.textContent =
      "Estimativa sem juros, inflação ou mudanças de renda. " +
      "Escolha um valor mensal compatível com sua realidade.";
  }

  resultPanel.classList.add("visible");
  saveGoalButton.textContent = "Adicionar às minhas metas +";
}

goalMonthsInput.addEventListener("input", () => {
  monthsValue.textContent = goalMonthsInput.value;

  if (currentCalculation) {
    currentCalculation = null;
    resultPanel.classList.remove("visible");
  }
});

[goalNameInput, goalValueInput, goalSavedInput].forEach((input) => {
  input.addEventListener("input", () => {
    currentCalculation = null;
    resultPanel.classList.remove("visible");
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const calculation = getCalculation();

  if (!calculation) return;

  updateResult(calculation);
});

saveGoalButton.addEventListener("click", () => {
  if (!currentCalculation) {
    alert("Calcule sua meta antes de adicioná-la.");
    return;
  }

  const goal = {
    id: createId(),
    name: currentCalculation.name,
    target: currentCalculation.target,
    saved: currentCalculation.saved,
    months: currentCalculation.months,
    createdAt: new Date().toISOString()
  };

  goals.unshift(goal);

  if (!persistGoals()) {
    goals.shift();
    return;
  }

  renderGoals();

  saveGoalButton.textContent = "Meta adicionada ✓";

  document.getElementById("metas").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  return element;
}

function renderGoals() {
  goalList.replaceChildren();
  goalCount.textContent = goals.length;

  if (goals.length === 0) {
    const empty = createElement("div", "empty-state");

    const icon = createElement("div", "empty-icon", "↗");
    const title = createElement("h3", "", "Suas metas começam aqui");
    const description = createElement(
      "p",
      "",
      "Use a calculadora acima para criar sua primeira meta e visualizar seu planejamento."
    );
    const link = createElement("a", "", "Criar minha primeira meta ↓");

    link.href = "#calculadora";

    empty.append(icon, title, description, link);
    goalList.appendChild(empty);
    return;
  }

  goals.forEach((goal) => {
    const card = createElement("article", "saved-goal");
    const top = createElement("div", "saved-goal-top");
    const titleArea = createElement("div");
    const title = createElement("h3", "", goal.name);
    const subtitle = createElement(
      "p",
      "goal-subtitle",
      goal.months === 1 ? "Prazo: 1 mês" : `Prazo: ${goal.months} meses`
    );

    const deleteButton = createElement("button", "delete-goal", "×");
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Excluir a meta ${goal.name}`);

    deleteButton.addEventListener("click", () => {
      const confirmed = window.confirm(
        `Deseja excluir a meta "${goal.name}"?`
      );

      if (!confirmed) return;

      const previousGoals = goals;
      goals = goals.filter((item) => item.id !== goal.id);

      if (!persistGoals()) {
        goals = previousGoals;
        return;
      }

      renderGoals();
    });

    titleArea.append(title, subtitle);
    top.append(titleArea, deleteButton);

    const percentage = Math.min(
      100,
      Math.max(0, (goal.saved / goal.target) * 100)
    );

    const progressHead = createElement("div", "saved-progress-head");
    const progressLabel = createElement("span", "", "Progresso da meta");
    const progressPercent = createElement(
      "strong",
      "",
      `${percentage.toLocaleString("pt-BR", {
        maximumFractionDigits: 1
      })}%`
    );

    progressHead.append(progressLabel, progressPercent);

    const track = createElement("div", "saved-progress-track");
    const fill = createElement("div", "saved-progress-fill");
    fill.style.width = `${percentage}%`;

    track.appendChild(fill);

    const stats = createElement("div", "saved-goal-stats");

    const targetStat = createElement("div");
    targetStat.append(
      createElement("span", "", "Valor da meta"),
      createElement("strong", "", formatMoney(goal.target))
    );

    const savedStat = createElement("div");
    savedStat.append(
      createElement("span", "", "Já economizado"),
      createElement("strong", "", formatMoney(goal.saved))
    );

    stats.append(targetStat, savedStat);

    const updateButton = createElement(
      "button",
      "goal-update",
      "Atualizar valor economizado +"
    );

    updateButton.type = "button";

    updateButton.addEventListener("click", () => {
      const answer = window.prompt(
        `Quanto você tem economizado para "${goal.name}"?\n` +
        "Digite o valor total acumulado em reais:",
        String(goal.saved).replace(".", ",")
      );

      if (answer === null) return;

      const normalized = answer.trim().replace(/\s/g, "").replace(",", ".");
      const newSaved = Number(normalized);

      if (
        normalized === "" ||
        !Number.isFinite(newSaved) ||
        newSaved < 0 ||
        newSaved > 1000000000000
      ) {
        alert("Digite um valor válido, igual ou maior que zero.");
        return;
      }

      const previousSaved = goal.saved;
      goal.saved = newSaved;

      if (!persistGoals()) {
        goal.saved = previousSaved;
        return;
      }

      renderGoals();
    });

    card.append(top, progressHead, track, stats, updateButton);
    goalList.appendChild(card);
  });
}

renderGoals();
