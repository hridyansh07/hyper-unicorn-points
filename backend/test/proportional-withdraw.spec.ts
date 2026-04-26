describe('proportional withdrawal accounting', () => {
  function removePrincipal(
    principalRaw: bigint,
    withdrawQuantityRaw: bigint,
    shardQuantityRaw: bigint,
  ) {
    return (principalRaw * withdrawQuantityRaw) / shardQuantityRaw;
  }

  it('removes the same percentage of original principal as source quantity', () => {
    const principal = 3_000n * 10n ** 18n;
    const shardQuantity = 1n * 10n ** 18n;
    const withdrawQuantity = 5n * 10n ** 17n;

    expect(removePrincipal(principal, withdrawQuantity, shardQuantity)).toBe(
      1_500n * 10n ** 18n,
    );
  });
});
