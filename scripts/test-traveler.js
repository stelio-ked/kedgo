async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/traveler/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "theoked25@gmail.com" })
    });
    console.log("Status:", res.status);
    console.log("Text:", await res.text());
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
test();
