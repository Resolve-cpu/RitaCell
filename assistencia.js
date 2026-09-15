// RitaCell — Assistência técnica (assistencia.html)

let assistenciaBound = false;
let selectedMotivo = null;
const motivoMap = { tela: "Tela quebrada", bateria: "Bateria", carregamento: "Não carrega" };

function showFlowStep(n) {
  document.querySelectorAll(".flow-step").forEach((el) => el.classList.remove("active"));
  document.getElementById(`step${n}`)?.classList.add("active");
  ["prog1", "prog2", "prog3", "prog4"].forEach((id, i) => {
    document.getElementById(id)?.classList.toggle("done", i < n);
  });
}

function paintMotivoSelection() {
  document.querySelectorAll("[data-motivo]").forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.motivo === selectedMotivo);
  });
  const toStep2 = document.getElementById("toStep2");
  if (toStep2) toStep2.disabled = !selectedMotivo;
}

function updateSendLink() {
  const marca = document.getElementById("marca")?.value.trim() || "";
  const modelo = document.getElementById("modelo")?.value.trim() || "";
  const detalhes = document.getElementById("detalhes")?.value.trim() || "";
  const nome = document.getElementById("nomeCliente")?.value.trim() || "";
  const aparelho = [marca, modelo].filter(Boolean).join(" ");

  let msg = "Olá! Vim pelo site da RitaCell.";
  if (nome) msg += ` Meu nome é ${nome}.`;
  msg += `\n\nAparelho: ${aparelho || "não informado"}`;
  msg += `\nProblema: ${selectedMotivo || "a diagnosticar"}`;
  if (detalhes) msg += `\nDetalhes: ${detalhes}`;
  msg += "\n\nGostaria de solicitar uma avaliação.";

  const sendBtn = document.getElementById("sendBtn");
  if (sendBtn) sendBtn.href = `https://wa.me/5511953672504?text=${encodeURIComponent(msg)}`;
}

function initAssistenciaPage() {
  const params = new URLSearchParams(window.location.search);
  const motivo = params.get("motivo");
  selectedMotivo = (motivo && motivoMap[motivo]) || null;

  ["marca", "modelo", "detalhes", "nomeCliente"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  if (!assistenciaBound) {
    assistenciaBound = true;
    document.getElementById("motivoGrid").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-motivo]");
      if (!btn) return;
      selectedMotivo = btn.dataset.motivo;
      paintMotivoSelection();
    });
    document.getElementById("toStep2").addEventListener("click", () => showFlowStep(2));
    document.getElementById("toStep1Back").addEventListener("click", () => showFlowStep(1));
    document.getElementById("toStep2Back").addEventListener("click", () => showFlowStep(2));
    document.getElementById("toStep3Back").addEventListener("click", () => showFlowStep(3));
    document.getElementById("toStep3").addEventListener("click", () => showFlowStep(3));
    document.getElementById("toStep4").addEventListener("click", () => {
      const marca = document.getElementById("marca").value.trim();
      const modelo = document.getElementById("modelo").value.trim();
      const detalhes = document.getElementById("detalhes").value.trim();
      const aparelho = [marca, modelo].filter(Boolean).join(" ") || "não informado";
      document.getElementById("summaryBox").innerHTML = `
        <strong>Problema:</strong> ${selectedMotivo}<br>
        <strong>Aparelho:</strong> ${aparelho}
        ${detalhes ? `<br><strong>Detalhes:</strong> ${detalhes}` : ""}
      `;
      updateSendLink();
      showFlowStep(4);
    });
    document.getElementById("nomeCliente").addEventListener("input", updateSendLink);
  }

  paintMotivoSelection();
  showFlowStep(1);
}

initAssistenciaPage();
