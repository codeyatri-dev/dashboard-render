//// src/apiHelpers.js
//export async function fetchInstagramFollowers() {
//  try {
//    const res = await fetch("http://127.0.0.1:8000/api/followers");
//    if (!res.ok) throw new Error(`HTTP ${res.status}`);
//    const data = await res.json();
//    console.log("API raw response (apiHelpers):", data);
//
//    // Support several possible shapes; prefer code.yatri
//    const raw = data?.["code.yatri"] ?? data?.followers ?? data?.count ?? data?.instagram ?? data;
//    const num = Number(raw);
//    return Number.isFinite(num) ? num : 0;
//  } catch (err) {
//    console.error("fetchInstagramFollowers error:", err);
//    return 0;
//  }
//}



export async function fetchInstagramFollowers() {
  try {
    const res = await fetch("https://dashboard-tihz.onrender.com/api/followers");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log("API raw response (apiHelpers):", data, typeof data);

    // 👉 Debug exact value
    console.log("code.yatri field:", data["code.yatri"]);

    const raw = data;
    const num = Number(raw);
    console.log("Parsed followers:", raw, "→", num);

    return num
  } catch (err) {
    console.error("fetchInstagramFollowers error:", err);
    return 0;
  }

}
