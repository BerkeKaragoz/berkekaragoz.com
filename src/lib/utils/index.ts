export const truncate = (str: string, n: number) => {
  return str.length > n ? str.substr(0, n - 1).trim() + "\u2026" : str;
};

export const placeholderBlurBase64 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAHCAIAAABLMMCEAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABwSURBVBhXYxCVdJNTSmIAA0vHnfYeZ4CIASgEosBAI/WiYslNGNfcnyWoONzatal1C8OiF6ralWBRv3wgZ3lRy4riFogiMPbLD+Ti2Wjh3BqdCVUEUVjIK3jc1tk2rRzIBknA3RAcHFxfXw8Sim4GAL3tJ0j8gTEyAAAAAElFTkSuQmCC";
