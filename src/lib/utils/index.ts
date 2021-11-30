export const truncate = (str: string, n: number) => {
  return str.length > n ? str.substr(0, n - 1).trim() + "\u2026" : str;
};

export const generateRandomInt = (max = 100) => Math.ceil(Math.random() * max);
