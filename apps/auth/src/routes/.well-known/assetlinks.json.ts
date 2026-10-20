import { createAPIFileRoute } from "@tanstack/start/api";

const assetLinks = [
  {
    relation: [
      "delegate_permission/common.handle_all_urls",
      "delegate_permission/common.get_login_creds",
    ],
    target: {
      namespace: "android_app",
      package_name: "tech.scryme.app",
      sha256_cert_fingerprints: process.env.ANDROID_SHA256_FINGERPRINTS
        ? process.env.ANDROID_SHA256_FINGERPRINTS.split(",").map((fp) => fp.trim())
        : [
            "10:5B:AA:89:FE:E0:4F:2F:DF:01:E6:BC:54:AC:F1:C8:B3:34:6F:A5:A8:16:DF:EC:60:8E:EE:48:8B:BC:FA:21",
          ],
    },
  },
];

function handleAssetLinks() {
  return new Response(JSON.stringify(assetLinks), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export const APIRoute = createAPIFileRoute("/.well-known/assetlinks.json")({
  GET: handleAssetLinks,
});
