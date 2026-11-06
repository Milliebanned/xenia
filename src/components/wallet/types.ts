import type { AddDelegateKeyOpts } from "@mysten-incubation/memwal/account";

/** The SDK's `WalletSigner` is not exported by name; derive it from the option type it is used in. */
export type WalletSigner = NonNullable<AddDelegateKeyOpts["walletSigner"]>;
