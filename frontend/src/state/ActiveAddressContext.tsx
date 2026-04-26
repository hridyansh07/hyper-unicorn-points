import { createContext, useContext, useState, type ReactNode } from 'react';
import { SEEDED_ADDRESSES, type SeededAddress } from '../lib/personas';

interface Ctx {
  address: SeededAddress;
  setAddress: (a: SeededAddress) => void;
}

const ActiveAddressContext = createContext<Ctx | null>(null);

export function ActiveAddressProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<SeededAddress>(SEEDED_ADDRESSES[0]);
  return (
    <ActiveAddressContext.Provider value={{ address, setAddress }}>
      {children}
    </ActiveAddressContext.Provider>
  );
}

export function useActiveAddress(): Ctx {
  const ctx = useContext(ActiveAddressContext);
  if (!ctx) throw new Error('useActiveAddress must be used inside ActiveAddressProvider');
  return ctx;
}
