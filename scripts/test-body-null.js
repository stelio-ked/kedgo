async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/itineraries", {
      method: "GET",
      body: null
    });
    console.log("Status:", res.status);
  } catch(err) {
    console.error("Fetch failed with body: null:", err);
  }
}
test();
