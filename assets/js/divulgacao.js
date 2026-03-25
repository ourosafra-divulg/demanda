(function () {
  "use strict";

  const PRODUCT_BG_MAP = {
    LANCE: "../assets/img/LANCE.png",
    OPORTUNIDADE: "../assets/img/OPORTUNIDADE.png"
  };

  const DEFAULT_BG = PRODUCT_BG_MAP.LANCE;

  function getPreview(templateId) {
    return document.querySelector(`[data-template-preview="${templateId}"]`);
  }

  function getBgImgEl(preview) {
    return preview ? preview.querySelector(".previewBg") : null;
  }

  function updatePreview(templateId, field, value) {
    const preview = getPreview(templateId);
    if (!preview) return;

    const target = preview.querySelector(`[data-bind="${field}"]`);
    if (target) {
      target.textContent = String(value || "").trim().toUpperCase();
    }
  }

  function setPreviewBackground(templateId, tipo) {
    const preview = getPreview(templateId);
    if (!preview) return;

    const bgImg = getBgImgEl(preview);
    const img = PRODUCT_BG_MAP[tipo] || DEFAULT_BG;

    if (bgImg) {
      bgImg.src = img;
    }

    preview.classList.remove("is-lance", "is-oportunidade");

    if (tipo === "LANCE") {
      preview.classList.add("is-lance");
    } else if (tipo === "OPORTUNIDADE") {
      preview.classList.add("is-oportunidade");
    }
  }

  function toggleValor(templateId, tipo) {
    const card = document.querySelector(`.templateCard[data-template="${templateId}"]`);
    if (!card) return;

    const valorField = card.querySelector(".field-valor");
    const valorPreview = card.querySelector(".previewValor");
    const valorInput = card.querySelector(`[data-template="${templateId}"][data-field="valor"]`);

    if (tipo === "LANCE") {
      if (valorField) valorField.classList.add("hidden");
      if (valorPreview) valorPreview.classList.add("hidden");
      if (valorInput) valorInput.value = "";
      updatePreview(templateId, "valor", "");
    } else {
      if (valorField) valorField.classList.remove("hidden");
      if (valorPreview) valorPreview.classList.remove("hidden");
    }
  }

  function hasLetters(s) {
    return /[A-ZÀ-Ü]/i.test(String(s || ""));
  }

  function limparDigitacaoNumerica(valor) {
    if (valor == null) return "";

    let v = String(valor);
    v = v.replace(/R\$\s?/gi, "");
    v = v.replace(/[^\d,\.]/g, "");

    const parts = v.split(/[,\.]/);
    if (parts.length <= 1) return v;

    const dec = parts.pop() || "";
    const intPart = parts.join("");
    return intPart + "," + dec;
  }

  function formatarMoedaBR(valor) {
    if (valor == null) return "";

    let v = String(valor).trim();
    if (!v) return "";

    if (hasLetters(v)) return v.toUpperCase();

    v = v.replace(/R\$\s?/gi, "");
    v = v.replace(/\./g, "");
    v = v.replace(/[^\d,]/g, "");

    const partes = v.split(",");
    let reais = partes[0] || "0";
    let centavos = partes[1] || "";

    centavos = centavos.substring(0, 2);
    while (centavos.length < 2) centavos += "0";

    reais = reais.replace(/^0+(?=\d)/, "");
    reais = reais.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return `R$ ${reais || "0"},${centavos}`;
  }

  function handleInput(event) {
    const el = event.target;
    const templateId = el.dataset.template;
    const field = el.dataset.field;

    if (!templateId || !field) return;

    let value = el.value ?? "";

    if (field === "tipo") {
      setPreviewBackground(templateId, value);
      toggleValor(templateId, value);
      return;
    }

    if (field === "valor") {
      let v = String(value).toUpperCase();

      if (!hasLetters(v)) {
        v = limparDigitacaoNumerica(v);
      }

      el.value = v;
      updatePreview(templateId, field, v);
      return;
    }

    value = String(value).trim().toUpperCase();
    el.value = value;
    updatePreview(templateId, field, value);
  }

  function handleBlur(event) {
    const el = event.target;
    const templateId = el.dataset.template;
    const field = el.dataset.field;

    if (!templateId || field !== "valor") return;

    const raw = String(el.value || "").toUpperCase().trim();
    const finalValue = formatarMoedaBR(raw);
    el.value = finalValue;
    updatePreview(templateId, "valor", finalValue);
  }

  function resetTemplate(templateId) {
    const card = document.querySelector(`.templateCard[data-template="${templateId}"]`);
    if (!card) return;

    card.querySelectorAll("input, select").forEach((el) => {
      if (el.tagName === "SELECT") {
        el.selectedIndex = 0;
      } else {
        el.value = "";
      }

      if (el.dataset.field && el.dataset.field !== "tipo") {
        updatePreview(templateId, el.dataset.field, "");
      }
    });

    setPreviewBackground(templateId, "LANCE");
    toggleValor(templateId, "LANCE");
  }

  async function saveTemplate(templateId) {
    const preview = getPreview(templateId);
    if (!preview) return;

    const bgImg = getBgImgEl(preview);
    if (bgImg && (!bgImg.complete || bgImg.naturalWidth === 0)) {
      await new Promise((resolve) => {
        bgImg.addEventListener("load", resolve, { once: true });
        bgImg.addEventListener("error", resolve, { once: true });
      });
    }

    const canvas = await html2canvas(preview, {
      backgroundColor: null,
      scale: 2,
      useCORS: true
    });

    const link = document.createElement("a");
    link.download = `divulgacao-ouro-safra-${templateId}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  }

  function initDefaults() {
    document.querySelectorAll("[data-template-preview]").forEach((preview) => {
      const templateId = preview.dataset.templatePreview;
      const tipoEl = document.querySelector(`[data-template="${templateId}"][data-field="tipo"]`);
      const tipoVal = tipoEl ? tipoEl.value : "LANCE";

      setPreviewBackground(templateId, tipoVal);
      toggleValor(templateId, tipoVal);
    });

    document.querySelectorAll("[data-template][data-field]").forEach((el) => {
      handleInput({ target: el });

      if (el.dataset.field === "valor") {
        handleBlur({ target: el });
      }
    });
  }

  function bindActions() {
    document.querySelectorAll("[data-template][data-field]").forEach((el) => {
      const evt = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evt, handleInput);

      if (el.dataset.field === "valor") {
        el.addEventListener("blur", handleBlur);
      }
    });

    document.querySelectorAll("[data-action='reset']").forEach((btn) => {
      btn.addEventListener("click", () => resetTemplate(btn.dataset.template));
    });

    document.querySelectorAll("[data-action='save']").forEach((btn) => {
      btn.addEventListener("click", () => saveTemplate(btn.dataset.template));
    });

    initDefaults();
  }

  window.addEventListener("DOMContentLoaded", bindActions);
})();
