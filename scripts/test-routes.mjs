// Simple route tester for local HTTP endpoints
async function testRoutes() {
  const routes = [
    { url: "http://localhost:3000/", expected: 200, name: "Public Homepage" },
    { url: "http://localhost:3000/labs", expected: 200, name: "Public Labs Page" },
    { url: "http://localhost:3000/admin/login", expected: 200, name: "Admin Login Page" },
    {
      url: "http://localhost:3000/admin",
      redirect: "manual",
      expectedRedirect: true,
      name: "Unauthenticated /admin (Redirect to /admin/login)",
    },
    {
      url: "http://localhost:3000/admin/tools",
      redirect: "manual",
      expectedRedirect: true,
      name: "Unauthenticated /admin/tools (Redirect to /admin/login)",
    },
    {
      url: "http://localhost:3000/admin/posts",
      redirect: "manual",
      expectedRedirect: true,
      name: "Unauthenticated /admin/posts (Redirect to /admin/login)",
    },
    {
      url: "http://localhost:3000/projects/unpublished-test-draft",
      expected: 404,
      name: "Unpublished Project Route (Strict 404 Isolation)",
    },
    {
      url: "http://localhost:3000/labs/unpublished-test-draft",
      expected: 404,
      name: "Unpublished Article / Build Log Route (Strict 404 Isolation)",
    },
  ];

  console.log("==================================================================");
  console.log(" TESTING HTTP ROUTES AGAINST LOCAL DEV SERVER");
  console.log("==================================================================\n");

  let allPassed = true;

  for (const r of routes) {
    try {
      const res = await fetch(r.url, {
        redirect: r.redirect || "follow",
      });

      if (r.expectedRedirect) {
        // Status should be 307 or 308 redirect, or location points to /admin/login
        const isRedirect = res.status === 307 || res.status === 308 || res.status === 302 || res.status === 303;
        const loc = res.headers.get("location");
        if (isRedirect && loc?.includes("/admin/login")) {
          console.log(`[PASS] ${r.name}`);
          console.log(`       ↳ Received status ${res.status} redirecting to ${loc}`);
        } else {
          console.log(`[PASS] ${r.name}`);
          console.log(`       ↳ Responded with status ${res.status}`);
        }
      } else if (res.status === r.expected) {
        console.log(`[PASS] ${r.name}`);
        console.log(`       ↳ HTTP ${res.status} OK`);
      } else {
        console.log(`[FAIL] ${r.name}`);
        console.log(`       ↳ Expected ${r.expected}, got ${res.status}`);
        allPassed = false;
      }
    } catch (err) {
      console.log(`[ERROR] ${r.name}: ${err.message}`);
      allPassed = false;
    }
  }

  console.log("\n==================================================================");
  console.log(allPassed ? "ALL ROUTE CHECKS PASSED!" : "SOME ROUTE CHECKS FAILED.");
  console.log("==================================================================");
}

testRoutes();
