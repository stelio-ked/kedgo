async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/itineraries", {
      method: "GET",
      headers: { "Authorization": "Bearer BAD_TOKEN" }
    });
    console.log("Status:", res.status);
  } catch(err) {
    console.error("Fetch failed with bad token:", err);
  }
}
test();
