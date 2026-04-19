/* Central analysis helper: renders insight cards and produces textual reports */
const Analyze = (function () {
  /* insight types: info | success | warn | danger | action */
  function insight(type, title, detail) {
    const emoji = { info: "ℹ️", success: "✅", warn: "⚠️", danger: "🚨", action: "🎯" }[type] || "ℹ️";
    const color = { info: "", success: "success", warn: "amber", danger: "danger", action: "" }[type] || "";
    return `
      <div class="list-item analyze-${color}" style="border-left:4px solid ${
        color === "success" ? "var(--success)" :
        color === "amber" ? "var(--amber)" :
        color === "danger" ? "var(--danger)" :
        "var(--navy)"
      };background:${
        color === "success" ? "#dcfce7" :
        color === "amber" ? "#fef3c7" :
        color === "danger" ? "#fee2e2" :
        "#f1f5f9"
      }">
        <div class="li-main">
          <div class="li-title">${emoji} ${UI.escape(title)}</div>
          ${detail ? `<div class="li-sub">${UI.escape(detail)}</div>` : ""}
        </div>
      </div>
    `;
  }

  function card(icon, title, summaryHTML, insightsHTML, actionsHTML) {
    return `
      <div class="card analyze-card">
        <h3>${icon} ${UI.escape(title)}</h3>
        ${summaryHTML || ""}
        ${insightsHTML || ""}
        ${actionsHTML ? `<div style="margin-top:8px"><strong>🎯 Öneriler</strong>${actionsHTML}</div>` : ""}
      </div>
    `;
  }

  function empty(icon, msg) {
    return `<div class="card analyze-card"><h3>${icon} Otomatik Analiz</h3>${UI.emptyState("🔎", msg)}</div>`;
  }

  /* Convert structured analysis to plain text (for reports) */
  function toText(title, lines) {
    let out = "=".repeat(60) + "\n" + title.toUpperCase() + "\n" + "=".repeat(60) + "\n";
    lines.forEach(l => { out += "- " + l + "\n"; });
    return out + "\n";
  }

  return { insight, card, empty, toText };
})();
