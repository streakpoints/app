import * as React from 'react'
import { providers } from 'ethers'
import { useWalletClient } from 'wagmi'
 
export function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
  };
  const provider = new providers.Web3Provider(transport, network);
  const signer = provider.getSigner(account.address);
  return signer;
}
 
/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
export function useEthersSigner() {
  const { data: walletClient } = useWalletClient({ chainId: 137 });
  return React.useMemo(
    () => (walletClient ? walletClientToSigner(walletClient) : undefined),
    [walletClient],
  );
}
