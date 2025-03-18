export const formatUpperToLisible = (value: string) => {
  return capitalize(value.toLowerCase().replace("_", " "));
};

export const capitalize = (value: string) => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};
