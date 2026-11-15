export function fold(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function slugify(input: string) {
  return fold(input)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseSpecs(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const index = line.indexOf(":");
      if (index === -1) return { label: "Caractéristique", value: line };
      return { label: line.slice(0, index).trim(), value: line.slice(index + 1).trim() };
    })
    .filter((spec) => spec.label && spec.value);
}

export function specsToText(raw: string) {
  try {
    const specs = JSON.parse(raw) as { label: string; value: string }[];
    if (!Array.isArray(specs)) return "";
    return specs.map((spec) => `${spec.label}: ${spec.value}`).join("\n");
  } catch {
    return "";
  }
}

export function readSpecs(raw: string) {
  try {
    const specs = JSON.parse(raw) as { label: string; value: string }[];
    return Array.isArray(specs) ? specs.filter((spec) => spec?.label && spec?.value) : [];
  } catch {
    return [];
  }
}
