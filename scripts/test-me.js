async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/me");
    console.log("Status:", res.status);
    console.log("Text:", await res.text());
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}
test();
