import fs from "fs";
import dns from "dns";
import { createClient } from "@supabase/supabase-js";

try {
  dns.setServers(["2001:4860:4860::6464", "2001:4860:4860::6460"]);
  const origLookup = dns.lookup;
  dns.lookup = function (h, o, cb) {
    const callback = typeof o === "function" ? o : cb;
    const opts = typeof o === "object" ? o : {};
    dns.resolve6(h, (err, addrs) => {
      if (!err && addrs?.length) {
        if (opts?.all) return callback(null, addrs.map((a) => ({ address: a, family: 6 })));
        return callback(null, addrs[0], 6);
      }
      return origLookup.call(dns, h, o, cb);
    });
  };
} catch {}

const envContent = fs.readFileSync(".env.local", "utf-8");
let url, key;
for (const line of envContent.split("\n")) {
  const [k, ...v] = line.trim().split("=");
  if (k === "NEXT_PUBLIC_SUPABASE_URL") url = v.join("=").trim().replace(/^['"]|['"]$/g, "");
  if (k === "NEXT_PUBLIC_SUPABASE_ANON_KEY" || k === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
    key = v.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
}

const supabase = createClient(url, key);
const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();

console.log("LIVE SITE SETTINGS ROW (id=1):");
console.log(JSON.stringify(data, null, 2));

const { data: mediaAssets } = await supabase.from("media_assets").select("id, bucket_id, storage_path, access_mode");
console.log("\nLIVE MEDIA ASSETS ROW COUNT:", mediaAssets?.length || 0);
if (mediaAssets?.length) {
  console.log("Assets:", mediaAssets);
}
