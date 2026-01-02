/* ---------- تنظیمات ---------- */
const stopWords = [
    "و", "در", "به", "از", "که", "را", "برای", "این", "آن", "با",
    "می", "شود", "شد", "است", "هم", "کرد", "کردن", "باشد"
];

const percentInputEl = document.getElementById("percent");
const percentLabel = document.getElementById("percentLabel");
const pdfBtn = document.getElementById("pdfBtn");

percentInputEl.oninput = () => {
    percentLabel.innerText = percentInputEl.value + "%";
};

/* ---------- پردازش متن ---------- */
function normalize(text) {
    return text
        .replace(/[^\u0600-\u06FF\s.!؟]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function splitSentences(text) {
    return text.split(/(?<=[.!؟])/).map(s => s.trim()).filter(Boolean);
}

function getWords(text) {
    return normalize(text)
        .split(" ")
        .filter(w => w.length > 2 && !stopWords.includes(w));
}

function scoreSentences(sentences) {
    const allWords = getWords(sentences.join(" "));
    const freq = {};
    allWords.forEach(w => freq[w] = (freq[w] || 0) + 1);

    return sentences.map(s => {
        const words = getWords(s);
        let score = 0;
        words.forEach(w => score += freq[w] || 0);
        score *= Math.log(words.length + 1);
        return { s, score };
    });
}

/* ---------- اجرای الگوریتم ---------- */
function processText() {
    const text = inputText.value.trim();
    if (!text) { alert("متن وارد کن"); return; }

    const percent = percentInputEl.value / 100;
    const sentences = splitSentences(text);
    const scored = scoreSentences(sentences);

    scored.sort((a, b) => b.score - a.score);

    let target = Math.max(3, Math.floor(scored.length * percent));
    let selected = scored.slice(0, target);

    const lastScore = selected[selected.length - 1].score;
    const epsilon = lastScore * 0.85;
    scored.forEach(x => { if (x.score >= epsilon) selected.push(x) });

    selected = [...new Map(selected.map(x => [x.s, x])).values()];

    const selectedSet = new Set(selected.map(x => x.s));
    render(sentences, selectedSet);
}

/* ---------- رندر ---------- */
function render(sentences, selected) {
    content.innerHTML = sentences.map(s => {
        if (selected.has(s)) {
            return `<div class="sentence highlight">${s}</div>`;
        }
        return `<div class="sentence">${s}</div>`;
    }).join("");

    mainPage.style.display = "none";
    highlightPage.style.display = "block";

    preparePDFButton();
}

function goBack() {
    highlightPage.style.display = "none";
    mainPage.style.display = "block";
}

/* ---------- PDF ---------- */
function preparePDFButton() {
    pdfBtn.disabled = true;
    pdfBtn.innerText = "در حال آماده‌سازی PDF...";

    setTimeout(() => {
        pdfBtn.disabled = false;
        pdfBtn.innerText = "اشتراک PDF";
        pdfBtn.onclick = createPDF;
    }, 20000); // 20 ثانیه
}

function createPDF() {
    const element = document.getElementById("content");

    const opt = {
        margin: 0.6,
        filename: "nokta.pdf",
        html2canvas: { scale: 2 },
        pagebreak: { mode: ["avoid-all", "css"] },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
    };

    html2pdf().set(opt).from(element).outputPdf("blob").then(blob => {
        const file = new File([blob], "nokta.pdf", { type: "application/pdf" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file] }).catch(() => { });
        } else {
            html2pdf().set(opt).from(element).save();
        }
    });
}