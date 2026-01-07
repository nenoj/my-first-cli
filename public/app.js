document.getElementById("send").onclick = async () => {
  const prompt = document.getElementById("prompt").value;
  const output = document.getElementById("output");

  output.textContent = "Thinking...";

  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const data = await res.json();
  output.textContent = data.output || data.error;
};

