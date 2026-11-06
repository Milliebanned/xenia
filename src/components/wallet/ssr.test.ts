import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { Providers } from "./Providers";
import { WalletConnectButton } from "./ConnectButton";
describe("ssr", () => { it("renders on server without window", () => {
  const html = renderToString(createElement(Providers, null, createElement("p", null, "hi"), createElement(WalletConnectButton)));
  expect(html).toContain("hi"); console.log(html);
}); });
