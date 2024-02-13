export const getBiconomySDK = async () => {
  const { Biconomy } = await import('@biconomy/mexa');
  return Biconomy;
};

export const getBiconomy = async (provider, apiKey): Promise<any> => {
  const Biconomy = await getBiconomySDK();
  return new Promise((resolve, reject) => {
    const biconomy = new Biconomy(provider, {
      apiKey,
      debug: true,
    });
    biconomy.onEvent(biconomy.READY, () => {
      resolve(biconomy);
    }).onEvent(biconomy.ERROR, (error) => {
      reject(error);
    });
  });
};
