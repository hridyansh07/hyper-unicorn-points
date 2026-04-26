import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useActiveAddress } from '../state/ActiveAddressContext';
import { SEEDED_ADDRESSES, USER_PERSONAS, type SeededAddress } from '../lib/personas';
import { shortAddr } from '../lib/format';

export function AddressSwitcher() {
  const { address, setAddress } = useActiveAddress();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const activePersona = USER_PERSONAS[address];

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const chooseAddress = (nextAddress: SeededAddress) => {
    setAddress(nextAddress);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-dashed border-warm-line bg-warm-card/60 font-mono text-[11px] text-warm-ink-soft cursor-pointer transition-colors hover:border-pp-purple hover:text-warm-ink"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-pp-green shadow-[0_0_6px_rgba(0,208,145,0.6)]" />
        <span>{shortAddr(address)}</span>
        <span className="hidden lg:inline text-warm-ink-faint">/ {activePersona.label}</span>
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-warm-ink/30 px-4 py-6 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="wf-card wf-card-dashed w-full max-w-[760px] max-h-[calc(100vh-48px)] overflow-auto p-5 sm:p-6 shadow-[0_24px_70px_rgba(42,31,58,0.24)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="min-w-0">
                <div className="wf-eyebrow">Choose mock user</div>
                <h2 id={titleId} className="mt-1 text-[22px] font-bold tracking-normal text-warm-ink">
                  Persona wallets
                </h2>
                <p className="mt-1 font-mono text-[12px] leading-5 text-warm-ink-soft">
                  Switch between seeded users to preview different points behaviors.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close user picker"
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex-shrink-0 rounded-full border border-dashed border-warm-line bg-transparent font-mono text-[14px] leading-none text-warm-ink-soft transition-colors hover:border-pp-purple hover:text-pp-purple"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SEEDED_ADDRESSES.map((candidate) => {
                const selected = candidate === address;
                const persona = USER_PERSONAS[candidate];

                return (
                  <button
                    key={candidate}
                    type="button"
                    onClick={() => chooseAddress(candidate)}
                    className={[
                      'text-left rounded-[10px] border p-4 transition-all duration-200',
                      selected
                        ? 'border-pp-purple bg-pp-purple/[0.06] shadow-[0_0_0_3px_rgba(78,20,208,0.12)]'
                        : 'border-warm-line-soft bg-warm-card hover:border-warm-line',
                    ].join(' ')}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[14px] leading-5 text-warm-ink">
                        {persona.label}
                      </div>
                      <div className="mt-1 font-mono text-[10.5px] text-warm-ink-faint">
                        {shortAddr(candidate)}
                      </div>
                    </div>

                    <div className="wf-divider-dashed" style={{ margin: '12px 0' }} />

                    <div className="space-y-1.5 font-mono text-[11px] leading-5 text-warm-ink-soft">
                      <p>{persona.lines[0]}</p>
                      <p>{persona.lines[1]}</p>
                    </div>

                    <div className="mt-3 flex items-center justify-end font-mono text-[10px]">
                      <span className={selected ? 'text-pp-purple font-semibold' : 'text-warm-ink-faint'}>
                        {selected ? 'Current' : 'Select'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
